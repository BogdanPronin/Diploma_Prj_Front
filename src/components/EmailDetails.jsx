import { useState, useEffect, useRef } from "react";
import {
  faEllipsisH,
  faReply,
  faTrashCan,
  faComments,
  faShare,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatFileSize, getFileIcon, parseSender, formatEmailDateFull } from "./utils";
import ChatView from "./ChatView";
import { downloadAttachment, moveEmailToFolder, deleteEmailForever } from "../api/emails";

// Функция форматирования получателя
const formatRecipient = (recipient) => {
  if (!recipient) return "Неизвестный отправитель";
  const name = recipient.name && recipient.name.trim() ? recipient.name : null;
  const address = name ? name : recipient.address || "Неизвестный Отправитель";
  return address;
};

// Функция форматирования списка получателей
const formatRecipientList = (recipients) => {
  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return "Нет получателей";
  }
  return recipients.map(formatRecipient).join(", ");
};

export default function EmailDetails({ email, category, onEmailDeleted, onError, onCompose }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  if (!email) {
    console.log("EmailDetails: Нет выбранного письма");
    return (
      <div className="flex h-full items-center justify-center text-light-200">
        Выберите письмо
      </div>
    );
  }

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const res = category.toLowerCase() === "trash"
        ? await deleteEmailForever(email.uid, category)
        : await moveEmailToFolder(email.uid, category, "TRASH");
      onEmailDeleted?.(email.uid);
    } catch (error) {
      console.error("❌ Ошибка при удалении письма:", error);
      onError?.(error, "Ошибка при удалении письма");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMoveToSpam = async (e) => {
    e.stopPropagation();
    try {
      await moveEmailToFolder(email.uid, category, "SPAM");
      setIsMenuOpen(false);
      onEmailDeleted?.(email.uid);
    } catch (error) {
      console.error("❌ Ошибка при перемещении письма в Спам:", error);
      onError?.(error, "Ошибка при перемещении письма в Спам");
    }
  };

  const handleDownloadAttachment = async (uid, filename) => {
    try {
      await downloadAttachment(uid, filename, category);
    } catch (error) {
      console.error("❌ Ошибка при скачивании вложения:", error);
      onError?.(error, "Ошибка при скачивании вложения");
    }
  };

  const handleReply = (e) => {
    e.stopPropagation();
    if (!email.from?.address) {
      onError?.(new Error("Нет отправителя для ответа"), "Ошибка при создании ответа");
      return;
    }

    const draft = {
      uid: Date.now(),
      to: [email.from.address],
      cc: [],
      bcc: [],
      subject: `Re: ${email.subject || ""}`,
      body: `<br/><br/><p>------ Исходное сообщение ------</p><p>От: ${formatRecipient(email.from)}</p><p>Дата: ${formatEmailDateFull(email.date)}</p><p>Тема: ${email.subject || ""}</p><p>${email.html || email.text || ""}</p>`,
      attachments: [],
      inReplyTo: email.messageId || "",
      references: email.references ? `${email.references} ${email.messageId || ""}` : (email.messageId || "")
    };

    onCompose?.(draft);
  };

  const handleForward = (e) => {
    e.stopPropagation();

    const draft = {
      uid: Date.now(),
      to: [],
      cc: [],
      bcc: [],
      subject: `Fwd: ${email.subject || ""}`,
      body: `<br/><br/><p>------ Пересылаемое сообщение ------</p><p>От: ${formatRecipient(email.from)}</p><p>Дата: ${formatEmailDateFull(email.date)}</p><p>Тема: ${email.subject || ""}</p><p>${email.html || email.text || ""}</p>`,
      attachments: email.attachments ? [...email.attachments] : [],
      inReplyTo: email.messageId || "",
      references: email.references ? `${email.references} ${email.messageId || ""}` : (email.messageId || "")
    };

    onCompose?.(draft);
  };

  const isSentFolder = category.toLowerCase() === "sent";
  const sender = isSentFolder ? { name: email.from?.name, address: email.from?.address } : email.from;
  const senderDisplay = formatRecipient(sender);

  return (
    <div className="flex flex-col bg-dark-500 p-6 rounded-xl h-full overflow-hidden">
      <div className="h-full overflow-y-auto">
        <div className="top-0 bg-dark-500">
          <div className="flex items-center flex-wrap gap-2">
            <div className={`w-10 h-10 rounded-xl bg-red-200 mr-4 ${email.image || ""}`}></div>
            <div className="flex flex-col flex-grow">
              <span className="text-sm text-light-200 font-medium">{senderDisplay}</span>
              <div className="text-xs text-light-400 mt-1">
                <div>
                  <span className="font-medium">Кому: </span>
                  {formatRecipientList(email.to)}
                </div>
                {email.cc && email.cc.length > 0 && (
                  <div>
                    <span className="font-medium">Копия: </span>
                    {formatRecipientList(email.cc)}
                  </div>
                )}
                {email.bcc && email.bcc.length > 0 && (
                  <div>
                    <span className="font-medium">Скрытая копия: </span>
                    {formatRecipientList(email.bcc)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 ml-auto relative" ref={menuRef}>
              <FontAwesomeIcon
                icon={faComments}
                className="text-light-200 cursor-pointer hover:text-blue-200 transition-colors text-lg"
                onClick={() => setIsChatOpen(true)}
                title="Чат"
              />
              <FontAwesomeIcon
                icon={faReply}
                className="text-light-200 cursor-pointer hover:text-blue-200 transition-colors text-lg"
                onClick={handleReply}
                title="Ответить"
              />
              <FontAwesomeIcon
                icon={faShare}
                className="text-light-200 cursor-pointer hover:text-blue-200 transition-colors text-lg"
                onClick={handleForward}
                title="Переслать"
              />
              <FontAwesomeIcon
                icon={faTrashCan}
                className="text-light-200 cursor-pointer hover:text-blue-200 transition-colors text-lg"
                onClick={(e) => handleDelete(e)}
                title="Удалить"
              />
              <FontAwesomeIcon
                icon={faEllipsisH}
                className="text-light-200 cursor-pointer hover:text-blue-200 transition-colors text-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                title="Дополнительно"
              />
              {isMenuOpen && (
                <div className="absolute right-0 top-8 mt-2 w-48 bg-dark-300 rounded-lg shadow-lg z-10">
                  <div className="px-4 py-2 text-light-500 text-sm">Отправить в</div>
                  <button
                    onClick={(e) => handleMoveToSpam(e)}
                    className="block w-full text-left px-4 py-2 text-light-200 hover:bg-dark-400"
                  >
                    Спам
                  </button>
                </div>
              )}
            </div>
          </div>
          <span className="text-xs text-light-600 font-bold mt-4 block">{formatEmailDateFull(email.date)}</span>
          <span className="text-lg text-light-100 font-light mb-2 block">{email.subject}</span>
        </div>
        <div className="mt-4">
          <iframe
            sandbox="allow-same-origin"
            srcDoc={email.html || email.text}
            style={{
              width: "100%",
              height: "600px",
              border: "none",
              backgroundColor: "white",
            }}
            title="Содержимое письма"
          />
          {email.attachments && email.attachments.length > 0 && (
            <div className="mt-6 rounded-3xl drop-shadow-2xl transition-all duration-200">
              <h3 className="text-light-300 mb-2">Вложения:</h3>
              <ul className="bg-dark-500 p-3 rounded-lg">
                {email.attachments.map((file, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between text-white p-2 border-b border-gray-600 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <FontAwesomeIcon
                        icon={getFileIcon(file.mimeType)}
                        className="text-gray-300 text-lg"
                      />
                      <span>
                        {file.filename} ({formatFileSize(file.size)})
                      </span>
                    </div>
                    <button
                      onClick={() => handleDownloadAttachment(email.uid, file.filename)}
                      className="bg-dark-400 text-xs font-medium px-3 py-1 rounded-xl"
                    >
                      Скачать
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <ChatView
        isOpen={isChatOpen}
        onRequestClose={() => setIsChatOpen(false)}
        senderEmail={sender?.address || ""}
      />
    </div>
  );
}