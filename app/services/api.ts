import { API_BASE_URL } from "@/app/lib/constants";
import type { ApiResponse, DashboardData, User } from "@/app/types";

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options?.headers,
  };

  const token = typeof window !== "undefined" ? localStorage.getItem("ps_token") : null;
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();
  return data as ApiResponse<T>;
}

export const api = {
  health: () => fetchApi("/health"),

  bag: {
    check: (uid: string, e: string, c: string) =>
      fetchApi(`/bag?uid=${encodeURIComponent(uid)}&e=${encodeURIComponent(e)}&c=${encodeURIComponent(c)}`),
  },

  auth: {
    register: (body: { name: string; email: string; password: string; serial: string; model: string }) =>
      fetchApi("/auth/register", { method: "POST", body: JSON.stringify(body) }),

    login: (body: { email: string; password: string }) =>
      fetchApi("/auth/login", { method: "POST", body: JSON.stringify(body) }),

    me: () => fetchApi<{ user: User }>("/auth/me"),
  },

  dashboard: {
    get: () => fetchApi<DashboardData>("/dashboard"),
  },
};
