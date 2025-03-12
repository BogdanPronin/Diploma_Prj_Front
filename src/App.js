import { useState } from "react";
import AuthPage from "./components/AuthPage";
import MainLayout from "./components/MainLayout";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <div className="App">
      {/* {isAuthenticated ? <MainLayout /> : <AuthPage onLogin={() => setIsAuthenticated(true)} />} */}
        <MainLayout />
    </div>
  );
}

export default App;
