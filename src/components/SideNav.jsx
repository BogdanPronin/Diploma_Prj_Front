import React from "react";
import { useState } from "react";

export default function SideNav({ onSelectCategory }) {
  const [activeTab, setActiveTab] = useState("Inbox");

  const navItems = [
    { id: "Inbox", name: "Входящие" },
    { id: "Drafts", name: "Черновики" },
    { id: "Sent", name: "Отправленные" },
    { id: "Trash", name: "Мусор" },
  ];

  return (
    <nav className="w-3/12 h-full bg-dark-600 flex flex-col items-center">
      <div className="flex items-center my-14">
        <div className="w-6 h-6 bg-blue-600 rounded-full"></div>
        <span className="font-semibold text-light-100 ml-4 text-2xl">Messenger-Mail</span>
      </div>
      <ul>
      {navItems.map((navItem, index) => (
          <li
            key={navItem.id}
            className={`cursor-pointer flex items-center relative py-2 transition-all
              ${activeTab === navItem.id ? "font-semibold" : "text-light-200"}
              ${index > 0 ? "my-4" : "mb-4"}`}
            onClick={() => {
              setActiveTab(navItem.id);
              onSelectCategory(navItem.id);
            }}
          >
            {/* Линия слева у активного пункта */}
            {activeTab === navItem.id && (
              <div className="w-10 h-[2px] bg-light-200 absolute -left-12"></div>
            )}
            <span className="text-light-200 text-sm">{navItem.name}</span>
          </li>
        ))}
      </ul>
    </nav>
  );
}
