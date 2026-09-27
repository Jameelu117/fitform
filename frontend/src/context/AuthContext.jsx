// AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../services/api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("fitform_user") || "null"));
  const [loading, setLoading] = useState(false);

  const persist = (data) => {
    localStorage.setItem("fitform_token", data.access_token);
    localStorage.setItem("fitform_user", JSON.stringify(data.user));
    setUser(data.user);
  };
  const login = async (email, password) => { setLoading(true); try { persist(await authApi.login(email, password)); } finally { setLoading(false); } };
  const signup = async (name, email, password) => { setLoading(true); try { persist(await authApi.signup(name, email, password)); } finally { setLoading(false); } };
  const logout = () => { localStorage.clear(); setUser(null); };

  return <AuthCtx.Provider value={{ user, loading, login, signup, logout }}>{children}</AuthCtx.Provider>;
}