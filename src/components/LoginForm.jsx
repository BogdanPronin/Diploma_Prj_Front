// src/components/LoginForm.jsx
import { useState } from "react";
import { login, register } from "../api/emails";
import GoogleAccessButton from "./GoogleAccessButton";
import YandexAccessButton from "./YandexAccessButton";

export default function LoginForm({ onLogin, onGoogleLogin, onYandexLogin, onToggleMode, isLogin, navigate }) {
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "", name: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const saveAccount = (email, accountData) => {
    const accounts = JSON.parse(localStorage.getItem("accounts") || "{}");
    accounts[email] = accountData;
    localStorage.setItem("accounts", JSON.stringify(accounts));
    localStorage.setItem("activeAccount", JSON.stringify(email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Email и пароль обязательны");
      return;
    }
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    if (!isLogin && !formData.name) {
      setError("Имя обязательно для регистрации");
      return;
    }

    try {
      const { accessToken, name } = isLogin
        ? await login(formData.email, formData.password)
        : await register(formData.email, formData.password, formData.name);

      saveAccount(formData.email, {
        name,
        accessToken,
        provider: "custom",
      });

      onLogin();
      navigate("/inbox");
    } catch (err) {
      setError("Ошибка: " + err.message);
    }
  };

  return (
    <div className="bg-dark-400 p-6 rounded-lg shadow-lg w-96">
      <h2 className="text-light-200 text-2xl font-semibold text-center mb-4">
        {isLogin ? "Вход" : "Регистрация"}
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="p-2 rounded bg-dark-300 text-light-200"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Пароль"
          value={formData.password}
          onChange={handleChange}
          className="p-2 rounded bg-dark-300 text-light-200"
          required
        />
        {!isLogin && (
          <>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Подтвердите пароль"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="p-2 rounded bg-dark-300 text-light-200"
              required
            />
            <input
              type="text"
              name="name"
              placeholder="Имя"
              value={formData.name}
              onChange={handleChange}
              className="p-2 rounded bg-dark-300 text-light-200"
              required
            />
          </>
        )}

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button type="submit" className="bg-blue-200 text-white p-2 rounded hover:bg-blue-300">
          {isLogin ? "Войти" : "Зарегистрироваться"}
        </button>
      </form>

      <div className="mt-4 flex flex-col items-center gap-2">
        <GoogleAccessButton onLogin={onGoogleLogin} />
        <YandexAccessButton onLogin={onYandexLogin} />
      </div>

      <p
        className="text-light-500 text-sm text-center mt-4 cursor-pointer"
        onClick={onToggleMode}
      >
        {isLogin ? "Нет аккаунта? Зарегистрируйтесь" : "Уже есть аккаунт? Войдите"}
      </p>
    </div>
  );
}