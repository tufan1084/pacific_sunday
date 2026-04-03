"use client";

import { useState, useEffect, useCallback } from "react";
import type { User } from "@/app/types";
import { api } from "@/app/services/api";

export function useAuth() {
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
      setUser(data.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem("ps_token");
    setUser(null);
  };

  return { user, loading, login, logout, refetch: fetchUser };
}
