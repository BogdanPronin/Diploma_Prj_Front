// src/components/GoogleAccessButton.jsx
import { useEffect } from "react";
import { gapi } from "gapi-script";

const CLIENT_ID = "11722271514-k07brdcec7713ovdoos8b1ra2e04s4bl.apps.googleusercontent.com";

export default function GoogleAccessButton({ onLogin }) {
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
      const user = await auth2.signIn({ prompt: "consent" });
      const accessToken = user.getAuthResponse().access_token;
      const profile = user.getBasicProfile();

      const googleData = {
        accessToken,
        email: profile.getEmail(),
        name: profile.getName(),
        picture: profile.getImageUrl(),
        provider: "google",
      };

      onLogin(googleData);
    } catch (err) {
      console.error("Ошибка авторизации через Google:", err);
      alert("Не удалось войти через Google");
    }
  };

  return (
    <button
      onClick={handleLogin}
      className="bg-red-500 text-white p-2 rounded hover:bg-red-600 w-full flex justify-center items-center"
    >
      Войти через Google
    </button>
  );
}