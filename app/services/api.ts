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

  // Auto-logout on 401/403 for any protected endpoint — covers both expired sessions
  // (token present but invalid) and missing-token access to protected pages.
  if ((response.status === 401 || response.status === 403) && !isAuthAttempt) {
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      localStorage.removeItem("ps_token");
      localStorage.removeItem("ps_user_id");
      window.location.href = "/login";
    }
    return {
      success: false,
      message: token ? "Session expired. Please login again." : "Access denied. No token provided.",
    } as ApiResponse<T>;
  }

  const data = await response.json().catch(() => ({
    success: false,
    message: `Request failed with status ${response.status}`,
  }));
  return data as ApiResponse<T>;
}

export const api = {
  health: () => fetchApi("/health"),

  stats: {
    community: () => fetchApi<{ totalUsers: number }>("/stats/community"),
  },

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

    forgotPassword: (email: string) =>
      fetchApi("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),

    verifyOtp: (email: string, otp: string) =>
      fetchApi<{ resetToken: string }>("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      }),

    resetPassword: (resetToken: string, newPassword: string) =>
      fetchApi("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ resetToken, newPassword }),
      }),
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

  posts: {
    getAll: (limit?: number, offset?: number, teamId?: number) => {
      const params = new URLSearchParams();
      if (limit) params.set('limit', limit.toString());
      if (offset) params.set('offset', offset.toString());
      if (teamId) params.set('teamId', teamId.toString());
      return fetchApi(`/posts?${params.toString()}`);
    },
    getPublic: (postId: number) => fetchApi(`/posts/${postId}/public`),
    create: (data: { content: string; postType?: string; mediaUrls?: string[]; teamId?: number }) =>
      fetchApi("/posts", { method: "POST", body: JSON.stringify(data) }),
    uploadMedia: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => formData.append('media', file));

      const token = typeof window !== "undefined" ? localStorage.getItem("ps_token") : null;
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/posts/upload-media`, {
        method: "POST",
        headers,
        body: formData,
      });
      return await response.json();
    },
    like: (postId: number) => fetchApi(`/posts/${postId}/like`, { method: "POST" }),
    addComment: (postId: number, content: string, parentId?: number) =>
      fetchApi(`/posts/${postId}/comments`, { method: "POST", body: JSON.stringify({ content, parentId }) }),
    getComments: (postId: number) => fetchApi(`/posts/${postId}/comments`),
    togglePin: (postId: number) =>
      fetchApi<{ isPinned: boolean }>(`/posts/${postId}/pin`, { method: "POST" }),
    delete: (postId: number) =>
      fetchApi(`/posts/${postId}`, { method: "DELETE" }),
    share: (postId: number) =>
      fetchApi<{ postId: number; shareCount: number }>(`/posts/${postId}/share`, { method: "POST" }),
  },

  teams: {
    list: () => fetchApi<{ teams: ApiTeam[] }>("/teams"),
    get: (teamId: number) => fetchApi<{ team: ApiTeamDetail }>(`/teams/${teamId}`),
    create: (data: { name: string; description?: string; privacy: "public" | "private"; memberIds?: number[] }) =>
      fetchApi<{ team: ApiTeam }>("/teams", { method: "POST", body: JSON.stringify(data) }),
    update: (teamId: number, data: { name?: string; description?: string; privacy?: "public" | "private" }) =>
      fetchApi<{ team: ApiTeam }>(`/teams/${teamId}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (teamId: number) =>
      fetchApi(`/teams/${teamId}`, { method: "DELETE" }),
    join: (teamId: number) =>
      fetchApi<{ teamId: number; memberCount: number; isMember: boolean }>(
        `/teams/${teamId}/join`, { method: "POST" }
      ),
    leave: (teamId: number) =>
      fetchApi<{ teamId: number; memberCount: number; isMember: boolean }>(
        `/teams/${teamId}/leave`, { method: "POST" }
      ),
    searchUsers: (q: string) =>
      fetchApi<{ users: { id: number; username: string; name: string }[] }>(
        `/teams/users/search?q=${encodeURIComponent(q)}`
      ),
    getJoinRequests: (teamId: number) =>
      fetchApi<{ requests: ApiJoinRequest[] }>(`/teams/${teamId}/join-requests`),
    approveJoinRequest: (teamId: number, requestId: number) =>
      fetchApi(`/teams/${teamId}/join-requests/${requestId}/approve`, { method: "POST" }),
    rejectJoinRequest: (teamId: number, requestId: number) =>
      fetchApi(`/teams/${teamId}/join-requests/${requestId}/reject`, { method: "POST" }),
    invite: (teamId: number, userIds: number[]) =>
      fetchApi(`/teams/${teamId}/invite`, { method: "POST", body: JSON.stringify({ userIds }) }),
    getMyInvites: () =>
      fetchApi<{ invites: ApiTeamInvite[] }>("/teams/invites/my"),
    acceptInvite: (inviteId: number) =>
      fetchApi(`/teams/invites/${inviteId}/accept`, { method: "POST" }),
    declineInvite: (inviteId: number) =>
      fetchApi(`/teams/invites/${inviteId}/decline`, { method: "POST" }),
    promoteMember: (teamId: number, memberId: number) =>
      fetchApi(`/teams/${teamId}/members/${memberId}/promote`, { method: "POST" }),
    removeMember: (teamId: number, memberId: number) =>
      fetchApi(`/teams/${teamId}/members/${memberId}`, { method: "DELETE" }),
  },
};

export interface ApiTeam {
  id: number;
  name: string;
  description: string | null;
  privacy: "public" | "private";
  creatorId: number;
  memberCount: number;
  isMember: boolean;
  role: "admin" | "member" | null;
  createdAt: string;
}

export interface ApiTeamDetail extends ApiTeam {
  members: {
    id: number;
    username: string;
    name: string;
    role: "admin" | "member";
    joinedAt: string;
  }[];
}

export interface ApiJoinRequest {
  id: number;
  userId: number;
  username: string;
  name: string;
  createdAt: string;
}

export interface ApiTeamInvite {
  id: number;
  teamId: number;
  teamName: string;
  teamDescription: string | null;
  teamPrivacy: "public" | "private";
  invitedBy: number;
  createdAt: string;
}
