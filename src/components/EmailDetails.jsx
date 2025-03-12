import {
  faEllipsisH,
  faReply,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf, faFileImage, faFileWord, faFileArchive, faFileAlt } from "@fortawesome/free-solid-svg-icons";
import { deleteEmail } from "../mock-api"; // Функция удаления писем
import { formatFileSize, getFileIcon, parseSender } from "./utils";

export default function EmailDetails({ email, onEmailDeleted }) {
  if (!email) {
    console.log("EmailDetails: Нет выбранного письма");
    return (
      <div className="flex h-full items-center justify-center text-light-200">
        Выберите письмо
      </div>
    );
  }

  const handleDelete = () => {
    console.log(`🗑 Удаление письма uid: ${email.uid}...`);
  
    deleteEmail(email.uid)
      .then(() => {
        console.log(`✅ Письмо uid ${email.uid} успешно перемещено в корзину`);
  
        if (onEmailDeleted) {
          console.log("🔄 Вызываем onEmailDeleted() для обновления списка");
          onEmailDeleted(email.uid);
        }
      })
      .catch((error) => console.error("❌ Ошибка при удалении письма:", error));
  };

  // Парсинг строки отправителя
  const { name, email: senderEmail } = parseSender(email.from.text || "");

  return (
    <div className="flex flex-col bg-dark-500 overflow-y-scroll">
      <span className="text-2xs text-center text-light-600 my-6">13 / 13</span>
      <div className="flex items-center px-10">
        <div className={`w-10 h-10 rounded-xl bg-red-200 mr-4 ${email.image || ""}`}></div>
        <div className="flex flex-col">
          <span className="text-sm text-light-200 font-medium">{name}</span>
          <span className="text-xs text-light-400">{senderEmail}</span>
        </div>
        <div className="flex ml-auto">
          <FontAwesomeIcon icon={faReply} className="mx-2 text-light-200 cursor-pointer" />
          <FontAwesomeIcon icon={faTrashCan} className="mx-2 text-light-200 cursor-pointer" onClick={handleDelete} />
          <FontAwesomeIcon icon={faEllipsisH} className="mx-2 text-light-200 cursor-pointer" />
        </div>
      </div>
      <span className="px-10 text-2xs text-light-600 font-bold mt-6">{email.date}</span>
      <span className="px-10 text-lg text-light-100 font-light mb-6">{email.subject}</span>

      {/* Контент письма */}
      <iframe
        sandbox="allow-same-origin"
        srcDoc={email.html}
        style={{
          width: '100%',
          height: '600px',
          border: 'none',
          backgroundColor: 'white',
        }}
        title="Email Content"
      />

      {/* Блок вложений */}
      {email.attachments && email.attachments.length > 0 && (
        <div className="mt-6 px-10">
          <h3 className="text-light-300 mb-2">Attachments:</h3>
          <ul className="bg-dark-400 p-3 rounded-lg">
            {email.attachments.map((file, index) => (
              <li key={index} className="flex items-center justify-between text-white p-2 border-b border-gray-600 last:border-0">
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={getFileIcon(file.type)} className="text-gray-300 text-lg" />
                  <span>{file.name} ({formatFileSize(file.size)})</span>
                </div>
                <a
                  href={file.fileObj ? URL.createObjectURL(file.fileObj) : "#"}
                  download={file.name}
                  className="text-blue-300 underline"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
