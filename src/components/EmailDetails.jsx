import {
  faEllipsisH,
  faReply,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf, faFileImage, faFileWord, faFileArchive, faFileAlt } from "@fortawesome/free-solid-svg-icons";
import { deleteEmail } from "../api"; // Функция удаления писем

// Функция для форматирования размера файла
const formatFileSize = (size) => {
  return size < 1024
    ? `${size} B`
    : size < 1048576
    ? `${(size / 1024).toFixed(1)} KB`
    : `${(size / 1048576).toFixed(1)} MB`;
};

// Функция для определения иконки по MIME-типу
const getFileIcon = (type) => {
  if (!type) return faFileAlt;
  if (type.includes("pdf")) return faFilePdf;
  if (type.includes("image")) return faFileImage;
  if (type.includes("word") || type.includes("msword") || type.includes("vnd.openxmlformats-officedocument.wordprocessingml.document")) return faFileWord;
  if (type.includes("zip") || type.includes("rar")) return faFileArchive;
  return faFileAlt;
};

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
    console.log(`🗑 Удаление письма ID: ${email.id}...`);
  
    deleteEmail(email.id)
      .then(() => {
        console.log(`✅ Письмо ID ${email.id} успешно перемещено в корзину`);
  
        // ❗ Убираем письмо из списка
        if (onEmailDeleted) {
          console.log("🔄 Вызываем onEmailDeleted() для обновления списка");
          onEmailDeleted(email.id);
        }
      })
      .catch((error) => console.error("❌ Ошибка при удалении письма:", error));
  };
  
  return (
    <div className="flex flex-col bg-dark-500">
      <span className="text-2xs text-center text-light-600 my-6">13 / 13</span>
      <div className="flex items-center px-10">
        <div className={`w-10 h-10 rounded-xl bg-red-200 mr-4 ${email.image || ""}`}></div>
        <span className="text-sm text-light-200 font-medium">{email.from}</span>
        <div className="flex ml-auto">
          <FontAwesomeIcon icon={faReply} className="mx-2 text-light-200 cursor-pointer" />
          <FontAwesomeIcon icon={faTrashCan} className="mx-2 text-light-200 cursor-pointer" onClick={handleDelete} />
          <FontAwesomeIcon icon={faEllipsisH} className="mx-2 text-light-200 cursor-pointer" />
        </div>
      </div>
      <span className="px-10 text-2xs text-light-600 font-bold mt-6">{email.time}</span>
      <span className="px-10 text-lg text-light-100 font-light mb-6">{email.subject}</span>

      {/* Контент письма */}
      <div className="px-10 text-xs text-light-500 whitespace-pre-wrap mb-6" dangerouslySetInnerHTML={{ __html: email.body }}></div>

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
