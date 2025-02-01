let mockEmails = [
  {
    id: 1,
    image: "bg-blue-400",
    from: "Александра Иванова",
    subject: "Встреча завтра",
    body: "Привет! Напоминаю, что завтра у нас встреча в 10:00 в конференц-зале. Буду ждать!",
    hasAttachment: false,
    time: "10:00",
    category: "Inbox",
    isRead: false,
  },
  {
    id: 2,
    image: "bg-green-600",
    from: "Борис Смирнов",
    subject: "Обновление проекта",
    body: "Добрый день! Мы завершили первый этап проекта и подготовили отчет. Ознакомьтесь, пожалуйста.",
    hasAttachment: true,
    time: "14:30",
    category: "Sent",
    isRead: true,
  },
  {
    id: 3,
    image: "bg-red-400",
    from: "Виктор Петров",
    subject: "Новый заказ",
    body: "Здравствуйте! Хотел бы обсудить детали нового заказа. Свяжитесь со мной, когда будет удобно.",
    hasAttachment: false,
    time: "16:15",
    category: "Inbox",
    isRead: false,
  },
  {
    id: 4,
    image: "bg-yellow-400",
    from: "Галина Сидорова",
    subject: "Документы",
    body: "Коллеги, отправляю вам документы для подписания. Пожалуйста, ознакомьтесь и верните с комментариями.",
    hasAttachment: true,
    time: "11:45",
    category: "Drafts",
    isRead: false,
  },
  {
    id: 5,
    image: "bg-purple-400",
    from: "Дмитрий Кузнецов",
    subject: "Опрос по качеству",
    body: "Добрый день! Просим вас пройти небольшой опрос о качестве предоставленных услуг. Заранее спасибо!",
    hasAttachment: false,
    time: "09:20",
    category: "Inbox",
    isRead: false,
  },
  {
    id: 6,
    image: "bg-orange-400",
    from: "Елена Михайлова",
    subject: "Запись на прием",
    body: "Здравствуйте! Напоминаю, что вы записаны на прием к врачу на 18:00. Пожалуйста, приходите заранее.",
    hasAttachment: false,
    time: "18:00",
    category: "Trash",
    isRead: true,
  },
  {
    id: 7,
    image: "bg-teal-400",
    from: "Жанна Тихонова",
    subject: "Бронирование номера",
    body: "Добрый день! Ваш номер в отеле забронирован с 12 по 15 марта. Подтвердите, пожалуйста, бронирование.",
    hasAttachment: false,
    time: "12:50",
    category: "Inbox",
    isRead: false,
  },
  {
    id: 8,
    image: "bg-pink-400",
    from: "Игорь Васильев",
    subject: "Поздравляем с праздником!",
    body: "Уважаемые коллеги, поздравляем вас с Днем компании! Желаем успехов и процветания!",
    hasAttachment: false,
    time: "13:05",
    category: "Inbox",
    isRead: true,
  },
  {
    id: 9,
    image: "bg-gray-400",
    from: "Кирилл Орлов",
    subject: "Отчет о продажах",
    body: "Всем привет! Отправляю свежий отчет о продажах за последний квартал. Жду ваших комментариев.",
    hasAttachment: true,
    time: "17:30",
    category: "Inbox",
    isRead: false,
  },
];

// Функция отправки нового письма
export const sendEmail = (newEmail) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const email = {
        id: mockEmails.length + 1,
        ...newEmail,
        time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        isRead: false,
      };
      mockEmails = [...mockEmails, email];
      resolve({ success: true, email });
    }, 500);
  });
};

// Функция обновления статуса письма (Прочитано/Не прочитано)
export const markAsRead = (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockEmails = mockEmails.map(email =>
        email.id === id ? { ...email, isRead: true } : email
      );
      resolve({ success: true });
    }, 500);
  });
};

export const deleteEmail = (id) => {
  return new Promise((resolve) => {
    console.log(`Попытка удаления письма ID: ${id}`);
    setTimeout(() => {
      mockEmails = mockEmails.map(email =>
        email.id === id ? { ...email, category: "Trash" } : email
      );
      console.log(`Письмо ID: ${id} перемещено в корзину.`);
      resolve({ success: true });
    }, 500);
  });
};

// Симуляция запроса к серверу
export const fetchEmails = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockEmails), 500);
  });
};
