// api.js

export const fetchEmails = async (category = "Inbox") => {
  try {
    const response = await fetch("http://localhost:3001/receive");
    if (!response.ok) {
      throw new Error("Ошибка при получении писем");
    }
    const data = await response.json();
    return data;  // Возвращаем весь объект
  } catch (error) {
    console.error("Ошибка при получении писем:", error);
    return {
      totalMessages: 0,
      unreadCount: 0,
      messages: []
    };
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


export const deleteEmail = async (uid) => {
  try {
    const response = await fetch(`http://localhost:3001/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uid }),
    });

    if (!response.ok) {
      throw new Error("Ошибка при удалении письма");
    }

    return await response.json();
  } catch (error) {
    console.error("Ошибка при удалении письма:", error);
    throw error;
  }
};
