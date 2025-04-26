// src/components/ContentHeader.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  faBell,
  faEnvelope,
  faFolder,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function ContentHeader() {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const activeAccountEmail = JSON.parse(localStorage.getItem("activeAccount") || "null");
  const accounts = JSON.parse(localStorage.getItem("accounts") || "{}");
  const activeAccount = accounts[activeAccountEmail] || {};
  const userName = activeAccount.name || "Пользователь";
  const userPicture = activeAccount.picture || "";
  const otherAccounts = Object.entries(accounts).filter(([email]) => email !== activeAccountEmail);

  const handleLogout = () => {
    const updatedAccounts = { ...accounts };
    delete updatedAccounts[activeAccountEmail];
    localStorage.setItem("accounts", JSON.stringify(updatedAccounts));
    localStorage.removeItem("activeAccount");
    setIsDropdownOpen(false);
    navigate("/login");
  };

  const handleSelectAccount = (email) => {
    localStorage.setItem("activeAccount", JSON.stringify(email));
    setIsDropdownOpen(false);
    window.location.reload();
  };

  const handleAddAccount = () => {
    setIsDropdownOpen(false);
    navigate("/login");
  };

  return (
    <div className="bg-dark-500 flex items-center py-6 px-10 mb-1">
      <FontAwesomeIcon
        icon={faMagnifyingGlass}
        className="text-xl text-light-300"
      />
      <input
        placeholder="Search..."
        className="w-4/12 mr-auto ml-4 bg-transparent outline-none"
      />
      <FontAwesomeIcon icon={faFolder} className="text-light-600 mx-2" />
      <FontAwesomeIcon icon={faBell} className="text-light-600 mx-2" />
      <FontAwesomeIcon icon={faEnvelope} className="text-light-600 mx-2" />
      <div className="relative flex items-center">
        {userPicture ? (
          <img
            src={userPicture}
            alt="Profile"
            className="w-8 h-8 rounded-xl ml-8 mr-4 cursor-pointer"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          />
        ) : (
          <div
            className="w-8 h-8 bg-green-200 rounded-xl ml-8 mr-4 cursor-pointer"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          ></div>
        )}
        <span
          className="font-light text-xs text-light-100 cursor-pointer"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          {userName}
        </span>
        {isDropdownOpen && (
          <div className="absolute right-0 top-10 mt-2 w-64 bg-dark-300 rounded-lg shadow-lg z-10">
            {otherAccounts.length > 0 ? (
              otherAccounts.map(([email, account]) => (
                <button
                  key={email}
                  onClick={() => handleSelectAccount(email)}
                  className="flex items-center w-full text-left px-4 py-2 text-light-200 hover:bg-dark-400"
                >
                  {account.picture ? (
                    <img
                      src={account.picture}
                      alt="Profile"
                      className="w-6 h-6 rounded-xl mr-3"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-green-200 rounded-xl mr-3"></div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-light text-xs text-light-100">
                      {account.name || "Пользователь"}
                    </span>
                    <span className="text-xs text-light-500">{email}</span>
                  </div>
                </button>
              ))
            ) : (
              <p className="px-4 py-2 text-light-500 text-sm">Нет других аккаунтов</p>
            )}
            <button
              onClick={handleAddAccount}
              className="block w-full text-left px-4 py-2 text-blue-400 hover:bg-dark-400"
            >
              Добавить аккаунт
            </button>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-red-400 hover:bg-dark-400"
            >
              Выйти из аккаунта
            </button>
          </div>
        )}
      </div>
    </div>
  );
}