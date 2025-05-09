import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ContentHeader from "./ContentHeader";
import EmailDetails from "./EmailDetails";
import EmailList from "./EmailList";
import ComposeEmail from "./ComposeEmail";
import SideNav from "./SideNav";
import { fetchEmails, deleteEmailForever, sendEmail, moveEmailToFolder, markEmailsAsRead, deleteDraft } from "../api/emails";
import Modal from "react-modal";
import { toast } from 'react-toastify';
import Loader from './ui/Loader';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";

Modal.setAppElement('#root');

export default function Main() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isComposing, setIsComposing] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(category || "INBOX");
  const [emails, setEmails] = useState({ totalMessages: 0, totalUnreadMessages: 0, messages: [] });
  const [drafts, setDrafts] = useState([]);
  const [currentDraft, setCurrentDraft] = useState(null);
  const [unreadUids, setUnreadUids] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const [isEmailDetailsModalOpen, setIsEmailDetailsModalOpen] = useState(false);

  const validCategories = ["INBOX", "DRAFTS", "SENT", "TRASH", "SPAM", "корзина"];

  useEffect(() => {
    if (!category || !validCategories.includes(category.toUpperCase())) {
      navigate("/folder/INBOX", { replace: true });
      setCurrentCategory("INBOX");
    } else {
      setCurrentCategory(category.toUpperCase());
    }
    setSelectedEmail(null);
    setIsComposing(false);
    setCurrentDraft(null);
    setIsEmailDetailsModalOpen(false);
  }, [category, navigate]);

  useEffect(() => {
    setLoading(true);
    console.log(`📩 Запрос писем для категории: ${currentCategory}`);
    setEmails({ totalMessages: 0, totalUnreadMessages: 0, messages: [] });

    fetchEmails(currentCategory)
      .then((data) => {
        console.log(`✅ Письма загружены: `, data);
        setEmails(data);
      })
      .finally(() => setLoading(false));
  }, [currentCategory]);

  useEffect(() => {
    const markAsReadOnUnload = async () => {
      if (unreadUids.size > 0) {
        try {
          await markEmailsAsRead([...unreadUids]);
          console.log("✅ Все открытые письма помечены как прочитанные.");
        } catch (error) {
          console.error("❌ Ошибка при отметке писем как прочитанных:", error);
          handleError(error, "Ошибка при отметке писем");
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') markAsReadOnUnload();
    };
    const handlePageHide = () => markAsReadOnUnload();

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", markAsReadOnUnload);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", markAsReadOnUnload);
    };
  }, [unreadUids]);

  const isDraftNotEmpty = (draft) => {
    return draft && (
      (Array.isArray(draft.to) && draft.to.length > 0) ||
      draft.subject?.trim() ||
      draft.body?.trim() ||
      (Array.isArray(draft.attachments) && draft.attachments.length > 0)
    );
  };

  const handleCompose = (draft) => {
    if (isDraftNotEmpty(currentDraft)) {
      setDrafts((prevDrafts) =>
        prevDrafts.some((d) => d.uid === currentDraft?.uid)
          ? prevDrafts.map((d) => (d.uid === currentDraft.uid ? currentDraft : d))
          : [...prevDrafts, { ...currentDraft }]
      );
    }
    setSelectedEmail(null);
    setCurrentDraft(draft || { uid: Date.now(), to: [], subject: "", body: "", cc: [], bcc: [], attachments: [] });
    setIsComposing(true);
  };

  const handleSelectEmail = (email) => {
    if (currentCategory.toLowerCase() === "drafts") {
      const draft = {
        uid: email.uid,
        to: email.to?.split(',').map((addr) => addr.trim()).filter(Boolean) || [],
        cc: email.cc?.split(',').map((addr) => addr.trim()).filter(Boolean) || [],
        bcc: email.bcc?.split(',').map((addr) => addr.trim()).filter(Boolean) || [],
        subject: email.subject || "",
        body: email.body || "",
        attachments: email.attachments || [],
        inReplyTo: email.inReplyTo || "",
        references: email.references || "",
      };
      handleCompose(draft);
    } else {
      setSelectedEmail(email);
      if (!email.isRead) setUnreadUids((prev) => new Set(prev).add(email.uid));
      if (window.innerWidth < 940) {
        setIsEmailDetailsModalOpen(true);
      }
    }
  };

  const handleDeleteEmail = (emailId) => {
    setEmails((prev) => ({
      ...prev,
      messages: prev.messages.filter((email) => email.uid !== emailId),
    }));
    setSelectedEmail(null);
    setIsEmailDetailsModalOpen(false);
    toast.success(
      currentCategory.toLowerCase() === 'корзина' || currentCategory.toLowerCase() === 'trash'
        ? "Письмо удалено навсегда"
        : "Письмо перемещено"
    );
  };

  const handleDeleteDraft = (uid) => {
    deleteDraft(uid, "DRAFTS")
      .then(() => {
        setEmails((prev) => ({
          ...prev,
          messages: prev.messages.filter((email) => email.uid !== uid),
          totalMessages: prev.totalMessages - 1,
        }));
        setSelectedEmail(null);
        setIsEmailDetailsModalOpen(false);
        toast.success("Черновик удален");
      })
      .catch((error) => {
        console.error("❌ Ошибка при удалении черновика:", error);
        handleError(error, "Не удалось удалить черновик");
      });
  };

  const handleError = (e, message) => {
    console.error(e);
    toast.error(message);
  };

  return (
    <main className="flex flex-row overflow-hidden w-full h-screen bg-dark-600">
      {/* Кнопка гамбургер-меню */}
      {window.innerWidth < 940 && (
        <span
          className="fixed my-5 z-50 p-2 text-light-200 text-2xl rounded"
          onClick={() => setIsSideNavOpen(!isSideNavOpen)}
        >
          <div className="w-6 h-6 bg-blue-600 rounded-full"></div>
        </span>
      )}

      {/* SideNav */}
      <nav
        className={`h-full bg-dark-600 flex flex-col items-center z-40 w-64 min-[940px]:w-60
          ${window.innerWidth < 940 ? `fixed top-0 left-0 transition-transform duration-300 ease-in-out ${isSideNavOpen ? "translate-x-0" : "-translate-x-full"}` : ""}`}
      >
        <SideNav setIsSideNavOpen={setIsSideNavOpen} />
      </nav>

      {/* Оверлей для закрытия меню */}
      {isSideNavOpen && window.innerWidth < 940 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSideNavOpen(false)}
        />
      )}

      <div className="flex flex-col flex-grow min-[940px]:ml-0">
        <ContentHeader />
        {loading ? <Loader /> : (
          <div className="flex flex-row flex-grow h-[calc(100%-64px)] overflow-hidden">
            <div className={`min-w-[350px] ${window.innerWidth < 940 ? "flex-grow" : "w-[35%]"} h-full overflow-hidden`}>
              <EmailList
                onSelectEmail={handleSelectEmail}
                onDeleteDraft={handleDeleteDraft}
                category={currentCategory}
                onCompose={() => handleCompose(null)}
                drafts={drafts}
                selectedEmail={selectedEmail}
                unreadList={unreadUids}
                emails={emails}
                loadMoreEmails={(beforeUid) => {
                  fetchEmails(currentCategory, beforeUid).then((data) => {
                    setEmails((prevEmails) => ({
                      ...prevEmails,
                      messages: [...prevEmails.messages, ...data.messages],
                    }));
                  }).catch((error) => {
                    console.error("❌ Ошибка при загрузке дополнительных писем:", error);
                  });
                }}
              />
            </div>
            {window.innerWidth >= 940 && selectedEmail && !isComposing && (
              <div className="flex-grow h-full">
                <EmailDetails
                  email={selectedEmail}
                  category={currentCategory}
                  onEmailDeleted={handleDeleteEmail}
                  onError={handleError}
                  onCompose={handleCompose}
                />
              </div>
            )}
            {window.innerWidth >= 940 && !selectedEmail && !isComposing && (
              <div className="flex-grow h-full">
                <div className="flex h-full items-center justify-center text-light-200">
                  Выберите письмо
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Модальное окно для ComposeEmail */}
      {isComposing && (
        <Modal
          isOpen={isComposing}
          onRequestClose={() => setIsComposing(false)}
          style={{
            content: {
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              marginRight: '-50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: '800px',
              height: '90%',
              maxHeight: '600px',
              background: '#2D2D30',
              padding: '0px',
              border: 'none',
              borderRadius: '8px',
              overflow: 'hidden'
            },
            overlay: {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 50
            }
          }}
        >
          <ComposeEmail
            onSendEmail={(email) => {
              sendEmail(email)
                .then((res) => {
                  console.log("✅ Письмо успешно отправлено:", res);
                  if (email.uid && currentCategory.toLowerCase() === "drafts") {
                    deleteDraft(email.uid, "DRAFTS")
                      .then(() => {
                        setEmails((prev) => ({
                          ...prev,
                          messages: prev.messages.filter((msg) => msg.uid !== email.uid),
                          totalMessages: prev.totalMessages - 1,
                        }));
                        toast.success("Черновик удален после отправки");
                      })
                      .catch((error) => {
                        console.error("❌ Ошибка при удалении черновика:", error);
                        handleError(error, "Не удалось удалить черновик");
                      });
                  }
                  setIsComposing(false);
                  setCurrentDraft(null);
                  toast.success("Письмо отправлено!");
                })
                .catch((error) => {
                  console.error("❌ Ошибка при отправке письма:", error);
                  handleError(error, "Не удалось отправить письмо");
                });
            }}
            draft={currentDraft}
            setDraft={setCurrentDraft}
            onClose={() => setIsComposing(false)}
          />
        </Modal>
      )}

      {/* Модальное окно для EmailDetails на узких экранах */}
      {selectedEmail && window.innerWidth < 940 && (
        <Modal
          isOpen={isEmailDetailsModalOpen}
          onRequestClose={() => {
            setSelectedEmail(null);
            setIsEmailDetailsModalOpen(false);
          }}
          style={{
            content: {
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              marginRight: '-50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: '600px',
              height: '90%',
              maxHeight: '600px',
              padding: '0px',
              background: '#2D2D30',
              border: 'none',
              overflow: 'hidden'
            },
            overlay: {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 50
            }
          }}
        >
          <EmailDetails
            email={selectedEmail}
            category={currentCategory}
            onEmailDeleted={handleDeleteEmail}
            onError={handleError}
            onCompose={handleCompose}
          />
        </Modal>
      )}
    </main>
  );
}