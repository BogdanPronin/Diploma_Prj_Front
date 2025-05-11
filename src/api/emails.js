import { toast } from "react-toastify";
import debounce from "lodash/debounce";

// Утилита для получения authData
export const getAuthData = () => {
  const activeAccountEmail = JSON.parse(localStorage.getItem("activeAccount") || "null");
  const accounts = JSON.parse(localStorage.getItem("accounts") || "{}");

  if (!activeAccountEmail || !accounts[activeAccountEmail]) {
    throw new Error("Authentication data is missing");
  }

  const account = accounts[activeAccountEmail];
  return {
    accessToken: account.accessToken,
    provider: account.provider,
    email: activeAccountEmail,
    name: account.name,
    picture: account.picture,
  };
};

export const fetchEmails = async (category = "INBOX", beforeUid) => {
  try {
    const authData = getAuthData();
    const accessToken = authData.accessToken;
    const provider = authData.provider;
    const email = authData.email;

    const baseUrl = `/api/mail/receive`;
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
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) throw new Error("Ошибка при получении писем");
    return await response.json();
  } catch (error) {
    console.error("Ошибка при получении писем:", error);
    return { totalMessages: 0, messages: [] };
  }
};

export const login = async (email, password) => {
  const url = "/api/auth/login";
  const credentials = btoa(`${email}:${password}`);
  const headers = {
    "Authorization": `Basic ${credentials}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Ошибка авторизации: ${response.status}`);
  }

  const result = await response.json();
  return {
    accessToken: password,
    name: result.name,
  };
};

export const register = async (email, password, name) => {
  const url = "/api/auth/register";

  const headers = {
    "Content-Type": "application/json",
  };

  const body = JSON.stringify({
    email: email,
    password: password,
    name: name,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: body,  // Передаем объект как JSON в теле запроса
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Ошибка регистрации: ${response.status}`);
  }

  const result = await response.json();
  return {
    accessToken: password,  // Если токен приходит в ответе
    name: name,
  };
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
    formData.append("to", Array.isArray(emailData.to) ? emailData.to.join(',').trim() : emailData.to.trim());
    if (emailData.cc && (Array.isArray(emailData.cc) ? emailData.cc.length > 0 : emailData.cc.trim())) {
      formData.append("cc", Array.isArray(emailData.cc) ? emailData.cc.join(',').trim() : emailData.cc.trim());
    }
    if (emailData.bcc && (Array.isArray(emailData.bcc) ? emailData.bcc.length > 0 : emailData.bcc.trim())) {
      formData.append("bcc", Array.isArray(emailData.bcc) ? emailData.bcc.join(',').trim() : emailData.bcc.trim());
    }
    formData.append("subject", emailData.subject.trim());
    formData.append("html", emailData.body.trim());
    formData.append("providerName", provider);
    formData.append("email", email);
    if (emailData.inReplyTo) {
      formData.append("inReplyTo", emailData.inReplyTo.trim());
    }
    if (emailData.references) {
      formData.append("references", emailData.references.trim());
    }

    if (emailData.attachments && emailData.attachments.length > 0) {
      emailData.attachments.forEach((attachment) => {
        console.log("📎 Attaching file:", attachment.name);
        formData.append("attachments", attachment.fileObj, attachment.name);
      });
    }

    console.log("📩 Sending email:", Object.fromEntries(formData));

    const response = await fetch("/api/mail/send", {
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

    toast.success("Письмо успешно отправлено!");
    return await response.json();
  } catch (error) {
    console.error("Error sending email:", error);
    toast.error(error.message || "Failed to send email.");
    throw error;
  }
};

export const moveEmailToFolder = async (uid, sourceFolder, toFolder) => {
  try {
    const { accessToken, provider, email } = getAuthData();

    const response = await fetch("/api/mail/move-to-folder", {
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
        toFolder,
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
    console.error(`Error moving email to :${toFolder}`, error);
    toast.error(`Ошибка пермещения письма в папку ${toFolder}`);
    throw error;
  }
};




export const deleteEmailForever = async (uid, currentFolder) => {
  try {
    const { accessToken, provider, email } = getAuthData();

    const response = await fetch("/api/mail/delete-forever", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        providerName: provider,
        email,
        uid,
        folderName: currentFolder,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to delete email: ${response.statusText}`);
    }

    const result = await response.json();
    toast.success(result);
    return result;
  } catch (error) {
    console.error(`Error delete email`, error);
    toast.error(`Ошибка удаления письма`);
    throw error;
  }
};

