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
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); // храним файлы в памяти

app.post('/send', upload.array('attachments'), async (req, res) => {
  const { to, subject, html } = req.body;
  const attachments = req.files;

  const transporter = nodemailer.createTransport({
    host: 'smtp.mail.ru',
    port: 465,
    secure: true,
    auth: {
      user: mailConfig.user,
      pass: mailConfig.pass,
    },
  });

  // Формируем массив вложений для nodemailer
  const formattedAttachments = attachments?.map(file => ({
    filename: file.originalname,
    content: file.buffer,
  }));

  try {
    let info = await transporter.sendMail({
      from: mailConfig.user,
      to,
      subject,
      html,
      attachments: formattedAttachments, // прикрепляем вложения
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
  const category = req.query.category || "INBOX";
  const beforeUid = req.query.beforeUid; // 👈 Для подгрузки старых писем
  const limit = Number(req.query.limit) || 10;

  const imap = new Imap({
    user: mailConfig.user,
    password: mailConfig.pass,
    host: 'imap.mail.ru',
    port: 993,
    tls: true
  });

  function openCategory(callback) {
    imap.openBox(category, true, callback);
  }

  imap.once('ready', () => {
    openCategory((err, box) => {
      if (err) {
        res.status(500).json({ error: err.toString() });
        imap.end();
        return;
      }

      // Поиск непрочитанных писем
      imap.search(['UNSEEN'], (err, unreadResults) => {
        if (err) {
          res.status(500).json({ error: err.toString() });
          imap.end();
          return;
        }

        const totalUnreadMessages = unreadResults.length;

        // Поиск всех писем (или писем старше beforeUid)
        const searchCriteria = beforeUid 
          ? [['UID', `1:${beforeUid - 1}`]] // письма старше указанного UID
          : ['ALL'];

        imap.search(searchCriteria, (err, results) => {
          if (err || !results.length) {
            imap.end();
            return res.json({ 
              totalMessages: box.messages.total, 
              totalUnreadMessages: totalUnreadMessages,
              messages: [] 
            });
          }

          const latestUids = results.slice(-limit).reverse();

          const messages = [];
          const fetch = imap.fetch(latestUids, { bodies: '', struct: true });

          fetch.on('message', (msg) => {
            let buffer = '';
            let attributes = {};

            msg.on('body', (stream) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
            });

            msg.once('attributes', (attrs) => {
              attributes = attrs;
            });

            msg.once('end', () => {
              simpleParser(buffer, (err, parsed) => {
                if (!err) {
                  messages.push({
                    uid: attributes.uid,
                    subject: parsed.subject,
                    from: parsed.from,
                    to: parsed.to,
                    date: parsed.date,
                    text: parsed.text,
                    html: parsed.html,
                    isRead: attributes.flags.includes('\\Seen')
                  });
                }

                if (messages.length === latestUids.length) {
                  messages.sort((a, b) => new Date(b.date) - new Date(a.date));

                  imap.end();
                  res.json({ 
                    totalMessages: box.messages.total, 
                    totalUnreadMessages: totalUnreadMessages,
                    messages 
                  });
                }
              });
            });
          });

          fetch.once('error', (err) => {
            res.status(500).json({ error: err.toString() });
            imap.end();
          });
        });
      });
    });
  });

  imap.once('error', (err) => {
    res.status(500).json({ error: err.toString() });
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

app.get('/folders', (req, res) => {
  const imap = new Imap({
    user: mailConfig.user,
    password: mailConfig.pass,
    host: 'imap.mail.ru',
    port: 993,
    tls: true
  });

  imap.once('ready', () => {
    imap.getBoxes((err, boxes) => {
      if (err) {
        console.error('Ошибка при получении списка папок:', err);
        res.status(500).json({ error: err.toString() });
      } else {
        console.log('📂 Доступные папки:', Object.keys(boxes));
        res.json(Object.keys(boxes)); // Отправляем список папок на фронт
      }
      imap.end();
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
