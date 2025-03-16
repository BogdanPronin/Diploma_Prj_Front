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

export function formatEmailDateFull(dateString) {
  if (!dateString) return "Неизвестная дата";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Некорректная дата";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}


// Функция для парсинга отправителя
export function parseSender(senderString) {
  if (!senderString || typeof senderString !== "string") {
    return { name: "Неизвестный отправитель", email: "" };
  }

  const match = senderString.match(/"([^"]+)"\s*<([^>]+)>/);
  const emailMatch = senderString.match(/<([^>]+)>/);

  if (match) {
    return { name: match[1], email: match[2] };
  } else if (emailMatch) {
    return { name: emailMatch[1], email: emailMatch[1] }; // Если только email, используем его как имя
  } else {
    return { name: senderString, email: senderString }; // Если вообще без скобок
  }
}
