// src/components/YandexAccessButton.jsx
import { useEffect, useState } from "react";

const YANDEX_CLIENT_ID = "4635dae9a92e4de9ab27ae7bafc0cea5";
const REDIRECT_URI = window.location.origin + "/login";

export default function YandexAccessButton({ onLogin }) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkYandexAuth = async () => {
      if (window.location.hash.includes("access_token")) {
        setIsLoading(true);
        
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        
        if (accessToken) {
          try {
            const response = await fetch("https://login.yandex.ru/info", {
              headers: {
                Authorization: `OAuth ${accessToken}`,
              },
            });

            if (!response.ok) {
              throw new Error("Не удалось получить данные пользователя");
            }

            const userData = await response.json();

            const yandexData = {
              accessToken,
              email: userData.default_email,
              name: userData.real_name || userData.display_name || userData.login,
              picture: userData.default_avatar_id ? `https://avatars.yandex.net/get-yapic/${userData.default_avatar_id}/islands-200` : "",
              provider: "yandex",
            };

            onLogin(yandexData);
            
            if (window.history && window.history.replaceState) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          } catch (error) {
            console.error("Ошибка при получении данных пользователя Яндекса:", error);
            alert("Не удалось войти через Яндекс");
          } finally {
            setIsLoading(false);
          }
        }
      }
    };

    checkYandexAuth();
  }, [onLogin]);

  const handleLogin = () => {
    setIsLoading(true);
    const authUrl = `https://oauth.yandex.ru/authorize?response_type=token&client_id=${YANDEX_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=login:email mail:smtp mail:imap_full login:avatar`;
    
    window.location.href = authUrl;
  };

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 w-full flex justify-center items-center"
    >
      {isLoading ? "Загрузка..." : "Войти через Яндекс"}
    </button>
  );
}