import { useState } from "react";

export default function AuthPage({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true); // true - Login, false - Register
    const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "" });
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(""); // Сбрасываем ошибки при изменении
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            setError("All fields are required");
            return;
        }
        if (!isLogin && formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        console.log(isLogin ? "Logging in..." : "Registering...");
        console.log("Email:", formData.email);
        console.log("Password:", formData.password);

        // Заглушка успешного входа
        onLogin();
    };

    return (

        <div className="flex flex-col items-center justify-center h-screen bg-dark-500">
            <div className="flex items-center my-5 justify-center">
                <div className="w-6 h-6 bg-blue-600 rounded-full"></div>
                <span className="font-semibold text-light-100 ml-4 text-2xl">Messenger-Mail</span>
            </div>
            <div className="bg-dark-400 p-6 rounded-lg shadow-lg w-96">


                <h2 className="text-light-200 text-2xl font-semibold text-center mb-4">
                    {isLogin ? "Login" : "Register"}
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
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        className="p-2 rounded bg-dark-300 text-light-200"
                        required
                    />
                    {!isLogin && (
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm Password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="p-2 rounded bg-dark-300 text-light-200"
                            required
                        />
                    )}

                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                    <button type="submit" className="bg-blue-200 text-white p-2 rounded hover:bg-blue-300">
                        {isLogin ? "Login" : "Register"}
                    </button>
                </form>

                <p className="text-light-500 text-sm text-center mt-4 cursor-pointer" onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
                </p>
            </div>
        </div>
    );
}
