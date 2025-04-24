// components/GoogleAccessButton.jsx
import { useEffect } from "react";
import { gapi } from "gapi-script";

const CLIENT_ID = "11722271514-k07brdcec7713ovdoos8b1ra2e04s4bl.apps.googleusercontent.com"; // Замени на свой ID из Google Cloud Console

export default function GoogleAuthAccess({ onLogin }) {
    useEffect(() => {
      gapi.load("client:auth2", () => {
        gapi.client.init({
          clientId: CLIENT_ID,
          scope: "https://mail.google.com email profile openid",
        });
      });
    }, []);
  
    const handleLogin = async () => {
      try {
        const auth2 = gapi.auth2.getAuthInstance();
        const user = await auth2.signIn({ prompt: "consent" }); // запрос нового токена с разрешением
        const accessToken = user.getAuthResponse().access_token;
        const profile = user.getBasicProfile();
  
        const authData = {
          accessToken,
          email: profile.getEmail(),
          name: profile.getName(),
          picture: profile.getImageUrl(),
          provider: "google",
        };
  
        localStorage.setItem("authData", JSON.stringify(authData));
        onLogin();
      } catch (err) {
        console.error("Ошибка авторизации через Google:", err);
        alert("Не удалось войти через Google");
      }
    };
  
    return (
      <button
        onClick={handleLogin}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Войти через Google
      </button>
    );
  }