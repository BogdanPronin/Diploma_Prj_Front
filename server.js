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


app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ✅ Добавляем поддержку FormData

app.post("/send", upload.array("attachments"), async (req, res) => {
  const { to, subject, html } = req.body;
  const attachments = req.files;

  console.log("📩 Данные, полученные на сервере:", req.body);

  if (!to || to.trim() === "") {
    console.error("❌ Ошибка: Не указан получатель письма.");
    return res.status(400).json({ error: "Не указан получатель письма" });
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.mail.ru",
    port: 465,
    secure: true,
    auth: {
      user: mailConfig.user,
      pass: mailConfig.pass,
    },
  });

  const formattedAttachments = attachments?.map((file) => ({
    filename: file.originalname,
    content: file.buffer,
  }));

  try {
    let info = await transporter.sendMail({
      from: mailConfig.user,
      to: to.trim(), // ✅ Убираем пробелы
      subject: subject.trim(),
      html: html.trim(),
      attachments: formattedAttachments,
    });

    res.json({ message: "Письмо успешно отправлено", info });
  } catch (error) {
    console.error("❌ Ошибка при отправке письма:", error);
    res.status(500).json({ error: error.toString() });
  }
});





/**
 * Эндпоинт для получения писем из папки "Входящие".
 * Помимо базовой информации, отправляем UID, чтобы фронт мог использовать его для обновления флагов.
 */
