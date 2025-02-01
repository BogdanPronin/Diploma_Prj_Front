import { faPaperclip } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./EmailCard.css";

export default function EmailCard(props) {
  const { image, from, time, subject, body, hasAttachment, isSelected, onClick, to } = props;

  return (
    <div
      className={`flex flex-row py-4 px-6 cursor-pointer rounded-3xl drop-shadow-2xl transition-all duration-200
        ${isSelected ? "bg-gradient-to-br from-blue-200 to-blue-300 text-white" : "bg-dark-500 text-light-200"}
        hover:bg-gradient-to-br from-dark-200 to-dark-300`}
      onClick={onClick} // Передаём событие клика
    >
      <div className={`w-12 h-10 mt-3 rounded-xl ${image} bg-blue-100`}></div>
      <div className="flex flex-col w-full ml-3">
        <div className="flex items-center">
          <span className="text-xs font-medium mr-auto">{from || to || "<None>"}</span>
          {hasAttachment && <FontAwesomeIcon icon={faPaperclip} className="mr-2" />}
          <span className="bg-dark-400 text-xs font-medium px-3 py-1 rounded-xl">{time || "-"}</span>
        </div>
        <span className="text-sm font-medium mt-2">{subject || "<None Subject>"}</span>
        <span className="clamp text-xs font-normal mt-4 w-full">{body}</span>
      </div>
    </div>
  );
}
