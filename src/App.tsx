import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import AuthPage from "./components/AuthPage";
import MainLayout from "./components/MainLayout";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authData = JSON.parse(localStorage.getItem("authData") || "{}");
  const isAuthenticated = !!authData.accessToken;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authData = JSON.parse(localStorage.getItem("authData") || "{}");
    if (authData.accessToken) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <GoogleOAuthProvider clientId="11722271514-k07brdcec7713ovdoos8b1ra2e04s4bl.apps.googleusercontent.com">
      <Router>
        <Routes>
          <Route path="/login" element={<AuthPage onLogin={handleLogin} />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;