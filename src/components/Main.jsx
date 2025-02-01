import { useState } from "react";
import ContentHeader from "./ContentHeader";
import EmailDetails from "./EmailDetails";
import EmailList from "./EmailList";
import ComposeEmail from "./ComposeEmail";
import SideNav from "./SideNav";

export default function Main() {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isComposing, setIsComposing] = useState(false);
  const [category, setCategory] = useState("Inbox");
  const [drafts, setDrafts] = useState([]); // Список черновиков
  const [currentDraft, setCurrentDraft] = useState(null); // Текущий черновик

  // Проверка, является ли черновик непустым
  const isDraftNotEmpty = (draft) => {
    return draft && (draft.to.trim() || draft.subject.trim() || draft.body.trim());
  };

  // Функция начала нового письма
  const handleCompose = () => {
    if (isDraftNotEmpty(currentDraft)) {
      // Обновляем черновик, если он уже есть в списке
      setDrafts((prevDrafts) =>
        prevDrafts.some((d) => d.id === currentDraft.id)
          ? prevDrafts.map((d) => (d.id === currentDraft.id ? currentDraft : d))
          : [...prevDrafts, { ...currentDraft, id: Date.now() }]
      );
    }
    setSelectedEmail(null);
    setIsComposing(true);
    setCurrentDraft({ id: Date.now(), to: "", subject: "", body: "" });
  };

  // Функция выбора письма (если черновик — открываем редактор)
  const handleSelectEmail = (email) => {
    if (isComposing && isDraftNotEmpty(currentDraft)) {
      setDrafts((prevDrafts) =>
        prevDrafts.some((d) => d.id === currentDraft.id)
          ? prevDrafts.map((d) => (d.id === currentDraft.id ? currentDraft : d))
          : [...prevDrafts, { ...currentDraft, id: Date.now() }]
      );
      setCurrentDraft(null);
    }

    if (category === "Drafts") {
      // Открываем редактор для существующего черновика
      setIsComposing(true);
      setCurrentDraft(email);
      setSelectedEmail(email); // Теперь черновик будет выделяться
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
          <div className="w-[35%] min-w-[300px] h-full overflow-hidden">
            <EmailList 
              onSelectEmail={handleSelectEmail} 
              category={category} 
              onCompose={handleCompose} 
              drafts={drafts} 
              selectedEmail={selectedEmail} 
            />
          </div>
          <div className="flex-grow h-full">
            {isComposing ? (
              <ComposeEmail 
                onSendEmail={() => setIsComposing(false)} 
                draft={currentDraft} 
                setDraft={setCurrentDraft} 
              />
            ) : selectedEmail ? (
              <EmailDetails email={selectedEmail} />
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
