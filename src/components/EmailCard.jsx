import { faPaperclip } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./EmailCard.css";

export default function EmailCard(props) {
  const { image, from, time, subject, body, hasAttachment, isSelected, onClick, to } = props;

  // Определяем источник (отправителя или получателя)
  const displayName = from || to || "<None>";

  // Получаем первую букву
  const firstLetter = displayName.charAt(0).toUpperCase();

  // Получаем первую букву второго слова (если есть)
  const words = displayName.split(" ");
  const secondLetter = words.length > 1 ? words[1].charAt(0).toUpperCase() : "";

  return (
    <div
      className={`flex flex-row py-4 px-6 cursor-pointer rounded-3xl drop-shadow-2xl transition-all duration-200
        ${isSelected ? "bg-gradient-to-br from-blue-200 to-blue-300 text-white" : "bg-dark-500 text-light-200"}
        hover:bg-gradient-to-br from-dark-200 to-dark-300`}
      onClick={onClick} // Передаём событие клика
    >
      {/* Квадрат с инициалами */}
      <div className={`${image} relative w-12 h-10 mt-3 rounded-xl bg-blue-200 flex items-center justify-center text-white font-bold`}>
        <span className="absolute top-1 left-1 text-xs">{firstLetter}</span>
        {secondLetter && <span className="absolute bottom-1 right-1 text-xs">{secondLetter}</span>}
      </div>

      <div className="flex flex-col w-full ml-3">
        <div className="flex items-center">
          <span className="text-xs font-medium mr-auto">{displayName}</span>
          {hasAttachment && <FontAwesomeIcon icon={faPaperclip} className="mr-2" />}
          <span className="bg-dark-400 text-xs font-medium px-3 py-1 rounded-xl">{time || "-"}</span>
        </div>
        <span className="text-sm font-medium mt-2">{subject || "<None Subject>"}</span>
        <span className="clamp text-xs font-normal mt-4 w-full">{body}</span>
      </div>
    </div>
  );
}
