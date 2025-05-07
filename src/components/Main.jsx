import { useState, useEffect } from "react";
import ContentHeader from "./ContentHeader";
import EmailDetails from "./EmailDetails";
import EmailList from "./EmailList";
import ComposeEmail from "./ComposeEmail";
import SideNav from "./SideNav";
import { fetchEmails, deleteEmailForever, sendEmail, moveEmailToFolder, markEmailsAsRead, deleteDraft } from "../api/emails";
import Modal from "react-modal";
import { toast } from 'react-toastify';
import Loader from './ui/Loader';

Modal.setAppElement('#root');

export default function Main() {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isComposing, setIsComposing] = useState(false);
  const [category, setCategory] = useState("INBOX");
  const [emails, setEmails] = useState({ totalMessages: 0, totalUnreadMessages: 0, messages: [] });
  const [drafts, setDrafts] = useState([]);
  const [currentDraft, setCurrentDraft] = useState(null);
  const [unreadUids, setUnreadUids] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    console.log(`📩 Запрос писем для категории: ${category}`);
    setEmails({ totalMessages: 0, totalUnreadMessages: 0, messages: [] });

    fetchEmails(category)
      .then((data) => {
        console.log(`✅ Письма загружены: `, data);
        setEmails(data);
      })
      .finally(() => setLoading(false));
  }, [category]);

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
      if (document.visibilityState === 'hidden') {
        markAsReadOnUnload();
      }
    };

    const handlePageHide = () => {
      markAsReadOnUnload();
    };

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
    if (category.toLowerCase() === "drafts") {
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
      if (!email.isRead) {
        setUnreadUids((prev) => new Set(prev).add(email.uid));
      }
    }
  };

  const handleDeleteEmail = (emailId) => {
    setEmails((prev) => ({
      ...prev,
      messages: prev.messages.filter((email) => email.uid !== emailId),
    }));
    setSelectedEmail(null);
    toast.success(
      category.toLowerCase() === 'корзина' || category.toLowerCase() === 'trash'
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
      <SideNav selectCategory={category} onSelectCategory={setCategory} />
      <div className="flex flex-col flex-grow">
        <ContentHeader />
        {loading ? <Loader /> : (
          <div className="flex flex-row flex-grow h-[calc(100%-64px)] overflow-hidden">
            <div className="w-[35%] h-full overflow-hidden">
              <EmailList
                onSelectEmail={handleSelectEmail}
                onDeleteDraft={handleDeleteDraft}
                category={category}
                onCompose={() => handleCompose(null)}
                drafts={drafts}
                selectedEmail={selectedEmail}
                unreadList={unreadUids}
                emails={emails}
                loadMoreEmails={(beforeUid) => {
                  fetchEmails(category, beforeUid).then((data) => {
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
            <div className="flex-grow w-5 h-full">
              {isComposing ? (
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
                      width: '80%',
                      height: '80%',
                      background: '#2D2D30 Ascendancy: 12px',
                      padding: '0',
                      border: 'none'
                    },
                    overlay: {
                      backgroundColor: 'rgba(0, 0, 0, 0.5)'
                    }
                  }}
                >
                  <ComposeEmail
                    onSendEmail={(email) => {
                      sendEmail(email)
                        .then((res) => {
                          console.log("✅ Письмо успешно отправлено:", res);
                          if (email.uid && category.toLowerCase() === "drafts") {
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
              ) : selectedEmail ? (
                <EmailDetails
                  email={selectedEmail}
                  category={category}
                  onEmailDeleted={handleDeleteEmail}
                  onError={handleError}
                  onCompose={handleCompose}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-light-200">
                  Выберите письмо
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}