app.get('/receive', (req, res) => {
  const category = req.query.category || "INBOX";
  const beforeUid = req.query.beforeUid;
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

      imap.search(['UNSEEN'], (err, unreadResults) => {
        if (err) {
          res.status(500).json({ error: err.toString() });
          imap.end();
          return;
        }

        const totalUnreadMessages = unreadResults.length;

        const searchCriteria = beforeUid 
          ? [['UID', `1:${beforeUid - 1}`]] // ✅ Теперь ищем только письма старше beforeUid
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
                    isRead: attributes.flags.includes('\\Seen'),
                    attachments: parsed.attachments.map((file) => ({
                      filename: file.filename,
                      mimeType: file.contentType,
                      size: file.size || 0,
                    }))
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

// Перемещение письма в другую папку по UID
app.post('/move-to-trash', (req, res) => {
  const { uid } = req.body;

  const imap = new Imap({
    user: mailConfig.user,
    password: mailConfig.pass,
    host: 'imap.mail.ru',
    port: 993,
    tls: true,
  });

  imap.once('ready', () => {
    imap.openBox('INBOX', false, (err) => {
      if (err) {
        console.error('Ошибка при открытии INBOX:', err);
        res.status(500).json({ error: err.toString() });
        imap.end();
        return;
      }

      // Перемещаем письмо в папку Trash
      imap.move(req.body.uid, 'Корзина', (err) => {
        if (err) {
          console.error('Ошибка при перемещении письма:', err);
          res.status(500).json({ error: err.toString() });
        } else {
          res.json({ message: `Письмо с UID ${req.body.uid} перемещено в Корзина.` });
        }
        imap.end();
      });
    });
  });

  imap.once('error', (err) => {
    console.error('Ошибка IMAP:', err);
    res.status(500).json({ error: err.toString() });
  });

  imap.connect();
});

app.post('/delete-forever', (req, res) => {
  const { uid } = req.body;

  const imap = new Imap({
    user: mailConfig.user,
    password: mailConfig.pass,
    host: 'imap.mail.ru',
    port: 993,
    tls: true
  });

  function openFolder(callback) {
    imap.openBox('Корзина', false, callback);
  }

  imap.once('ready', () => {
    openFolder((err) => {
      if (err) {
        console.error('Ошибка при открытии папки:', err);
        res.status(500).json({ error: err.toString() });
        imap.end();
        return;
      }

      // Удаляем письмо навсегда
      imap.addFlags(uid, '\\Deleted', (err) => {
        if (err) {
          console.error('Ошибка при добавлении флага удаления:', err);
          res.status(500).json({ error: err.toString() });
          imap.end();
          return;
        }

        imap.expunge(uid, (expungeErr) => {
          if (expungeErr) {
            console.error('Ошибка при окончательном удалении письма:', expungeErr);
            res.status(500).json({ error: expungeErr.toString() });
          } else {
            console.log(`✅ Письмо UID ${uid} окончательно удалено.`);
            res.json({ message: 'Письмо удалено навсегда' });
          }
          imap.end();
        });
      });
    });
  });

  imap.once('error', (err) => {
    console.error('Ошибка IMAP:', err);
    res.status(500).json({ error: err.toString() });
  });

  imap.once('end', () => {
    console.log('Соединение завершено');
  });

  imap.connect();
});

app.post('/mark-read-batch', (req, res) => {
  const { uids } = req.body;

  if (!uids || !Array.isArray(uids) || uids.length === 0) {
    console.error("❌ Ошибка: Передан пустой или некорректный массив UID.");
    return res.status(400).json({ error: 'Передайте массив UID писем' });
  }

  const imap = new Imap({
    user: mailConfig.user,
    password: mailConfig.pass,
    host: 'imap.mail.ru',
    port: 993,
    tls: true
  });

  function openInbox(callback) {
    imap.openBox('INBOX', false, callback);
  }

  imap.once('ready', () => {
    openInbox((err) => {
      if (err) {
        console.error("❌ Ошибка при открытии INBOX:", err);
        res.status(500).json({ error: err.toString() });
        imap.end();
        return;
      }

      console.log(`📩 Помечаем как прочитанные письма с UID: ${uids.join(", ")}`);

      imap.addFlags(uids, '\\Seen', (err) => {
        if (err) {
          console.error("❌ Ошибка при добавлении флага \\Seen:", err);
          res.status(500).json({ error: err.toString() });
        } else {
          console.log("✅ Успешно помечены как прочитанные:", uids);
          res.json({ message: 'Письма успешно помечены как прочитанные' });
        }
        imap.end();
      });
    });
  });

  imap.once('error', (err) => {
    console.error("❌ Ошибка IMAP:", err);
    res.status(500).json({ error: err.toString() });
  });

  imap.connect();
});

app.get("/emails-from-sender", (req, res) => {
  const senderEmail = req.query.sender;
  if (!senderEmail) return res.status(400).json({ error: "Не указан отправитель" });

  const imap = new Imap({
    user: mailConfig.user,
    password: mailConfig.pass,
    host: "imap.mail.ru",
    port: 993,
    tls: true,
  });

  function openInbox(callback) {
    imap.openBox("INBOX", true, callback);
  }

  imap.once("ready", () => {
    openInbox((err) => {
      if (err) {
        console.error("Ошибка при открытии INBOX:", err);
        res.status(500).json({ error: err.toString() });
        imap.end();
        return;
      }

      imap.search([["FROM", senderEmail]], (err, results) => {
        if (err || !results.length) {
          imap.end();
          return res.json([]);
        }

        const messages = [];
        const fetch = imap.fetch(results, { bodies: "", struct: true });

        fetch.on("message", (msg) => {
          let buffer = "";
          let attributes = {};

          msg.on("body", (stream) => {
            stream.on("data", (chunk) => {
              buffer += chunk.toString("utf8");
            });
          });

          msg.once("attributes", (attrs) => {
            attributes = attrs;
          });

          msg.once("end", () => {
            simpleParser(buffer, (err, parsed) => {
              if (!err) {
                messages.push({
                  uid: attributes.uid,
                  subject: parsed.subject || "<Без темы>",
                  from: parsed.from,
                  to: parsed.to,
                  date: parsed.date,
                  text: parsed.text,
                  html: parsed.html,
                  isRead: attributes.flags.includes("\\Seen"),
                  attachments: parsed.attachments.map((file) => ({
                    filename: file.filename,
                    size: file.size,
                    mimeType: file.contentType,
                  })),
                });
              }

              if (messages.length === results.length) {
                messages.sort((a, b) => new Date(a.date) - new Date(b.date));
                imap.end();
                res.json(messages);
              }
            });
          });
        });
      });
    });
  });

  imap.once("error", (err) => {
    console.error("Ошибка IMAP:", err);
    res.status(500).json({ error: err.toString() });
  });

  imap.connect();
});


app.get("/emails-sent-to", (req, res) => {
  const recipientEmail = req.query.recipient;
  if (!recipientEmail) return res.status(400).json({ error: "Не указан получатель" });

  const imap = new Imap({
    user: mailConfig.user,
    password: mailConfig.pass,
    host: "imap.mail.ru",
    port: 993,
    tls: true,
  });

  function openSent(callback) {
    imap.openBox("Отправленные", true, callback);
  }

  imap.once("ready", () => {
    openSent((err) => {
      if (err) {
        console.error("Ошибка при открытии Sent:", err);
        res.status(500).json({ error: err.toString() });
        imap.end();
        return;
      }

      imap.search([["TO", recipientEmail]], (err, results) => {
        if (err || !results.length) {
          imap.end();
          return res.json([]);
        }

        const messages = [];
        const fetch = imap.fetch(results, { bodies: "", struct: true });

        fetch.on("message", (msg) => {
          let buffer = "";
          let attributes = {};

          msg.on("body", (stream) => {
            stream.on("data", (chunk) => {
              buffer += chunk.toString("utf8");
            });
          });

          msg.once("attributes", (attrs) => {
            attributes = attrs;
          });

          msg.once("end", () => {
            simpleParser(buffer, (err, parsed) => {
              if (!err) {
                messages.push({
                  uid: attributes.uid,
                  subject: parsed.subject || "<Без темы>",
                  from: parsed.from,
                  to: parsed.to,
                  date: parsed.date,
                  text: parsed.text,
                  html: parsed.html,
                  isRead: attributes.flags.includes("\\Seen"),
                  attachments: parsed.attachments.map((file) => ({
                    filename: file.filename,
                    size: file.size,
                    mimeType: file.contentType,
                  })),
                });
              }

              if (messages.length === results.length) {
                messages.sort((a, b) => new Date(a.date) - new Date(b.date));
                imap.end();
                res.json(messages);
              }
            });
          });
        });
      });
    });
  });

  imap.once("error", (err) => {
    console.error("Ошибка IMAP:", err);
    res.status(500).json({ error: err.toString() });
  });

  imap.connect();
});

const fs = require('fs');
const path = require('path');

app.get('/download-attachment', (req, res) => {
  const { uid, filename } = req.query;

  if (!uid || !filename) {
    return res.status(400).json({ error: "Не указан UID письма или имя файла" });
  }

  const imap = new Imap({
    user: mailConfig.user,
    password: mailConfig.pass,
    host: 'imap.mail.ru',
    port: 993,
    tls: true
  });

  function openInbox(callback) {
    imap.openBox("INBOX", true, callback);
  }

  imap.once('ready', () => {
    openInbox((err, box) => {
      if (err) {
        res.status(500).json({ error: err.toString() });
        imap.end();
        return;
      }

      const fetch = imap.fetch([uid], { bodies: '', struct: true });

      fetch.on('message', (msg) => {
        msg.on('body', (stream, info) => {
          let buffer = '';
          stream.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
          });

          stream.once('end', () => {
            simpleParser(buffer, (err, parsed) => {
              if (!err) {
                const attachment = parsed.attachments.find(a => a.filename === filename);
                if (!attachment) {
                  res.status(404).json({ error: "Файл не найден" });
                } else {
                  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                  res.setHeader('Content-Type', attachment.contentType);
                  res.send(attachment.content);
                }
              }
              imap.end();
            });
          });
        });
      });

      fetch.once('error', (err) => {
        res.status(500).json({ error: err.toString() });
        imap.end();
      });
    });
  });

  imap.once('error', (err) => {
    res.status(500).json({ error: err.toString() });
  });

  imap.connect();
});



// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
