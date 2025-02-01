const mockEmails = [
    {
      id: 1,
      image: "bg-blue-100",
      from: "Alice Johnson",
      subject: "Meeting tomorrow",
      body: "Hey, don't forget about our meeting at 10 AM.",
      hasAttachment: false,
      time: "9:30 AM",
      category: "Inbox",
    },
    {
      id: 2,
      image: "bg-green-100",
      from: "Bob Smith",
      subject: "Project Update",
      body: "We've completed phase 1 of the project.",
      hasAttachment: true,
      time: "11:45 AM",
      category: "Sent",
    },
    {
      id: 3,
      image: "bg-red-100",
      from: "Charlie Grant",
      subject: "Vacation Plans",
      body: "Thinking about a trip to Spain next month. Interested?",
      hasAttachment: false,
      time: "2:15 PM",
      category: "Inbox",
    },
    {
        id: 4,
        image: "bg-red-100",
        from: "Charlie Grant",
        subject: "Vacation Plans",
        body: "Thinking about a trip to Spain next month. Interested?",
        hasAttachment: false,
        time: "2:15 PM",
        category: "Sent",
      },
      {
        id: 5,
        image: "bg-red-100",
        from: "Charlie Grant",
        subject: "Vacation Plans",
        body: "Thinking about a trip to Spain next month. Interested?",
        hasAttachment: false,
        time: "2:15 PM",
        category: "Inbox",
      },
  ];
  
  export const fetchEmails = () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockEmails), 500);
    });
  };
  