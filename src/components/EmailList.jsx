import { useEffect, useState } from "react";
import { fetchEmails } from "../api";
import EmailCard from "./EmailCard";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./EmailList.css";

export default function EmailList({ onSelectEmail, category, onCompose, selectedEmail }) {
  const [emailsData, setEmailsData] = useState({
    totalMessages: 0,
    unreadCount: 0,
    messages: []
  });

  useEffect(() => {
    fetchEmails(category).then((data) => {
      setEmailsData(data);  // Устанавливаем весь объект данных
    });
  }, [category]);

  const { totalMessages, unreadCount, messages } = emailsData;

  return (
    <div className="flex flex-col bg-dark-500 min-w-[350px] h-full">
      <div className="flex items-center py-6 px-6">
        <span className="font-light text-xl text-light-200">{category} {unreadCount}/{totalMessages}</span>
        <FontAwesomeIcon
          icon={faPlus}
          className="px-3 py-3 rounded-xl bg-gradient-to-br from-blue-200 to-blue-300 text-light-200 drop-shadow-3xl ml-auto cursor-pointer"
          onClick={onCompose}
        />
      </div>
      <div className="flex flex-col px-6 pb-5 overflow-y-auto space-y-4">
        {messages.length > 0 ? (
          messages.map((email) => (
            <EmailCard
              key={email.uid}
              {...email}
              isSelected={selectedEmail && email.uid === selectedEmail.uid}
              onClick={() => onSelectEmail(email)}
            />
          ))
        ) : (
          <div className="text-light-400 text-center mt-10">Нет писем в {category}</div>
        )}
      </div>
    </div>
  );
}
