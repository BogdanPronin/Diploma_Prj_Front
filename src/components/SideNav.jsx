import React from "react";
import { useState } from "react";

export default function SideNav({ onSelectCategory }) {
  const [activeTab, setActiveTab] = useState("INBOX");

  const navItems = [
    { id: "INBOX", name: "Входящие" },
    { id: "Черновики", name: "Черновики" },
    { id: "Отправленные", name: "Отправленные" },
    { id: "Корзина", name: "Мусор" },
    { id: "Archive", name: "Архив" },
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
            {/* Линия слева у активногFо пункта */}
            {activeTab === navItem.id && (
              <div className="w-6 h-[2px] bg-light-200 absolute -left-12"></div>
            )}
            <p className="text-light-200 text-lm w-32">{navItem.name}</p>
          </li>
        ))}
      </ul>
      
    </nav>
  );
}
