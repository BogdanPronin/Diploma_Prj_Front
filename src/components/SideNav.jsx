import { useNavigate, useParams } from "react-router-dom";

export default function SideNav({ setIsSideNavOpen }) {
  const { category } = useParams();
  const navigate = useNavigate();
  console.log("SideNav рендерится, category:", category);

  const navItems = [
    { id: "INBOX", name: "Входящие" },
    { id: "DRAFTS", name: "Черновики" },
    { id: "SENT", name: "Отправленные" },
    { id: "TRASH", name: "Корзина" },
    { id: "SPAM", name: "Спам" },
  ];

  const handleSelectCategory = (id) => {
    navigate(`/folder/${id}`);
    setIsSideNavOpen(false);
  };

  return (
    <div className="w-full h-full flex flex-col items-center">
      <div className="flex items-center my-6">
        <div className="w-6 h-6 bg-blue-600 rounded-full"></div>
        <span className="font-semibold text-light-100 ml-4 text-2xl">Messenger-Mail</span>
      </div>

      <ul>
        {navItems.map((navItem, index) => (
          <li
            key={navItem.id}
            className={`cursor-pointer flex items-center relative py-2 transition-all
              ${category?.toUpperCase() === navItem.id ? "font-semibold" : "text-light-200"}
              ${index > 0 ? "my-4" : "mb-4"}`}
            onClick={() => handleSelectCategory(navItem.id)}
          >
            {category?.toUpperCase() === navItem.id && (
              <div className="w-6 h-[2px] bg-light-200 absolute -left-12"></div>
            )}
            <p className="text-light-200 text-lm w-32">{navItem.name}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}