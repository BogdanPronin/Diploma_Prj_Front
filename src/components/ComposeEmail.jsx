import { useState, useEffect, useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf, faFileImage, faFileWord, faFileArchive, faFileAlt, faTimes } from "@fortawesome/free-solid-svg-icons";

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

export default function ComposeEmail({ onSendEmail, draft, setDraft }) {
  const [email, setEmail] = useState(
    draft || { uid: Date.now(), to: "", subject: "", body: "", attachments: [] }
  );

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

    setEmail((prev) => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...files],
    }));
  };

  const handleRemoveFile = (index) => {
    setEmail((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSend = () => {
    if (email.to.trim() && email.subject.trim() && email.body.trim()) {
      console.log("Email sent:", email);
      onSendEmail(email);  // ⬅️ обязательно передаем объект email
    } else {
      alert("Заполните все поля перед отправкой!");
    }
  };




  // Вычисляем количество файлов и их суммарный размер
  const totalFileSize = useMemo(() => {
    return email.attachments?.reduce((sum, file) => sum + file.size, 0) || 0;
  }, [email.attachments]);

  const fileCount = email.attachments?.length || 0;

  return (
    <div className="bg-dark-500 p-6 rounded-xl flex flex-col gap-4">
      <input className="p-2 rounded" name="to" placeholder="To" value={email.to} onChange={handleChange} />
      <input className="p-2 rounded" name="subject" placeholder="Subject" value={email.subject} onChange={handleChange} />


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
        className="bg-white  h-96 pb-20"
      />
      {/* Форма загрузки файлов */}
      <div className="mt-4">
        <input
          type="file"
          multiple
          onChange={handleFileUpload} // убедись, что имя обработчика совпадает
          id="file-upload" // именно id, а не uid
          className="hidden"
        />
        <label htmlFor="file-upload" className="cursor-pointer bg-blue-200 text-white px-4 py-2 rounded-md">
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
              <li key={index} className="flex items-center justify-between text-white p-2 border-b border-gray-600 last:border-0">
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={getFileIcon(file.type)} className="text-gray-300 text-lg" />
                  <span>{file.name} ({formatFileSize(file.size)})</span>
                </div>
                <button onClick={() => handleRemoveFile(index)} className="text-red-500">
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button className="bg-blue-200 p-2 rounded text-white mt-4" onClick={handleSend}>Send</button>
    </div>
  );
}
