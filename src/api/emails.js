export const fetchEmails = async (category = "INBOX", beforeUid) => {
  try {
    const url = beforeUid 
      ? `http://localhost:3001/receive?category=${category}&beforeUid=${beforeUid}`
      : `http://localhost:3001/receive?category=${category}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Ошибка при получении писем");
    return await response.json();
  } catch (error) {
    console.error("Ошибка при получении писем:", error);
    return { totalMessages: 0, messages: [] };
  }
};


export const deleteEmail = async (uid) => {
  try {
    const response = await fetch("http://localhost:3001/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    });
    if (!response.ok) throw new Error("Ошибка при удалении письма");
    return await response.json();
  } catch (error) {
    console.error("Ошибка при удалении письма:", error);
    throw error;
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

export const sendEmail = async (email) => {
  try {
    const formData = new FormData();
    formData.append("to", email.to);
    formData.append("subject", email.subject);
    formData.append("text", email.body);
    formData.append("html", email.body);

    // 👇 проверка на attachments перед циклом
    if (email.attachments && email.attachments.length > 0) {
      email.attachments.forEach((attachment) => {
        formData.append("attachments", attachment.fileObj);
      });
    }

    const response = await fetch('http://localhost:3001/send', {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Ошибка при отправке письма");
    }

    return await response.json();
  } catch (error) {
    console.error("Ошибка при отправке письма:", error);
    throw error;
  }
}

