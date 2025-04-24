import { toast } from "react-toastify";
import debounce from "lodash/debounce";

// Утилита для получения authData
const getAuthData = () => {
  const authData = JSON.parse(localStorage.getItem("authData") || "{}");
  if (!authData.accessToken || !authData.provider || !authData.email) {
    throw new Error("Authentication data is missing");
  }
  return authData;
};

export const fetchEmails = async (category = "INBOX", beforeUid) => {
  try {
    const authData = JSON.parse(localStorage.getItem("authData") || "{}");
    const accessToken = authData.accessToken;
    const provider = authData.provider;
    const email = authData.email;

    // Формируем URL без accessToken в query
    const baseUrl = `http://localhost:8080/api/mail/receive`;
    const queryParams = new URLSearchParams({
      category,
      provider,
      email,
    });
    if (beforeUid) {
      queryParams.append("beforeUid", beforeUid);
    }
    const url = `${baseUrl}?${queryParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`, // Передаём токен в заголовке
      },
    });

    if (!response.ok) throw new Error("Ошибка при получении писем");
    return await response.json();
  } catch (error) {
    console.error("Ошибка при получении писем:", error);
    return { totalMessages: 0, messages: [] };
  }
};


export const markEmailAsRead = async (uids) => {
  try {
    const response = await fetch("http://localhost:3001/mark-read", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uids }),
    });

    if (!response.ok) {
      throw new Error("Ошибка при обновлении статуса письма");
    }

    const data = await response.json();
    console.log("Статус обновления прочитанности:", data);
  } catch (error) {
    console.error("Ошибка при обновлении статуса письма:", error);
  }
};  

export const sendEmail = async (emailData) => {
  try {
    const { accessToken, provider, email } = getAuthData();

    const formData = new FormData();
    formData.append("to", emailData.to.trim());
    formData.append("subject", emailData.subject.trim());
    formData.append("html", emailData.body.trim());
    formData.append("providerName", provider);
    formData.append("email", email); // Добавляем email из authData

    if (emailData.attachments && emailData.attachments.length > 0) {
      emailData.attachments.forEach((attachment) => {
        console.log("📎 Attaching file:", attachment.name);
        formData.append("attachments", attachment.fileObj, attachment.name);
      });
    }

    console.log("📩 Sending email:", Object.fromEntries(formData));

    const response = await fetch("http://localhost:8080/api/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to send email: ${response.statusText}`);
    }

    toast.success("Email sent successfully!");
    return await response.json();
  } catch (error) {
    console.error("Error sending email:", error);
    toast.error(error.message || "Failed to send email.");
    throw error;
  }
};

export const moveEmailToTrash = async (uid, sourceFolder) => {
  try {
    const { accessToken, provider, email } = getAuthData();

    const response = await fetch("http://localhost:8080/api/mail/move-to-trash", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        providerName: provider,
        email,
        uid,
        sourceFolder,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to move email: ${response.statusText}`);
    }

    const result = await response.json();
    toast.success(result);
    return result;
  } catch (error) {
    console.error("Error moving email to trash:", error);
    toast.error("Failed to move email to trash.");
    throw error;
  }
};




export const deleteEmailForever = async (uid, currentFolder) => {
  const response = await fetch("http://localhost:3001/delete-forever", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, currentFolder }),
  });

  if (!response.ok) throw new Error("Ошибка при окончательном удалении письма");
  return await response.json();
};

export const markEmailsAsRead = async (uids) => {
  if (!uids || uids.length === 0) {
    console.warn("⚠️ Пропущен запрос: нет UID писем для отметки как прочитанных.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3001/mark-read-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uids }),
    });

    if (!response.ok) throw new Error("Ошибка при пометке писем как прочитанных");

    console.log("✅ Письма успешно помечены как прочитанные:", uids);
    return await response.json();
  } catch (error) {
    console.error("❌ Ошибка при пометке писем:", error);
    throw error;
  }
};

export const fetchEmailsFromSender = async (senderEmail, limit = 20) => {
  try {
    const { accessToken, provider, email } = getAuthData();
    const response = await fetch(
      `http://localhost:8080/api/mail/emails-from-sender?sender=${encodeURIComponent(senderEmail)}&providerName=${provider}&email=${encodeURIComponent(email)}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch emails from sender");
    }

    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error("Error fetching emails from sender:", error);
    toast.error(error.message || "Failed to fetch emails from sender");
    return [];
  }
};

export const fetchEmailsSentTo = async (recipientEmail, limit = 20) => {
  try {
    const { accessToken, provider, email } = getAuthData();
    const response = await fetch(
      `http://localhost:8080/api/mail/emails-sent-to?recipient=${encodeURIComponent(recipientEmail)}&providerName=${provider}&email=${encodeURIComponent(email)}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch emails sent to recipient");
    }

    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error("Error fetching emails sent to recipient:", error);
    toast.error(error.message || "Failed to fetch emails sent to recipient");
    return [];
  }
};

export const downloadAttachment = async (uid, filename) => {
  try {
    const response = await fetch(`http://localhost:3001/download-attachment?uid=${uid}&filename=${filename}`);
    if (!response.ok) throw new Error("Ошибка при скачивании файла");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Ошибка при скачивании файла:", error);
  }
};

