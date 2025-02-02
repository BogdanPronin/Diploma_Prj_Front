import { faFilePdf, faFileImage, faFileWord, faFileArchive, faFileAlt } from "@fortawesome/free-solid-svg-icons";

// Функция для форматирования размера файла
export const formatFileSize = (size) => {
  return size < 1024
    ? `${size} B`
    : size < 1048576
    ? `${(size / 1024).toFixed(1)} KB`
    : `${(size / 1048576).toFixed(1)} MB`;
};

// Функция для определения иконки по MIME-типу
export const getFileIcon = (type) => {
  if (!type) return faFileAlt;
  if (type.includes("pdf")) return faFilePdf;
  if (type.includes("image")) return faFileImage;
  if (type.includes("word") || type.includes("msword") || type.includes("vnd.openxmlformats-officedocument.wordprocessingml.document")) return faFileWord;
  if (type.includes("zip") || type.includes("rar")) return faFileArchive;
  return faFileAlt;
};

// Функция для форматирования даты
export function formatEmailDate(dateString) {
  const emailDate = new Date(dateString);
  const now = new Date();

  const isToday = 
    emailDate.getDate() === now.getDate() &&
    emailDate.getMonth() === now.getMonth() &&
    emailDate.getFullYear() === now.getFullYear();

  if (isToday) {
    return emailDate.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } else {
    return emailDate.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}

// Функция для парсинга отправителя
export function parseSender(senderString) {
  const match = senderString.match(/"([^"]+)"\s*<([^>]+)>/);
  if (match) {
    return {
      name: match[1],
      email: match[2]
    };
  }
  return {
    name: senderString,
    email: ""
  };
}