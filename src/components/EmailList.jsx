// src/components/EmailList.jsx
import { useEffect, useRef, useState } from "react";
import EmailCard from "./EmailCard";
import { faPlus, faComments } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./EmailList.css";
import Loader from "./ui/Loader";

export default function EmailList({
  emails = { totalMessages: 0, totalUnreadMessages: 0, messages: [] },
  onSelectEmail,
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
    console.log("EmailList: Category:", category); // Отладка
    console.log("EmailList: Emails:", messages);
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
    console.log(unreadList);
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
    if (email.children) {
      count += email.children.reduce(
        (sum, child) => sum + countThreadMessages(child),
        0
      );
    }
    return count;
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
                {/* Корневое письмо */}
                <div className="relative">
                  <EmailCard
                    key={email.uid}
                    {...email}
                    isSelected={selectedEmail && email.uid === selectedEmail.uid}
                    onClick={() => onSelectEmail(email)}
                    category={category}
                    isRead={unreadList.has(email.uid)}
                  />
                  {threadCount > 1 && (
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

                {/* Дочерние письма */}
                {isExpanded && email.children && email.children.length > 0 && (
                  <div className="ml-6 space-y-2">
                    {email.children.map((child) => (
                      <EmailCard
                        key={child.uid}
                        {...child}
                        isSelected={selectedEmail && child.uid === selectedEmail.uid}
                        onClick={() => onSelectEmail(child)}
                        category={category}
                        isRead={unreadList.has(child.uid)}
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