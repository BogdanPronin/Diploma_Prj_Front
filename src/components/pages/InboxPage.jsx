import { useState, useEffect } from "react";
import { fetchEmails, deleteEmail } from "../api";
import EmailList from "../components/EmailList";
import EmailDetails from "../components/EmailDetails";
import ComposeEmail from "../components/ComposeEmail";

export default function InboxPage() {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    fetchEmails("Inbox").then(setEmails);
  }, []);

  const handleDeleteEmail = (emailId) => {
    deleteEmail(emailId).then(() => {
      setEmails((prevEmails) => prevEmails.filter(email => email.id !== emailId));
      setSelectedEmail(null);
    });
  };

  return (
    <div className="flex flex-row h-full">
      <EmailList emails={emails} onSelectEmail={setSelectedEmail} onCompose={() => setIsComposing(true)} />
      <div className="flex-grow">
        {isComposing ? (
          <ComposeEmail onSendEmail={() => setIsComposing(false)} />
        ) : selectedEmail ? (
          <EmailDetails email={selectedEmail} onEmailDeleted={handleDeleteEmail} />
        ) : (
          <div className="flex h-full items-center justify-center text-light-200">Выберите письмо</div>
        )}
      </div>
    </div>
  );
}