export const markEmailsAsRead = async (uids) => {
  if (!uids || uids.length === 0) {
    console.warn("⚠️ Пропущен запрос: нет UID писем для отметки как прочитанных.");
    return;
  }

  try {
    const response = await fetch("/api/mail/mark-read-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uids }),
    });

    if (!response.ok) throw new Error("Ошибка при пометке писем как прочитанных");

    console.log("✅ Письма успешно помечены как прочитанные:", uids);
    return await response.json();
  } catch (error) {
    console.error("❌ Ошибка при пометке писем:", error);
    
  }
};

export const fetchEmailsFromSender = async (senderEmail, limit = 20) => {
  try {
    const { accessToken, provider, email } = getAuthData();
    const response = await fetch(
      `/api/mail/emails-from-sender?sender=${encodeURIComponent(senderEmail)}&providerName=${provider}&email=${encodeURIComponent(email)}&limit=${limit}`,
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
      `/api/mail/emails-sent-to?recipient=${encodeURIComponent(recipientEmail)}&providerName=${provider}&email=${encodeURIComponent(email)}&limit=${limit}`,
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

export const downloadAttachment = async (uid, filename, folder) => {
  try {
    const { accessToken, provider, email } = getAuthData();

    const response = await fetch("/api/mail/download-attachment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        uid,
        filename,
        folder,
        email,
        providerName: provider,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to download attachment: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    toast.success("Вложение успешно скачано");
  } catch (error) {
    console.error(`Error downloading attachment:`, error);
    toast.error(`Ошибка при скачивании вложения: ${error.message}`);
    throw error;
  }
};

export const saveDraft = async (emailData) => {
  try {
    const { accessToken, provider, email } = getAuthData();

    const formData = new FormData();
    formData.append("to", Array.isArray(emailData.to) ? emailData.to.join(',').trim() : emailData.to.trim());
    if (emailData.cc && (Array.isArray(emailData.cc) ? emailData.cc.length > 0 : emailData.cc.trim())) {
      formData.append("cc", Array.isArray(emailData.cc) ? emailData.cc.join(',').trim() : emailData.cc.trim());
    }
    if (emailData.bcc && (Array.isArray(emailData.bcc) ? emailData.bcc.length > 0 : emailData.bcc.trim())) {
      formData.append("bcc", Array.isArray(emailData.bcc) ? emailData.bcc.join(',').trim() : emailData.bcc.trim());
    }
    formData.append("subject", emailData.subject.trim());
    formData.append("html", emailData.body.trim());
    formData.append("providerName", provider);
    formData.append("email", email);
    if (emailData.inReplyTo) {
      formData.append("inReplyTo", emailData.inReplyTo.trim());
    }
    if (emailData.references) {
      formData.append("references", emailData.references.trim());
    }

    if (emailData.attachments && emailData.attachments.length > 0) {
      emailData.attachments.forEach((attachment) => {
        console.log("📎 Attaching file:", attachment.name);
        formData.append("attachments", attachment.fileObj, attachment.name);
      });
    }

    console.log("📝 Saving draft:", Object.fromEntries(formData));

    const response = await fetch("/api/mail/save-draft", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to save draft: ${response.statusText}`);
    }

    const uid = await response.json();
    toast.success("Черновик успешно сохранен!");
    return uid; // Возвращает UID черновика
  } catch (error) {
    console.error("Error saving draft:", error);
    toast.error(error.message || "Не удалось сохранить черновик.");
    throw error;
  }
};

export const deleteDraft = async (uid, folder = "DRAFTS") => {
  try {
    const { accessToken, provider, email } = getAuthData();

    const response = await fetch("/api/mail/delete-forever", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        providerName: provider,
        email,
        uid,
        folderName: folder,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to delete draft: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error deleting draft:", error);
    throw error;
  }
};