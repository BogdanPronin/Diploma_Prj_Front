// src/components/EmailDetails.jsx
import { useState, useEffect, useRef } from "react";
import {
  faEllipsisH,
  faReply,
  faTrashCan,
  faComments,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatFileSize, getFileIcon, parseSender, formatEmailDateFull } from "./utils";
import ChatView from "./ChatView";
import { downloadAttachment, moveEmailToFolder, deleteEmailForever } from "../api/emails";

export default function EmailDetails({ email, category, onEmailDeleted, onError }) {
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

  const isSentFolder = category.toLowerCase() === "sent";
  const recipient = isSentFolder && email.to && email.to.length > 0 ? email.to[0] : null;
  const name = isSentFolder ? recipient?.name || recipient?.address || "Неизвестный получатель" : email.from?.name || "Неизвестный отправитель";
  const senderEmail = isSentFolder ? recipient?.address || "" : email.from?.address || "";

  return (
    <div className="flex flex-col bg-dark-500 p-6 rounded-xl h-full overflow-hidden">
      <div className="h-full overflow-y-auto">
        {/* Зафиксированная верхняя часть */}
        <div className="sticky top-0 bg-dark-500 z-10 pb-4">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-xl bg-red-200 mr-4 ${email.image || ""}`}></div>
            <div className="flex flex-col">
              <span className="text-sm text-light-200 font-medium">{name}</span>
              <span className="text-xs text-light-400">{senderEmail}</span>
            </div>
            <div className="flex ml-auto relative" ref={menuRef}>
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
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
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
          <span className="text-lg text-light-100 font-light mb-6 block">{email.subject}</span>
        </div>

        {/* Прокручиваемая часть: текст письма и вложения */}
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
        senderEmail={senderEmail}
      />
    </div>
  );
}