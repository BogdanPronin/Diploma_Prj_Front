import { useState, useEffect } from "react";
import ContentHeader from "./ContentHeader";
import EmailDetails from "./EmailDetails";
import EmailList from "./EmailList";
import ComposeEmail from "./ComposeEmail";
import SideNav from "./SideNav";
import { fetchEmails, deleteEmailForever, sendEmail, moveEmailToTrash, markEmailsAsRead } from "../api/emails"; // Подключаем API-функции
import Modal from "react-modal";
import { toast } from 'react-toastify';

Modal.setAppElement('#root'); // для accessibility

export default function Main() {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isComposing, setIsComposing] = useState(false);
  const [category, setCategory] = useState("INBOX");
  const [emails, setEmails] = useState({ totalMessages: 0, totalUnreadMessages: 0, messages: [] }); // Изначально пустой список
  const [drafts, setDrafts] = useState([]); // Список черновиков
  const [currentDraft, setCurrentDraft] = useState(null); // Текущий черновик
  const [unreadUids, setUnreadUids] = useState(new Set());
  
  // Загружаем письма при смене категории
  useEffect(() => {
    console.log(`📩 Запрос писем для категории: ${category}`);
    // Сбрасываем письма при смене категории
    setEmails({ totalMessages: 0, totalUnreadMessages: 0, messages: [] });

    fetchEmails(category).then((data) => {
      console.log(`✅ Письма загружены: `, data);
      setEmails(data);
    });
  }, [category]);

  // Отметка писем как прочитанных перед закрытием страницы
  useEffect(() => {
    const markAsReadOnUnload = async () => {
      if (unreadUids.size > 0) {
        try {
          await markEmailsAsRead(Array.from(unreadUids));
          console.log("✅ Все открытые письма помечены как прочитанные.");
        } catch (error) {
          console.error("❌ Ошибка при отметке писем как прочитанных:", error);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        markAsReadOnUnload();
      }
    };

    const handlePageHide = () => {
      markAsReadOnUnload();
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      markAsReadOnUnload(); // Обрабатываем размонтирование компонента
    };
  }, [unreadUids]);

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

  // Функция выбора письма (если черновик — открываем редактор)
  const handleSelectEmail = (email) => {
    setSelectedEmail(email);
  
    if (!email.isRead) {
      setUnreadUids((prev) => new Set(prev).add(email.uid));
    }
  };

  const handleDeleteEmail = (emailId) => {
    setEmails(prev => ({
      ...prev,
      messages: prev.messages.filter(email => email.uid !== emailId)
    }));
    setSelectedEmail(null);
    toast.success(category.toLowerCase() === 'корзина' || category.toLowerCase() === 'trash'
      ? "Письмо удалено навсегда"
      : "Письмо перемещено в корзину");
  };

  const handleError = (e, message) => {
    console.error(e);
    toast.error(message);
  }
  
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
              loadMoreEmails={(beforeUid) => {
                fetchEmails(category, beforeUid).then((data) => {
                  setEmails(prevEmails => ({
                    ...prevEmails,
                    messages: [...prevEmails.messages, ...data.messages],
                  }));
                }).catch((error) => {
                  console.error("❌ Ошибка при загрузке дополнительных писем:", error);
                });
              }}
            />
          </div>

          <div className="flex-grow w-5 h-full">
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
                onClose={() => setIsComposing(false)}
              />
            ) : selectedEmail ? (
              <EmailDetails
                email={selectedEmail}
                category={category}
                setSelectedEmail={setSelectedEmail}
                onEmailDeleted={handleDeleteEmail} // Передаем функцию удаления
                onError={handleError}
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
