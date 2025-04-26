// src/components/AuthPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "./LoginForm";

export default function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const accounts = JSON.parse(localStorage.getItem("accounts") || "{}");

  const handleGoogleLogin = (googleData) => {
    const accounts = JSON.parse(localStorage.getItem("accounts") || "{}");
    accounts[googleData.email] = {
      name: googleData.name || "",
      accessToken: googleData.accessToken,
      provider: "google",
      picture: googleData.picture,
    };
    localStorage.setItem("accounts", JSON.stringify(accounts));
    localStorage.setItem("activeAccount", JSON.stringify(googleData.email));

    onLogin();
    navigate("/inbox");
  };

  const handleSelectAccount = () => {
    navigate("/select-account");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-dark-500">
      <div className="flex items-center my-5 justify-center">
        <div className="w-6 h-6 bg-blue-600 rounded-full"></div>
        <span className="font-semibold text-light-100 ml-4 text-2xl">Messenger-Mail</span>
      </div>

      <LoginForm
        onLogin={onLogin}
        onGoogleLogin={handleGoogleLogin}
        onToggleMode={() => setIsLogin(!isLogin)}
        isLogin={isLogin}
        navigate={navigate}
      />

      {Object.keys(accounts).length > 0 && (
        <button
          onClick={handleSelectAccount}
          className="text-light-500 text-sm text-center mt-4 cursor-pointer hover:underline"
        >
          Выбрать аккаунт 
        </button>
      )}
    </div>
  );
}