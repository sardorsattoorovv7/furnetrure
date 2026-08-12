import { createContext, useContext, useEffect, useState } from "react";
import {
  login as apiLogin,
  logout as apiLogout,
  fetchMe,
} from "../api/auth";
import { getAccessToken } from "../api/client";

const AuthContext = createContext(null);

const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "OPERATOR"];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      if (getAccessToken()) {
        try {
          const me = await fetchMe();
          setUser(me);
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    }
    bootstrap();
  }, []);

  async function login(username, password) {
    await apiLogin(username, password);
    const me = await fetchMe();
    setUser(me);
    return me;
  }

  async function logout() {
    await apiLogout();
    setUser(null);
  }

  const isStaff = !!user && STAFF_ROLES.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
