import { useState, useEffect, useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { toast } from 'react-toastify';
import { formatFileSize, getFileIcon } from '../utils/format';
import Chips from 'react-chips';
import { saveDraft } from '../api/emails';

// Функция для валидации email-адресов
const validateEmails = (emails) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emails.every((email) => email.trim() === '' || emailRegex.test(email.trim()));
};

// Функция для нормализации строк в массивы
const normalizeToArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) return value.split(',').map(email => email.trim());
  return [];
};

// Проверка, заполнено ли письмо
const isDraftNotEmpty = (email) => {
  return (
    (email.to && email.to.length > 0) ||
    (email.cc && email.cc.length > 0) ||
    (email.bcc && email.bcc.length > 0) ||
    (email.subject && email.subject.trim()) ||
    (email.body && email.body.trim()) ||
    (email.attachments && email.attachments.length > 0)
  );
};

export default function ComposeEmail({ onSendEmail, draft, setDraft, onClose }) {
  const [email, setEmail] = useState({
    uid: draft?.uid || Date.now(),
    to: normalizeToArray(draft?.to) || [],
    cc: normalizeToArray(draft?.cc) || [],
    bcc: normalizeToArray(draft?.bcc) || [],
    subject: draft?.subject || "",
    body: draft?.body || "",
    attachments: draft?.attachments || [],
    inReplyTo: draft?.inReplyTo || "",
    references: draft?.references || ""
  });
  const [errors, setErrors] = useState({ to: "", cc: "", bcc: "" });

  useEffect(() => {
    if (JSON.stringify(draft) !== JSON.stringify(email)) {
      setDraft(email);
    }
  }, [email, draft, setDraft]);

  const handleChipChange = (name, chips) => {
    const cleanedChips = chips
      .map(chip => chip.trim())
      .filter(chip => chip !== '');

    if (!validateEmails(cleanedChips)) {
      setErrors((prev) => ({ ...prev, [name]: "Некорректный email-адрес" }));
    } else {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setEmail((prev) => ({ ...prev, [name]: cleanedChips }));
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
    if (!email.to.length) {
      setErrors((prev) => ({ ...prev, to: "Поле To обязательно" }));
      return;
    }
    if (!email.subject.trim()) {
      toast.error("Поле Subject обязательно");
      return;
    }
    if (!email.body.trim()) {
      toast.error("Поле Body обязательно");
      return;
    }
    if (!validateEmails(email.to)) {
      setErrors((prev) => ({ ...prev, to: "Некорректный email-адрес в поле To" }));
      return;
    }
    if (!validateEmails(email.cc)) {
      setErrors((prev) => ({ ...prev, cc: "Некорректный email-адрес в поле CC" }));
      return;
    }
    if (!validateEmails(email.bcc)) {
      setErrors((prev) => ({ ...prev, bcc: "Некорректный email-адрес в поле BCC" }));
      return;
    }

    const emailData = {
      ...email,
      to: email.to.join(','),
      cc: email.cc.join(','),
      bcc: email.bcc.join(','),
      inReplyTo: email.inReplyTo,
      references: email.references
    };

    onSendEmail(emailData);
    toast.success("Отправка...");
    onClose();
  };

  const handleCancel = async () => {
    if (isDraftNotEmpty(email)) {
      try {
        const emailData = {
          ...email,
          to: email.to.join(','),
          cc: email.cc.join(','),
          bcc: email.bcc.join(','),
          body: email.body
        };
        const uid = await saveDraft(emailData);
        console.log(`Черновик сохранен с UID: ${uid}`);
      } catch (error) {
        console.error("Ошибка при сохранении черновика:", error);
      }
    }
    onClose();
  };

  const totalFileSize = useMemo(() => {
    return email.attachments?.reduce((sum, file) => sum + file.size, 0) || 0;
  }, [email.attachments]);

  const fileCount = email.attachments?.length || 0;

  return (
    <div className="bg-dark-500 p-6 rounded-xl flex flex-col gap-4 overflow-y-auto h-full">
      <div>
        <Chips
          value={email.to}
          onChange={(chips) => handleChipChange('to', chips)}
          suggestions={[]}
          placeholder="Кому (введите email и нажмите пробел)"
          className={`p-2 rounded w-full ${errors.to ? 'border border-red-500' : 'border border-gray-300'}`}
          createChipKeys={[32]}
        />
        {errors.to && <p className="text-red-500 text-sm">{errors.to}</p>}
      </div>
      <div>
        <Chips
          value={email.cc}
          onChange={(chips) => handleChipChange('cc', chips)}
          suggestions={[]}
          placeholder="Копия (введите email и нажмите пробел)"
          className={`p-2 rounded w-full ${errors.cc ? 'border border-red-500' : 'border border-gray-300'}`}
          createChipKeys={[32]}
        />
        {errors.cc && <p className="text-red-500 text-sm">{errors.cc}</p>}
      </div>
      <div>
        <Chips
          value={email.bcc}
          onChange={(chips) => handleChipChange('bcc', chips)}
          suggestions={[]}
          placeholder="Скрытая копия (введите email и нажмите пробел)"
          className={`p-2 rounded w-full ${errors.bcc ? 'border border-red-500' : 'border border-gray-300'}`}
          createChipKeys={[32]}
        />
        {errors.bcc && <p className="text-red-500 text-sm">{errors.bcc}</p>}
      </div>
      <input
        className="p-2 rounded border border-gray-300"
        name="subject"
        placeholder="Тема"
        value={email.subject}
        onChange={(e) => setEmail((prev) => ({ ...prev, subject: e.target.value }))}
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
        placeholder="Напишите ваше сообщение..."
        className="bg-white h-96 pb-20"
      />

      <div className="mt-4">
        <input
          type="file"
          multiple
          onChange={handleFileUpload}
          id="file-upload"
          className="hidden"
        />
        <label htmlFor="file-upload" className="cursor-pointer bg-blue-200 text-white px-4 py-2 rounded-md">
          Прикрепить файлы
        </label>
      </div>

      {fileCount > 0 && (
        <div className="mt-2 bg-dark-400 p-2 rounded-lg">
          <h3 className="text-light-300 mb-2">
            Вложения ({fileCount} файлов, {formatFileSize(totalFileSize)}):
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
      <div className="flex justify-end gap-4">
        <button className="bg-gray-500 p-2 rounded text-white" onClick={handleCancel}>
          Отмена
        </button>
        <button className="bg-blue-200 p-2 rounded text-white" onClick={handleSend}>
          Отправить
        </button>
      </div>
    </div>
  );
}