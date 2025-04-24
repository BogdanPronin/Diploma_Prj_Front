import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleAccessButton from "./GoogleAccessButton";

export default function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Все поля обязательны");
      return;
    }
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
      if (!response.ok) {
        throw new Error("Ошибка авторизации");
      }
      const { accessToken, email } = await response.json();
      localStorage.setItem("authData", JSON.stringify({ accessToken, email, provider: "email" }));
      onLogin();
      navigate("/");
    } catch (err) {
      setError("Ошибка авторизации: " + err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-dark-500">
      <div className="flex items-center my-5 justify-center">
        <div className="w-6 h-6 bg-blue-600 rounded-full"></div>
        <span className="font-semibold text-light-100 ml-4 text-2xl">Messenger-Mail</span>
      </div>

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
            <input
              type="password"
              name="confirmPassword"
              placeholder="Подтвердите пароль"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="p-2 rounded bg-dark-300 text-light-200"
              required
            />
          )}

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button type="submit" className="bg-blue-200 text-white p-2 rounded hover:bg-blue-300">
            {isLogin ? "Войти" : "Зарегистрироваться"}
          </button>
        </form>

        <div className="mt-4 flex flex-col items-center gap-2">
          <GoogleAccessButton
            onLogin={() => {
              onLogin();
              navigate("/");
            }}
          />
        </div>

        <p
          className="text-light-500 text-sm text-center mt-4 cursor-pointer"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Нет аккаунта? Зарегистрируйтесь" : "Уже есть аккаунт? Войдите"}
        </p>
      </div>
    </div>
  );
}
