// src/components/AccountSelector.tsx
import React from "react";
import { useNavigate, Navigate } from "react-router-dom";

const AccountSelector: React.FC<{ onSelectAccount: () => void }> = ({ onSelectAccount }) => {
  const navigate = useNavigate();
  const accounts = JSON.parse(localStorage.getItem("accounts") || "{}");

  const handleSelectAccount = (email: string) => {
    localStorage.setItem("activeAccount", JSON.stringify(email));
    onSelectAccount();
    navigate("/inbox");
  };

  const handleAddAccount = () => {
    navigate("/login");
  };

  const accountEntries = Object.entries(accounts);
  if (accountEntries.length === 0) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-dark-500">
      <div className="flex items-center my-5 justify-center">
        <div className="w-6 h-6 bg-blue-600 rounded-full"></div>
        <span className="font-semibold text-light-100 ml-4 text-2xl">Messenger-Mail</span>
      </div>

      <div className="bg-dark-400 p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-light-200 text-2xl font-semibold text-center mb-4">
          Выберите аккаунт
        </h2>
        <div className="flex flex-col gap-2">
          {accountEntries.map(([email, account]: [string, any]) => (
            <button
              key={email}
              onClick={() => handleSelectAccount(email)}
              className="flex items-center bg-dark-300 text-light-200 p-3 rounded hover:bg-dark-200"
            >
              {account.picture ? (
                <img
                  src={account.picture}
                  alt="Profile"
                  className="w-8 h-8 rounded-full mr-3"
                />
              ) : (
                <div className="w-8 h-8 bg-green-200 rounded-full mr-3"></div>
              )}
              <div className="flex flex-col">
                <span className=" text-justify">{email}</span>
                <span className=" text-justify text-xs text-light-500">{account.name}</span>
              </div>
            </button>
          ))}
          <button
            onClick={handleAddAccount}
            className="bg-blue-200 text-white p-3 rounded hover:bg-blue-300 mt-2"
          >
            Добавить аккаунт
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSelector;