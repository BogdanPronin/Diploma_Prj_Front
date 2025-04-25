import { useEffect, useRef, useState } from "react";
import Modal from "react-modal";
import { fetchEmailsFromSender, fetchEmailsSentTo, downloadAttachment, sendEmail } from "../api/emails";
import { formatEmailDate, parseSender, formatFileSize, getFileIcon } from "./utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faArrowUp, faArrowDown, faPaperclip } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

Modal.setAppElement("#root");

export default function ChatView({ isOpen, onRequestClose, senderEmail }) {
    const [incomingMessages, setIncomingMessages] = useState([]);
    const [sentMessages, setSentMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [messageText, setMessageText] = useState("");
    const [attachments, setAttachments] = useState([]);
    const messagesEndRef = useRef(null);
    const messagesStartRef = useRef(null);
    const textareaRef = useRef(null);
    const [isAtTop, setIsAtTop] = useState(true);

    useEffect(() => {
        if (isOpen && senderEmail) {
            setLoading(true);

            Promise.all([
                fetchEmailsFromSender(senderEmail),
                fetchEmailsSentTo(senderEmail),
            ])
                .then(([incoming, sent]) => {
                    setIncomingMessages(incoming);
                    setSentMessages(sent);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error("❌ Ошибка загрузки чата:", err);
                    setLoading(false);
                });
        }
    }, [isOpen, senderEmail]);

    useEffect(() => {
        if (!loading) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [incomingMessages, sentMessages, loading]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "20px";
            const newHeight = Math.min(textarea.scrollHeight, 120);
            textarea.style.height = `${newHeight}px`;
        }
    }, [messageText]);

    const handleScroll = (e) => {
        setIsAtTop(e.target.scrollTop < 50);
    };

    const handleScrollToggle = () => {
        if (isAtTop) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        } else {
            messagesStartRef.current?.scrollIntoView({ behavior: "smooth" });
        }
        setIsAtTop(!isAtTop);
    };

    const handleSendMessage = async () => {
        if (!messageText.trim() && attachments.length === 0) {
            toast.error("Введите сообщение или прикрепите файл");
            return;
        }

        if (!senderEmail) {
            toast.error("Не указан получатель");
            return;
        }

        try {
            setLoading(true);
            const authData = JSON.parse(localStorage.getItem("authData") || "{}");
            const email = authData.email;

            const htmlContent = `
                <div class="container" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; background-color: #fff; max-width: 600px; margin: 0 auto; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                    <p style="margin: 0 0 10px;">${messageText.replace(/\n/g, "<br />")}</p>
                </div>
            `;

            await sendEmail({
                to: senderEmail,
                subject: "Отправлено из мессенджера",
                body: htmlContent,
                attachments,
            });

            const newSentMessages = await fetchEmailsSentTo(senderEmail);
            setSentMessages(newSentMessages);
            setMessageText("");
            setAttachments([]);
            toast.success("Сообщение отправлено");

            const textarea = textareaRef.current;
            if (textarea) {
                textarea.style.height = "40px";
            }
        } catch (error) {
            console.error("❌ Ошибка отправки сообщения:", error);
            toast.error(error.message || "Не удалось отправить сообщение");
        } finally {
            setLoading(false);
        }
    };

    const handleAttachmentChange = (e) => {
        const files = Array.from(e.target.files);
        setAttachments((prev) => [...prev, ...files]);
    };

    const removeAttachment = (index) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const allMessages = [
        ...incomingMessages.map((msg) => ({ ...msg, isSent: false })),
        ...sentMessages.map((msg) => ({ ...msg, isSent: true })),
    ];

    allMessages.sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            className="w-3/5 h-4/5 bg-dark-500 p-0 rounded-xl overflow-hidden outline-none shadow-none"
            overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
        >
            <div className="sticky top-0 bg-dark-500 p-4 text-light-200 font-bold text-lg border-b border-gray-700 flex justify-between items-center shadow-md z-10">
                <span>Переписка с {senderEmail || "Не указан"}</span>
                <button onClick={onRequestClose} className="text-light-400 hover:text-light-200">
                    <FontAwesomeIcon icon={faTimes} className="text-lg" />
                </button>
            </div>

            <div
                className="p-6 h-[calc(100%-8rem)] overflow-y-auto overflow-x-hidden space-y-4 scrollbar scrollbar-w-3 scrollbar-thumb-gray-500 scrollbar-track-dark-700 scroll-smooth"
                onScroll={handleScroll}
            >
                <div ref={messagesStartRef} className="mt-[60px] scroll-mt-[60px]" />

                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-light-300 text-lg">Загрузка...</p>
                    </div>
                ) : allMessages.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-light-300 text-lg">Нет писем</p>
                    </div>
                ) : (
                    <>
                        {allMessages.map((msg, index) => (
                            <div
                                key={msg.uid}
                                className={`p-3 rounded-xl max-w-[70%] ${
                                    msg.isSent ? "bg-dark-400 text-white ml-auto" : "bg-dark-300 text-light-200"
                                } ${index === 0 ? "mt-[60px]" : ""}`}
                            >
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-light-400">{formatEmailDate(msg.date)}</p>
                                    {!msg.isRead && (
                                        <span className="text-xs text-blue-400 font-semibold">● Непрочитано</span>
                                    )}
                                </div>

                                <p className="text-sm font-bold">{msg.subject || "<Без темы>"}</p>

                                <div
                                    className="text-sm leading-relaxed break-words max-w-full overflow-x-auto overflow-y-auto p-2 rounded-lg scrollbar scrollbar-w-3 scrollbar-thumb-gray-500 scrollbar-track-dark-700"
                                    dangerouslySetInnerHTML={{
                                        __html: msg.html || msg.text.replace(/\n/g, "<br />"),
                                    }}
                                />

                                {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="mt-2 bg-dark-500 p-3 rounded-lg">
                                        <h3 className="text-light-300 mb-2 flex items-center gap-2">
                                            <FontAwesomeIcon icon={faPaperclip} />
                                            Вложения:
                                        </h3>
                                        <ul>
                                            {msg.attachments.map((file, idx) => (
                                                <li
                                                    key={idx}
                                                    className="flex items-center justify-between text-white p-2 border-b border-gray-600 last:border-0"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <FontAwesomeIcon
                                                            icon={getFileIcon(file.mimeType)}
                                                            className="text-gray-300 text-lg"
                                                        />
                                                        <span>{file.filename} ({formatFileSize(file.size)})</span>
                                                    </div>
                                                    <button
                                                        onClick={() => downloadAttachment(msg.uid, file.filename)}
                                                        className="bg-dark-400 text-xs font-medium px-3 py-1 rounded-xl"
                                                    >
                                                        Скачать
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            <div className="sticky bottom-0 bg-[#1A1D21] p-4 border-t border-gray-700 flex flex-col gap-2">
                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {attachments.map((file, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 bg-[#2A2F34] text-white px-3 py-1 rounded-full text-xs"
                            >
                                <span>{file.name}</span>
                                <button
                                    onClick={() => removeAttachment(index)}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    <FontAwesomeIcon icon={faTimes} size="xs" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <label className="cursor-pointer text-[#A1A1A1] hover:text-white">
                        <FontAwesomeIcon icon={faPaperclip} className="text-lg" />
                        <input
                            type="file"
                            multiple
                            hidden
                            onChange={handleAttachmentChange}
                        />
                    </label>

                    <textarea
                        ref={textareaRef}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Напишите сообщение..."
                        className="flex-1 bg-[#2A2F34] text-white p-3 rounded-xl border-none focus:outline-none placeholder-[#A1A1A1] resize-none overflow-y-auto"
                        style={{ minHeight: "20px", maxHeight: "120px" }}
                    />

                    <button
                        onClick={handleSendMessage}
                        disabled={loading}
                        
                    >
                        <FontAwesomeIcon className={`bg-white text-black p-2 rounded-full hover:bg-gray-200 transition ${
                            loading ? "opacity-50 cursor-not-allowed" : ""
                        }`} icon={faArrowUp} size="sm" />
                    </button>
                </div>
            </div>

            <button
                onClick={handleScrollToggle}
                className="fixed bottom-6 right-6 bg-gray-700 text-white p-3 rounded-full shadow-lg hover:bg-gray-600 transition"
            >
                <FontAwesomeIcon icon={isAtTop ? faArrowDown : faArrowUp} className="text-lg" />
            </button>
        </Modal>
    );
}