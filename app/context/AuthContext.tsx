"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User } from "@/app/types";
import { api } from "@/app/services/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (body: { name: string; email: string; password: string; bagUid: string; country?: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("ps_token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.auth.me();
      if (res.success && res.data) {
        setUser(res.data.user);
      } else {
        localStorage.removeItem("ps_token");
      }
    } catch {
      localStorage.removeItem("ps_token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    if (res.success && res.data) {
      const data = res.data as { token: string; user: User };
      localStorage.setItem("ps_token", data.token);
      localStorage.setItem("ps_user_id", data.user.id.toString());
      setUser(data.user);
    }
    return { success: res.success, message: res.message };
  };

  const register = async (body: { name: string; email: string; password: string; bagUid: string; country?: string }) => {
    const res = await api.auth.register(body);
    if (res.success && res.data) {
      const data = res.data as { token: string; user: User };
      localStorage.setItem("ps_token", data.token);
      localStorage.setItem("ps_user_id", data.user.id.toString());
      setUser(data.user);
    }
    return { success: res.success, message: res.message };
  };

  const logout = () => {
    localStorage.removeItem("ps_token");
    localStorage.removeItem("ps_user_id");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
