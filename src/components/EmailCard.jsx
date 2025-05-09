import { faPaperclip, faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatEmailDate } from "./utils";
import "./EmailCard.css";

export default function EmailCard(props) {
  const { image, from, to, date, subject, body, attachments, isSelected, onClick, isRead, category } = props;

  console.log("EmailCard props:", { category, from, to }); // Отладка

  // Форматируем дату перед отображением
  const formattedDate = date ? formatEmailDate(date) : "-";

  // Выбираем данные в зависимости от категории
  const isSentFolder = category && category.toLowerCase() === "sent";
  const recipient = isSentFolder && to && to.length > 0 ? to[0] : null;
  const name = isSentFolder ? recipient?.name || recipient?.address || "Неизвестный получатель" : from?.name || from?.address || "Неизвестный отправитель";
  const email = isSentFolder ? recipient?.address || "" : from?.address || "";

  // Определяем, есть ли вложения
  const hasAttachment = attachments && attachments.length > 0;

  // Получаем первую букву имени
  const firstLetter = name.charAt(0).toUpperCase();

  // Получаем первую букву второго слова (если есть)
  const words = name.split(" ");
  const secondLetter = words.length > 1 ? words[1].charAt(0).toUpperCase() : " ";

  return (
    <div
      className={`flex flex-row py-4 px-6 cursor-pointer rounded-3xl drop-shadow-2xl transition-all duration-200
        ${isSelected ? "bg-gradient-to-br from-blue-200 to-blue-300 text-white" : "bg-dark-500 text-light-200"}
        hover:bg-gradient-to-br from-dark-200 to-dark-300`}
      onClick={onClick}
    >
      {/* Квадрат с инициалами */}
      <div
        className={`${image || "bg-blue-200"} relative w-12 h-10 mt-3 rounded-xl flex items-center justify-center text-white font-bold`}
      >
        <span className="absolute top-1 left-1 text-xs">{firstLetter}</span>
        {secondLetter && <span className="absolute bottom-1 right-1 text-xs">{secondLetter}</span>}
      </div>

      <div className="flex flex-col w-full ml-3 max-w-[calc(100%-60px)]"> {/* Ограничиваем ширину */}
        <div className="flex items-center">
          <span className="text-xs font-medium mr-auto max-w-[100px] truncate">{name}</span>

          <div className="flex items-center space-x-2">
            {!isRead && (
              <FontAwesomeIcon
                icon={faCircle}
                className="text-xs text-blue-400"
              />
            )}
            {hasAttachment && (
              <FontAwesomeIcon icon={faPaperclip} className="text-gray-400 text-sm mr-2" />
            )}
            <span className="bg-dark-400 text-xs font-medium px-3 py-1 rounded-xl">
              {formattedDate}
            </span>
          </div>
        </div>
        <span className="text-sm font-medium mt-2">{subject || "<No Subject>"}</span>
        <span className="clamp text-xs font-normal mt-4 w-full">{body}</span>
      </div>
    </div>
  );
}