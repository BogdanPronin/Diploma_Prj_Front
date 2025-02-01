import { useEffect, useState } from "react";
import { fetchEmails } from "../api";
import EmailCard from "./EmailCard";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./EmailList.css";

export default function EmailList({ onSelectEmail, category, onCompose, drafts, selectedEmail }) {
  const [emails, setEmails] = useState([]);

  useEffect(() => {
    fetchEmails().then((allEmails) => {
      let filteredEmails;
      if (category === "Drafts") {
        filteredEmails = drafts;
      } else {
        filteredEmails = allEmails.filter((email) => email.category === category);
      }
      setEmails(filteredEmails);
    });
  }, [category, drafts]);

  return (
    <div className="flex flex-col bg-dark-500  min-w-[350px] h-full">
      <div className="flex items-center py-6 px-6">
        <span className="font-light text-xl text-light-200">{category}</span>
        <FontAwesomeIcon
          icon={faPlus}
          className="px-3 py-3 rounded-xl bg-gradient-to-br from-blue-200 to-blue-300 text-light-200 drop-shadow-3xl ml-auto cursor-pointer"
          onClick={onCompose}
        />
      </div>
      <div className="flex flex-col px-6 pb-5 overflow-y-auto space-y-4">
        {emails.length > 0 ? (
          emails.map((email) => (
            <EmailCard
              key={email.id}
              {...email}
              isSelected={selectedEmail && email.id === selectedEmail.id}
              onClick={() => onSelectEmail(email)}
            />
          ))
        ) : (
          <div className="text-light-400 text-center mt-10">No emails in {category}</div>
        )}
      </div>
    </div>
  );
}
