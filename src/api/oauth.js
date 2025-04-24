// oauth.js
const CLIENT_ID = "11722271514-k07brdcec7713ovdoos8b1ra2e04s4bl.apps.googleusercontent.com"; // Твой Client ID
const REDIRECT_URI = "http://localhost:3000"; // Redirect URI (должен совпадать с Google Cloud Console)
const SCOPE = "email profile https://mail.google.com/"; // Scope для доступа к Gmail
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USER_INFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

// Функция для открытия окна авторизации Google
export const initiateGoogleAuth = () => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline", // Для получения refreshToken
    prompt: "consent", // Запрашиваем доступ заново
  });

  const authUrl = `${AUTH_URL}?${params.toString()}`;
  window.location.href = authUrl; // Перенаправляем на авторизацию
};

// Функция для обмена code на accessToken
export const exchangeCodeForToken = async (code) => {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: "YOUR_CLIENT_SECRET", // Нужно добавить Client Secret
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange code for token");
  }

  const data = await response.json();
  const accessToken = data.access_token;
  const refreshToken = data.refresh_token;
  const expiresIn = data.expires_in;

  // Получаем email
  const email = await getEmailFromToken(accessToken);

  // Сохраняем данные в localStorage
  const authData = {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresIn * 1000, // Время истечения в миллисекундах
    email,
    provider: "google",
  };
  localStorage.setItem("authData", JSON.stringify(authData));

  return authData;
};

// Функция для получения email
const getEmailFromToken = async (accessToken) => {
  const response = await fetch(USER_INFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user info");
  }

  const data = await response.json();
  return data.email;
};

// Функция для обновления accessToken через refreshToken
export const refreshAccessToken = async () => {
  const authData = JSON.parse(localStorage.getItem("authData") || "{}");
  const refreshToken = authData.refreshToken;

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: "YOUR_CLIENT_SECRET", // Нужно добавить Client Secret
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  const data = await response.json();
  const newAccessToken = data.access_token;
  const expiresIn = data.expires_in;

  // Обновляем authData
  authData.accessToken = newAccessToken;
  authData.expiresAt = Date.now() + expiresIn * 1000;
  localStorage.setItem("authData", JSON.stringify(authData));

  return newAccessToken;
};