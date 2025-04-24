// src/components/ComposeEmail.jsx
import { useState, useEffect, useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf, faFileImage, faFileWord, faFileArchive, faFileAlt, faTimes } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

// Функция для форматирования размера файла
const formatFileSize = (size) => {
  return size < 1024
    ? `${size} B`
    : size < 1048576
      ? `${(size / 1024).toFixed(1)} KB`
      : `${(size / 1048576).toFixed(1)} MB`;
};

// Функция для определения иконки по MIME-типу
const getFileIcon = (type) => {
  if (!type) return faFileAlt;
  if (type.includes("pdf")) return faFilePdf;
  if (type.includes("image")) return faFileImage;
  if (type.includes("word") || type.includes("msword") || type.includes("vnd.openxmlformats-officedocument.wordprocessingml.document")) return faFileWord;
  if (type.includes("zip") || type.includes("rar")) return faFileArchive;
  return faFileAlt;
};

export default function ComposeEmail({ onSendEmail, draft, setDraft, onClose }) {
  const [email, setEmail] = useState(
    draft || { uid: Date.now(), to: "", subject: "", body: "", attachments: [] }
  );
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (JSON.stringify(draft) !== JSON.stringify(email)) {
      setDraft(email);
    }
  }, [email, draft, setDraft]);

  const handleChange = (e) => {
    setEmail((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditorChange = (value) => {
    setEmail((prev) => ({ ...prev, body: value }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files).map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      fileObj: file,
    }));

    const newAttachments = [...(email.attachments || []), ...files];
    const totalSize = newAttachments.reduce((sum, file) => sum + file.size, 0);

    if (totalSize > 25 * 1024 * 1024) {
      toast.error("Total attachment size exceeds 25MB");
      return;
    }

    setEmail((prev) => ({
      ...prev,
      attachments: newAttachments,
    }));
  };

  const handleRemoveFile = (index) => {
    setEmail((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSend = async () => {
    if (!isValidForm) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSending(true);
    try {
      await onSendEmail(email);
      toast.success("Email sent successfully");
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  // Вычисляем количество файлов и их суммарный размер
  const totalFileSize = useMemo(() => {
    return email.attachments?.reduce((sum, file) => sum + file.size, 0) || 0;
  }, [email.attachments]);

  // Проверка валидности формы
  const isValidForm = useMemo(() => {
    return (
      email.to.trim() &&
      email.subject.trim() &&
      email.body.trim() &&
      totalFileSize <= 25 * 1024 * 1024
    );
  }, [email.to, email.subject, email.body, totalFileSize]);

  const fileCount = email.attachments?.length || 0;

  return (
    <div className="bg-dark-500 p-6 rounded-xl flex flex-col gap-4">
      <input
        className={`p-2 rounded ${!email.to.trim() ? "border-red-500 border-2" : ""}`}
        name="to"
        placeholder="To"
        value={email.to}
        onChange={handleChange}
      />
      <input
        className={`p-2 rounded ${!email.subject.trim() ? "border-red-500 border-2" : ""}`}
        name="subject"
        placeholder="Subject"
        value={email.subject}
        onChange={handleChange}
      />

      <ReactQuill
        value={email.body}
        onChange={handleEditorChange}
        modules={{
          toolbar: [
            [{ font: [] }, { size: [] }],
            ["bold", "italic", "underline", "strike"],
            [{ color: [] }, { background: [] }],
            [{ script: "sub" }, { script: "super" }],
            [{ header: "1" }, { header: "2" }, "blockquote", "code-block"],
            [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
            [{ direction: "rtl" }, { align: [] }],
            ["link", "image", "video", "formula"],
            ["clean"],
          ],
        }}
        theme="snow"
        placeholder="Write your message..."
        className="bg-white h-96 pb-20"
      />

      {/* Форма загрузки файлов */}
      <div className="mt-4">
        <input
          type="file"
          multiple
          onChange={handleFileUpload}
          id="file-upload"
          className="hidden"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer bg-blue-200 text-white px-4 py-2 rounded-md"
        >
          Attach Files
        </label>
      </div>

      {/* Отображение загруженных файлов */}
      {fileCount > 0 && (
        <div className="mt-2 bg-dark-400 p-2 rounded-lg">
          <h3 className="text-light-300 mb-2">
            Attachments ({fileCount} files, {formatFileSize(totalFileSize)}):
          </h3>
          <ul>
            {email.attachments.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between text-white p-2 border-b border-gray-600 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={getFileIcon(file.type)} className="text-gray-300 text-lg" />
                  <span>
                    {file.name} ({formatFileSize(file.size)})
                  </span>
                </div>
                <button onClick={() => handleRemoveFile(index)} className="text-red-500">
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end gap-4">
        <button
          className="bg-gray-500 p-2 rounded text-white"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className={`p-2 rounded text-white ${isValidForm && !isSending ? "bg-blue-200" : "bg-gray-400 cursor-not-allowed"}`}
          onClick={handleSend}
          disabled={!isValidForm || isSending}
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}