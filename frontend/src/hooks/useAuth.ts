import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/auth";
import { loginUser } from "../api/authApi";
import { saveTokens, clearTokens } from "../utils/Storages";

export const useAuth = () => {
  const { isAuthenticated, setIsAuthenticated, userProfile } =
    useContext(AuthContext)!;
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    setError(null);
    try {
      const tokens = await loginUser(email, password);
      saveTokens(tokens);
      setIsAuthenticated(true);

      navigate("/");
    } catch (err: any) {
      console.error(
        "❌ Login Error:",
        err.response?.data?.message || "Unknown error"
      );
      setError(
        err.response?.data?.message || "❌ Login failed due to unknown error."
      );
    }
  };

  const handleLogout = () => {
    clearTokens();
    setIsAuthenticated(false);
    navigate("/");
  };

  return { handleLogin, handleLogout, isAuthenticated, error, userProfile };
};
