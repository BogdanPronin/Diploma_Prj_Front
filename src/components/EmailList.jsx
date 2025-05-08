// src/components/EmailList.jsx
import { useEffect, useRef, useState } from "react";
import EmailCard from "./EmailCard";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./EmailList.css";
import Loader from "./ui/Loader";

export default function EmailList({
  emails = { totalMessages: 0, totalUnreadMessages: 0, messages: [] },
  onSelectEmail,
  onDeleteDraft,
  category,
  onCompose,
  selectedEmail,
  loadMoreEmails,
  unreadList
}) {
  const { totalMessages, totalUnreadMessages, messages } = emails;
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastLoadedUid, setLastLoadedUid] = useState(null);
  const [expandedThreads, setExpandedThreads] = useState(new Set());

  useEffect(() => {
    console.log("EmailList: Category:", category);
    console.log("EmailList: Messages:", messages.map(m => ({
      uid: m.uid,
      messageId: m.messageId,
      references: m.references,
      threadMessages: m.threadMessages?.map(c => c.uid) || null
    })));
  }, [category, messages]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (
      container.scrollHeight - container.scrollTop <=
        container.clientHeight + 100 &&
      !isLoading
    ) {
      if (messages && messages.length > 0) {
        const oldestUid = messages[messages.length - 1].uid;
        if (oldestUid !== lastLoadedUid) {
          console.log("Loading more with beforeUid:", oldestUid);
          setIsLoading(true);
          setLastLoadedUid(oldestUid);
          loadMoreEmails(oldestUid).finally(() => setIsLoading(false));
        }
      }
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    container.addEventListener("scroll", handleScroll);
    console.log("unreadList:", unreadList);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [messages, isLoading]);

  // Переключение состояния цепочки
  const toggleThread = (threadId) => {
    setExpandedThreads((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };

  // Подсчет общего количества писем в цепочке
  const countThreadMessages = (email) => {
    let count = 1;
    if (email.threadMessages) {
      count += email.threadMessages.reduce(
        (sum, child) => sum + countThreadMessages(child),
        0
      );
    }
    return count;
  };

  // Проверка, является ли письмо частью цепочки
  const isInThread = (email) => {
    return (email.threadMessages && email.threadMessages.length > 0) || (email.references && email.references.trim().length > 0);
  };

  return (
    <div className="flex flex-col bg-dark-500 min-w-[350px] h-full">
      <div className="flex items-center py-6 px-6">
        <span className="font-light text-xl text-light-200">
          {totalUnreadMessages}/{totalMessages}
        </span>
        <FontAwesomeIcon
          icon={faPlus}
          className="px-3 py-3 rounded-xl bg-gradient-to-br from-blue-200 to-blue-300 text-light-200 drop-shadow-3xl ml-auto cursor-pointer"
          onClick={onCompose}
        />
      </div>
      <div
        className="flex flex-col px-6 pb-5 overflow-y-auto space-y-4"
        ref={containerRef}
        onScroll={handleScroll}
      >
        {messages && messages.length > 0 ? (
          messages.map((email) => {
            const threadId = email.messageId || email.uid;
            const isExpanded = expandedThreads.has(threadId);
            const threadCount = countThreadMessages(email);

            return (
              <div key={email.uid} className="space-y-2">
                {/* Последнее письмо цепочки */}
                <div className="relative flex items-center">
                  <div className="flex-grow">
                    <EmailCard
                      {...email}
                      isSelected={selectedEmail && email.uid === selectedEmail.uid}
                      onClick={() => onSelectEmail(email)}
                      category={category}
                      isRead={category.toLowerCase() === "drafts" ? true : unreadList.has(email.uid)}
                    />
                  </div>
                  {category.toLowerCase() === "drafts" && (
                    <button
                      className="ml-2 text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDraft(email.uid);
                      }}
                      title="Удалить черновик"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
                  {category.toLowerCase() !== "drafts" && isInThread(email) && (
                    <span
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-light-400 text-sm cursor-pointer hover:text-light-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleThread(threadId);
                      }}
                    >
                      ({threadCount})
                    </span>
                  )}
                </div>

                {/* Цепочка (от старого к новому) */}
                {isExpanded && email.threadMessages && email.threadMessages.length > 0 && (
                  <div className="ml-6 space-y-2">
                    {email.threadMessages
                      .sort((a, b) => {
                        const dateA = a.date ? new Date(a.date).getTime() : 0;
                        const dateB = b.date ? new Date(b.date).getTime() : 0;
                        return dateA - dateB; // От старого к новому
                      })
                      .map((threadEmail) => (
                        <EmailCard
                          key={threadEmail.uid}
                          {...threadEmail}
                          isSelected={selectedEmail && threadEmail.uid === selectedEmail.uid}
                          onClick={() => onSelectEmail(threadEmail)}
                          category={category}
                          isRead={unreadList.has(threadEmail.uid)}
                        />
                      ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-light-400 text-center mt-10">Нет писем</div>
        )}

        {isLoading && <Loader />}
      </div>
    </div>
  );
}