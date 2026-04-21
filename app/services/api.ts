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

  // Endpoints where a 401 is a legitimate "bad credentials" response, NOT an expired session.
  // For these, pass the error through instead of auto-logging out.
  const isAuthAttempt = endpoint.startsWith("/auth/login") || endpoint.startsWith("/auth/register");

  // Auto-logout on 401/403 only if the user already had a token (actual session expiry)
  if ((response.status === 401 || response.status === 403) && !isAuthAttempt && token) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("ps_token");
      window.location.href = "/login";
    }
    return { success: false, message: "Session expired. Please login again." } as ApiResponse<T>;
  }

  const data = await response.json().catch(() => ({
    success: false,
    message: `Request failed with status ${response.status}`,
  }));
  return data as ApiResponse<T>;
}

export const api = {
  health: () => fetchApi("/health"),

  bag: {
    check: (e: string, c?: string, d?: string) => {
      const params = new URLSearchParams({ e });
      if (c) params.set("c", c);
      if (d) params.set("d", d);
      return fetchApi(`/bag?${params.toString()}`);
    },
  },

  auth: {
    register: (body: { name: string; email: string; password: string; bagUid: string; country?: string }) =>
      fetchApi("/auth/register", { method: "POST", body: JSON.stringify(body) }),

    login: (body: { email: string; password: string }) =>
      fetchApi("/auth/login", { method: "POST", body: JSON.stringify(body) }),

    me: () => fetchApi<{ user: User }>("/auth/me"),
  },

  dashboard: {
    get: () => fetchApi<DashboardData>("/dashboard"),
  },

  golf: {
    getTournaments: (year?: number) => {
      const params = year ? `?year=${year}` : '';
      return fetchApi(`/golf/tournaments${params}`);
    },
    // Single-call endpoint: returns { tournament, tiers, leaderboard }
    getTournamentFantasy: (tournId: string, year?: number) => {
      const params = year ? `?year=${year}` : '';
      return fetchApi(`/golf/tournament/${tournId}/fantasy${params}`);
    },
    // Picks — authenticated
    getPicks: (tournId: string, year?: number) => {
      const params = year ? `?year=${year}` : '';
      return fetchApi<{ picks: Record<string, string | null>; submittedAt: string; lockedAt: string | null } | null>(
        `/golf/tournament/${tournId}/picks${params}`
      );
    },
    savePicks: (tournId: string, picks: Record<string, string | null>, year?: number) => {
      const params = year ? `?year=${year}` : '';
      return fetchApi<{ picks: Record<string, string | null>; submittedAt: string; lockedAt: string | null }>(
        `/golf/tournament/${tournId}/picks${params}`,
        { method: "PUT", body: JSON.stringify({ picks }) }
      );
    },
    lockPicks: (tournId: string, picks: Record<string, string | null>, year?: number) => {
      const params = year ? `?year=${year}` : '';
      return fetchApi<{ picks: Record<string, string | null>; submittedAt: string; lockedAt: string }>(
        `/golf/tournament/${tournId}/picks/lock${params}`,
        { method: "POST", body: JSON.stringify({ picks }) }
      );
    },
  },

  profile: {
    get: () => fetchApi("/profile"),
    getBags: () => fetchApi("/profile/bags"),
    getBagScans: (bagId: number) => fetchApi(`/profile/bags/${bagId}/scans`),
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
