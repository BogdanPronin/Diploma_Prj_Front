// src/components/EmailDetails.jsx
import {
  faEllipsisH,
  faReply,
  faTrashCan,
  faComments,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatFileSize, getFileIcon, parseSender, formatEmailDateFull } from "./utils";
import { useState } from "react";
import ChatView from "./ChatView";
import { downloadAttachment, moveEmailToTrash, deleteEmailForever } from "../api/emails";

export default function EmailDetails({ email, category, onEmailDeleted, onError }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
        : await moveEmailToTrash(email.uid, category);
      onEmailDeleted?.(email.uid);
    } catch (error) {
      console.error("❌ Ошибка при удалении письма:");
      onError?.(error, "Ошибка при удалении письма");
    } finally {
      setIsDeleting(false);
    }
  };

  // Выбираем данные в зависимости от категории
  const isSentFolder = category.toLowerCase() === "sent";
  const recipient = isSentFolder && email.to && email.to.length > 0 ? email.to[0] : null;
  const name = isSentFolder ? recipient?.name || recipient?.address || "Неизвестный получатель" : email.from?.name || "Неизвестный отправитель";
  const senderEmail = isSentFolder ? recipient?.address || "" : email.from?.address || "";

  return (
    <div className="flex flex-col bg-dark-500 p-6 rounded-xl">
      <div className="flex items-center">
        <div className={`w-10 h-10 rounded-xl bg-red-200 mr-4 ${email.image || ""}`}></div>
        <div className="flex flex-col">
          <span className="text-sm text-light-200 font-medium">{name}</span>
          <span className="text-xs text-light-400">{senderEmail}</span>
        </div>
        <div className="flex ml-auto">
          <FontAwesomeIcon
            icon={faComments}
            className="mx-2 text-light-200 cursor-pointer"
            onClick={() => setIsChatOpen(true)}
          />
          <FontAwesomeIcon
            icon={faReply}
            className="mx-2 text-light-200 cursor-pointer"
          />
          <FontAwesomeIcon
            icon={faTrashCan}
            className="mx-2 text-light-200 cursor-pointer"
            onClick={(e) => handleDelete(e)}
          />
          <FontAwesomeIcon
            icon={faEllipsisH}
            className="mx-2 text-light-200 cursor-pointer"
          />
        </div>
      </div>
      <span className="text-xs text-light-600 font-bold mt-4">{formatEmailDateFull(email.date)}</span>
      <span className="text-lg text-light-100 font-light mb-6">{email.subject}</span>

      <iframe
        sandbox="allow-same-origin"
        srcDoc={email.html}
        style={{
          width: "100%",
          height: "600px",
          border: "none",
          backgroundColor: "white",
        }}
        title="Email Content"
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
                  onClick={() => downloadAttachment(email.uid, file.filename)}
                  className="bg-dark-400 text-xs font-medium px-3 py-1 rounded-xl"
                >
                  Скачать
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ChatView
        isOpen={isChatOpen}
        onRequestClose={() => setIsChatOpen(false)}
        senderEmail={senderEmail}
      />
    </div>
  );
}