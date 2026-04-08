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

  // Auto-logout on 401/403 (token expired, invalid, or access denied)
  if (response.status === 401 || response.status === 403) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("ps_token");
      window.location.href = "/login";
    }
    return { success: false, message: "Session expired. Please login again." } as ApiResponse<T>;
  }

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
    register: (body: { name: string; email: string; password: string; serial: string; model: string; country?: string }) =>
      fetchApi("/auth/register", { method: "POST", body: JSON.stringify(body) }),

    login: (body: { email: string; password: string }) =>
      fetchApi("/auth/login", { method: "POST", body: JSON.stringify(body) }),

    me: () => fetchApi<{ user: User }>("/auth/me"),
  },

  dashboard: {
    get: () => fetchApi<DashboardData>("/dashboard"),
  },

  profile: {
    get: () => fetchApi("/profile"),
    getBags: () => fetchApi("/profile/bags"),
    getBagScans: (serial: string) => fetchApi(`/profile/bags/${serial}/scans`),
    getGolfPassport: () => fetchApi("/profile/golf-passport"),
    updateGolfPassport: (data: any) => fetchApi("/profile/golf-passport", { method: "PUT", body: JSON.stringify(data) }),
    uploadPhoto: async (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      
      const token = typeof window !== "undefined" ? localStorage.getItem("ps_token") : null;
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/profile/upload-photo`, {
        method: "POST",
        headers,
        body: formData,
      });
      return await response.json();
    },
  },
};
