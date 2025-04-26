// src/App.tsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./components/AuthPage";
import MainLayout from "./components/MainLayout";
import AccountSelector from "./components/AccountSelector.tsx";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const activeAccountEmail = JSON.parse(localStorage.getItem("activeAccount") || "null");
  const accounts = JSON.parse(localStorage.getItem("accounts") || "{}");
  const isAuthenticated = activeAccountEmail && accounts[activeAccountEmail];
  return isAuthenticated ? <>{children}</> : <Navigate to="/select-account" replace />;
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const activeAccountEmail = JSON.parse(localStorage.getItem("activeAccount") || "null");
    const accounts = JSON.parse(localStorage.getItem("accounts") || "{}");
    if (activeAccountEmail && accounts[activeAccountEmail]) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<AuthPage onLogin={handleLogin} />} />
        <Route
          path="/select-account"
          element={<AccountSelector onSelectAccount={handleLogin} />}
        />
        <Route
          path="/inbox"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/select-account" replace />} />
      </Routes>
    </Router>
  );
};

export default App;