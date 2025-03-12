import { useState, useEffect } from "react";
import ContentHeader from "./ContentHeader";
import EmailDetails from "./EmailDetails";
import EmailList from "./EmailList";
import ComposeEmail from "./ComposeEmail";
import SideNav from "./SideNav";
import { fetchEmails, deleteEmail, sendEmail } from "../api/emails"; // Подключаем API-функции
import Modal from "react-modal";

Modal.setAppElement('#root'); // для accessibility

export default function Main() {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isComposing, setIsComposing] = useState(false);
  const [category, setCategory] = useState("INBOX");
  const [emails, setEmails] = useState([]); // Список писем
  const [drafts, setDrafts] = useState([]); // Список черновиков
  const [currentDraft, setCurrentDraft] = useState(null); // Текущий черновик

  // Загружаем письма при смене категории
  useEffect(() => {
    console.log(`📩 Запрос писем для категории: ${category}`);
    fetchEmails(category).then((data) => {
      console.log(`✅ Письма загружены: `, data);
      setEmails(data);
    });
  }, [category]);

  // Проверка, является ли черновик непустым
  const isDraftNotEmpty = (draft) => {
    return draft && (draft.to.trim() || draft.subject.trim() || draft.body.trim());
  };

  // Функция начала нового письма
  const handleCompose = () => {
    if (isDraftNotEmpty(currentDraft)) {
      setDrafts((prevDrafts) =>
        prevDrafts.some((d) => d.uid === currentDraft.uid)
          ? prevDrafts.map((d) => (d.uid === currentDraft.uid ? currentDraft : d))
          : [...prevDrafts, { ...currentDraft, uid: Date.now() }]
      );
    }
    setSelectedEmail(null);
    setIsComposing(true);
    setCurrentDraft({ uid: Date.now(), to: "", subject: "", body: "" });
  };

  // Функция удаления письма (Перемещение в "Trash")
  const handleDeleteEmail = (emailId) => {
    console.log(`🗑 Удаление письма uid: ${emailId}...`);

    deleteEmail(emailId)
      .then(() => {
        console.log(`✅ Письмо uid ${emailId} перемещено в "Trash".`);

        // 🔥 Фильтруем удалённое письмо и обновляем стейт
        setEmails((prevEmails) => {
          const updatedEmails = prevEmails.filter((email) => email.uid !== emailId);
          console.log("📩 Обновленный список писем:", updatedEmails);
          return updatedEmails;
        });

        setSelectedEmail(null);
      })
      .catch((error) => console.error("❌ Ошибка при удалении письма:", error));
  };

  // Функция выбора письма (если черновик — открываем редактор)
  const handleSelectEmail = (email) => {
    if (isComposing && isDraftNotEmpty(currentDraft)) {
      setDrafts((prevDrafts) =>
        prevDrafts.some((d) => d.uid === currentDraft.uid)
          ? prevDrafts.map((d) => (d.uid === currentDraft.uid ? currentDraft : d))
          : [...prevDrafts, { ...currentDraft, uid: Date.now() }]
      );
      setCurrentDraft(null);
    }

    if (category === "Drafts") {
      setIsComposing(true);
      setCurrentDraft(email);
      setSelectedEmail(email);
    } else {
      setIsComposing(false);
      setSelectedEmail(email);
    }
  };

  return (
    <main className="flex flex-row w-full h-screen bg-dark-600 overflow-hidden">
      <SideNav onSelectCategory={setCategory} />
      <div className="flex flex-col flex-grow">
        <ContentHeader />

        <div className="flex flex-row flex-grow h-[calc(100%-64px)] overflow-hidden">
          
          <div className="w-[35%] h-full overflow-hidden">
            <EmailList
              onSelectEmail={handleSelectEmail}
              category={category}
              onCompose={handleCompose}
              drafts={drafts}
              selectedEmail={selectedEmail}
              emails={emails} // Передаем список писем
            />
          </div>

          <div className="flex-grow h-full">
            {isComposing ? (
              <ComposeEmail
                isOpen={isComposing}
                onRequestClose={() => setIsComposing(false)}
                onSendEmail={(email) => {
                  sendEmail(email)
                    .then((res) => {
                      console.log("✅ Письмо успешно отправлено:", res);
                      setIsComposing(false);
                      setCurrentDraft(null);
                    })
                    .catch((error) => {
                      console.error("❌ Ошибка при отправке письма:", error);
                    });
                }}
                draft={currentDraft}
                setDraft={setCurrentDraft}
              />

            ) : selectedEmail ? (
              <EmailDetails
                email={selectedEmail}
                setSelectedEmail={setSelectedEmail}
                onEmailDeleted={handleDeleteEmail} // Передаем функцию удаления
              />
            ) : (
              <div className="flex h-full items-center justify-center text-light-200">
                Выберите письмо
              </div>
            )}
          </div>
        </div>

      </div>


    </main>
  );
}
