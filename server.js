require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const Imap = require('node-imap');
const { simpleParser } = require('mailparser');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
// Конфигурация аккаунта mail.ru берётся из .env
const mailConfig = {
  user: process.env.MAIL_USER,
  pass: process.env.MAIL_PASS
};

/**
 * Эндпоинт для отправки письма.
 */
app.post('/send', async (req, res) => {
  const { to, subject, text, html } = req.body;

  const transporter = nodemailer.createTransport({
    host: 'smtp.mail.ru',
    port: 465,
    secure: true,
    auth: {
      user: mailConfig.user,
      pass: mailConfig.pass
    }
  });

  try {
    let info = await transporter.sendMail({
      from: mailConfig.user,
      to,
      subject,
      text,
      html
    });
    res.json({ message: 'Письмо успешно отправлено', info });
  } catch (error) {
    console.error('Ошибка при отправке письма:', error);
    res.status(500).json({ error: error.toString() });
  }
});

/**
 * Эндпоинт для получения писем из папки "Входящие".
 * Помимо базовой информации, отправляем UID, чтобы фронт мог использовать его для обновления флагов.
 */
app.get('/receive', (req, res) => {
  const imap = new Imap({
    user: mailConfig.user,
    password: mailConfig.pass,
    host: 'imap.mail.ru',
    port: 993,
    tls: true
  });

  function openInbox(callback) {
    // Открываем в read-only режиме, так как здесь лишь получаем данные
    imap.openBox('INBOX', true, callback);
  }

  imap.once('ready', () => {
    openInbox((err, box) => {
      if (err) {
        console.error('Ошибка при открытии INBOX:', err);
        res.status(500).json({ error: err.toString() });
        imap.end();
        return;
      }

      // Сначала получаем количество непрочитанных писем
      imap.search(['UNSEEN'], (err, unseenResults) => {
        if (err) {
          console.error('Ошибка при поиске непрочитанных писем:', err);
          res.status(500).json({ error: err.toString() });
          imap.end();
          return;
        }
        const unreadCount = unseenResults.length;

        const messages = [];
        // Берём последние 10 писем (если писем меньше – все)
        const startSeq = box.messages.total > 10 ? box.messages.total - 9 : 1;
        const seqRange = `${startSeq}:${box.messages.total}`;

        const fetch = imap.seq.fetch(seqRange, {
          bodies: '',
          struct: true
        });

        fetch.on('message', (msg, seqno) => {
          let buffer = '';
          let attributes = {};
          msg.on('body', (stream, info) => {
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8');
            });
          });
          msg.once('attributes', (attrs) => {
            attributes = attrs;
          });
          msg.once('end', () => {
            simpleParser(buffer, (err, parsed) => {
              if (err) {
                console.error(`Ошибка парсинга письма seqno=${seqno}:`, err);
              } else {
                // Флаг \Seen означает, что письмо прочитано
                const isRead = attributes.flags && attributes.flags.includes('\\Seen');
                messages.push({
                  uid: attributes.uid,  // Передаём UID для идентификации письма на фронте
                  subject: parsed.subject,
                  from: parsed.from,
                  to: parsed.to,
                  date: parsed.date,
                  text: parsed.text,
                  html: parsed.html,
                  isRead
                });
              }
            });
          });
        });

        fetch.once('error', (err) => {
          console.error('Ошибка выборки писем:', err);
          res.status(500).json({ error: err.toString() });
          imap.end();
        });

        fetch.once('end', () => {
          imap.end();
          res.json({
            totalMessages: box.messages.total,
            unreadCount,
            messages
          });
        });
      });
    });
  });

  imap.once('error', (err) => {
    console.error('Ошибка IMAP:', err);
    res.status(500).json({ error: err.toString() });
  });

  imap.once('end', () => {
    console.log('IMAP соединение завершено');
  });

  imap.connect();
});

/**
 * Эндпоинт для установки флага "прочитано" для указанных писем.
 * Ожидается POST-запрос с JSON: { uids: [12345, 12346, ...] }
 */
app.post('/mark-read', (req, res) => {
  const { uids } = req.body;
  if (!uids || !Array.isArray(uids) || !uids.length) {
    return res.status(400).json({ error: 'Необходимо передать массив UID сообщений.' });
  }

  const imap = new Imap({
    user: mailConfig.user,
    password: mailConfig.pass,
    host: 'imap.mail.ru',
    port: 993,
    tls: true
  });

  function openInbox(callback) {
    // Для изменения флагов необходимо открыть папку в режиме read-write (false)
    imap.openBox('INBOX', false, callback);
  }

  imap.once('ready', () => {
    openInbox((err, box) => {
      if (err) {
        console.error('Ошибка при открытии INBOX:', err);
        res.status(500).json({ error: err.toString() });
        imap.end();
        return;
      }

      // Добавляем флаг \Seen для всех переданных UID
      imap.addFlags(uids, ['\\Seen'], (err) => {
        if (err) {
          console.error('Ошибка установки флага \\Seen:', err);
          res.status(500).json({ error: err.toString() });
        } else {
          res.json({ message: 'Письма успешно помечены как прочитанные.' });
        }
        imap.end();
      });
    });
  });

  imap.once('error', (err) => {
    console.error('Ошибка IMAP:', err);
    res.status(500).json({ error: err.toString() });
  });

  imap.once('end', () => {
    console.log('IMAP соединение завершено');
  });

  imap.connect();
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
