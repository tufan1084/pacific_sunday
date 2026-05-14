import { API_BASE_URL } from "@/app/lib/constants";
import type { ApiResponse, DashboardData, User } from "@/app/types";
import { cache, CACHE_TTL } from "@/app/services/cache";

// Export cache for manual invalidation if needed
export { cache } from "@/app/services/cache";

async function fetchApi<T>(endpoint: string, options?: RequestInit, cacheKey?: string, cacheTTL?: number): Promise<ApiResponse<T>> {
  // Check cache for GET requests
  if ((!options?.method || options.method === "GET") && cacheKey) {
    const cached = cache.get<ApiResponse<T>>(cacheKey);
    if (cached) {
      return cached;
    }
  }

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
  const isAuthAttempt = endpoint.startsWith("/auth/login") || endpoint.startsWith("/auth/register") || endpoint.startsWith("/auth/google");

  // Auto-logout on 401 ONLY. 401 = "your token is missing/invalid/expired" so a
  // forced re-login is appropriate. 403 = "we know who you are, you can't do
  // THIS specific thing" (e.g. blocked from posting, can't pin someone else's
  // post, can't delete someone else's comment). 403s should bubble back to the
  // caller as a normal error so the UI can show a proper message — kicking
  // the user to /login on every 403 was wrong.
  if (response.status === 401 && !isAuthAttempt) {
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
  
  // Cache successful GET responses
  if ((!options?.method || options.method === "GET") && cacheKey && data.success && cacheTTL) {
    cache.set(cacheKey, data, cacheTTL);
  }
  
  return data as ApiResponse<T>;
}

export const api = {
  health: () => fetchApi("/health"),

  stats: {
    community: () =>
      fetchApi<{ totalUsers: number; postsThisWeek: number; activeOwners: number; nfcScansToday: number }>("/stats/community"),
  },

  bag: {
    // hints (UA-CH high-entropy values) are optional — included when the
    // browser can provide them so the backend can record "SM-S901B" instead
    // of "K" in the scan history.
    check: (
      iykRef: string,
      hints?: { model: string | null; platform: string | null; platformVersion: string | null } | null,
    ) => {
      const params = new URLSearchParams({ iykRef });
      const headers: Record<string, string> = {};
      if (hints?.model) headers["X-Device-Model"] = hints.model;
      if (hints?.platform) headers["X-Device-Platform"] = hints.platform;
      if (hints?.platformVersion) headers["X-Device-Platform-Version"] = hints.platformVersion;
      return fetchApi<BagCheckResponse>(`/bag?${params.toString()}`, { headers });
    },
  },

  // Tenor GIF picker — proxied through the backend so the API key isn't
  // exposed on the client. `pos` is the cursor Tenor returns for the next
  // page; pass it back on subsequent calls to paginate.
  gifs: {
    search: (q: string, pos?: string | null) => {
      const params = new URLSearchParams({ q });
      if (pos) params.set("pos", pos);
      return fetchApi<{ gifs: GifResult[]; next: string | null }>(`/gif/search?${params.toString()}`);
    },
    featured: (pos?: string | null) => {
      const params = new URLSearchParams();
      if (pos) params.set("pos", pos);
      const qs = params.toString();
      return fetchApi<{ gifs: GifResult[]; next: string | null }>(`/gif/featured${qs ? `?${qs}` : ""}`);
    },
  },

  auth: {
    register: (body: { name: string; email: string; mpin: string; bagUid: string; country?: string; deviceFingerprint?: string | null }) =>
      fetchApi("/auth/register", { method: "POST", body: JSON.stringify(body) }),

    googleAuth: (body: { credential: string; bagUid?: string; nfcToken?: string; deviceFingerprint?: string | null }) => {
      cache.clear(); // Clear all cache on Google auth
      return fetchApi("/auth/google", { method: "POST", body: JSON.stringify(body) });
    },

    sendVerificationOtp: (email: string) =>
      fetchApi<{ otp?: string }>("/auth/send-verification-otp", { method: "POST", body: JSON.stringify({ email }) }),

    verifyEmailOtp: (email: string, otp: string) =>
      fetchApi("/auth/verify-email-otp", { method: "POST", body: JSON.stringify({ email, otp }) }),

    login: (body: { email: string; mpin: string; nfcToken?: string; deviceFingerprint?: string | null }) => {
      cache.clear();
      return fetchApi<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) });
    },

    verifyDeviceOtp: (challengeId: number, otp: string) => {
      cache.clear();
      return fetchApi("/auth/verify-device-otp", {
        method: "POST",
        body: JSON.stringify({ challengeId, otp }),
      });
    },

    quickLogin: (body: { userId: number; mpin: string; deviceFingerprint: string }) => {
      cache.clear();
      return fetchApi<{ token: string; user: User } | { requiresNfcTap: boolean }>(
        "/auth/quick-login",
        { method: "POST", body: JSON.stringify(body) },
      );
    },

    listDevices: () => fetchApi<{ devices: TrustedDevice[] }>("/auth/devices"),

    revokeDevice: (deviceId: number) =>
      fetchApi(`/auth/devices/${deviceId}`, { method: "DELETE" }),

    me: () => fetchApi<{ user: User }>("/auth/me", undefined, "auth:me", CACHE_TTL.MEDIUM),

    forgotPassword: (email: string, nfcToken?: string) =>
      fetchApi<{ otp?: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email, nfcToken }),
      }),

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
    get: () => fetchApi<DashboardData>("/dashboard", undefined, "dashboard", CACHE_TTL.MEDIUM),
    getOverview: () => fetchApi<ApiDashboardOverview>("/dashboard/overview", undefined, "dashboard:overview", CACHE_TTL.SHORT),
    dismissAnnouncement: (announcementId: number) => {
      cache.invalidate("dashboard:overview");
      return fetchApi("/dashboard/dismiss-announcement", { method: "POST", body: JSON.stringify({ announcementId }) });
    },
  },

  golf: {
    getTournaments: (year?: number) => {
      const params = year ? `?year=${year}` : '';
      // Don't cache tournament list - needs to reflect real-time status changes
      return fetchApi(`/golf/tournaments${params}`);
    },
    // Single-call endpoint: returns { tournament, tiers, leaderboard }
    getTournamentFantasy: (tournId: string, year?: number) => {
      const params = year ? `?year=${year}` : '';
      return fetchApi(`/golf/tournament/${tournId}/fantasy${params}`, undefined, `golf:tournament:${tournId}:${year || 'current'}:fantasy`, CACHE_TTL.MEDIUM);
    },
    // Picks — authenticated
    getPicks: (tournId: string, year?: number) => {
      const params = year ? `?year=${year}` : '';
      return fetchApi<{
        picks: Record<string, string | null>;
        submittedAt: string;
        lockedAt: string | null;
        pointsAwarded: number | null;
        scoring: { playerScores: Array<{ tier: string; playerId: string; playerName: string; score: string; points: number }>; totalPoints: number } | null;
        pointsCalculatedAt: string | null;
      } | null>(
        `/golf/tournament/${tournId}/picks${params}`,
        undefined,
        `golf:tournament:${tournId}:${year || 'current'}:picks`,
        CACHE_TTL.SHORT
      );
    },
    savePicks: (tournId: string, picks: Record<string, string | null>, year?: number) => {
      const params = year ? `?year=${year}` : '';
      cache.invalidate(`golf:tournament:${tournId}:${year || 'current'}:picks`);
      return fetchApi<{ picks: Record<string, string | null>; submittedAt: string; lockedAt: string | null }>(
        `/golf/tournament/${tournId}/picks${params}`,
        { method: "PUT", body: JSON.stringify({ picks }) }
      );
    },
    lockPicks: (tournId: string, picks: Record<string, string | null>, year?: number) => {
      const params = year ? `?year=${year}` : '';
      cache.invalidate(`golf:tournament:${tournId}:${year || 'current'}:picks`);
      return fetchApi<{ picks: Record<string, string | null>; submittedAt: string; lockedAt: string }>(
        `/golf/tournament/${tournId}/picks/lock${params}`,
        { method: "POST", body: JSON.stringify({ picks }) }
      );
    },
  },

  profile: {
    get: () => fetchApi("/profile", undefined, "profile", CACHE_TTL.MEDIUM),
    getBags: () => fetchApi("/profile/bags", undefined, "profile:bags", CACHE_TTL.MEDIUM),
    getBagScans: (bagId: number) => fetchApi(`/profile/bags/${bagId}/scans`, undefined, `profile:bags:${bagId}:scans`, CACHE_TTL.SHORT),
    getGolfPassport: () => fetchApi("/profile/golf-passport", undefined, "profile:passport", CACHE_TTL.LONG),
    updateGolfPassport: (data: any) => {
      cache.invalidatePattern("profile");
      // The auth/me payload powers the header avatar + display name. Saving
      // the passport now also mirrors fullName → user_profiles.name on the
      // backend, so we must clear the cached me-response or the header keeps
      // the old name until the 5-min TTL expires.
      cache.invalidate("auth:me");
      // Profile save may unlock the `profile_completed` challenge and credit
      // points — invalidate the challenge + wallet caches so the next read
      // reflects the new state instead of serving the pre-unlock snapshot.
      cache.invalidatePattern("challenges");
      cache.invalidatePattern("points");
      return fetchApi("/profile/golf-passport", { method: "PUT", body: JSON.stringify(data) });
    },
    updatePrivacy: (isPrivate: boolean) => {
      cache.invalidatePattern("profile");
      return fetchApi<{ isPrivate: boolean }>("/profile/privacy", { method: "PATCH", body: JSON.stringify({ isPrivate }) });
    },
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
      cache.invalidatePattern("profile");
      return await response.json();
    },
  },

  posts: {
    getAll: (limit?: number, offset?: number, teamId?: number, tag?: string) => {
      const params = new URLSearchParams();
      if (limit) params.set('limit', limit.toString());
      if (offset) params.set('offset', offset.toString());
      if (teamId) params.set('teamId', teamId.toString());
      if (tag) params.set('tag', tag);
      return fetchApi(`/posts?${params.toString()}`);
    },
    getUserPosts: (userId: number, limit?: number, offset?: number) => {
      const params = new URLSearchParams();
      params.set('authorId', userId.toString());
      if (limit) params.set('limit', limit.toString());
      if (offset) params.set('offset', offset.toString());
      return fetchApi<{ posts: ApiPost[] }>(`/posts?${params.toString()}`);
    },
    getById: (postId: number) => fetchApi(`/posts/${postId}`),
    getPublic: (postId: number) => fetchApi(`/posts/${postId}/public`),
    create: (data: { content: string; postType?: string; mediaUrls?: string[]; teamId?: number; tags?: string[] }) =>
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
    addComment: (postId: number, content: string, parentId?: number, mediaUrl?: string) =>
      fetchApi(`/posts/${postId}/comments`, { method: "POST", body: JSON.stringify({ content, parentId, mediaUrl }) }),
    editComment: (commentId: number, content: string) =>
      fetchApi<{ comment: any }>(`/posts/comments/${commentId}`, {
        method: "PATCH",
        body: JSON.stringify({ content }),
      }),
    deleteComment: (commentId: number) =>
      fetchApi<{ commentId: number; postId: number; commentCount: number }>(
        `/posts/comments/${commentId}`,
        { method: "DELETE" },
      ),
    getComments: (postId: number) => fetchApi(`/posts/${postId}/comments`),
    togglePin: (postId: number) =>
      fetchApi<{ isPinned: boolean }>(`/posts/${postId}/pin`, { method: "POST" }),
    edit: (postId: number, content: string, mediaUrls?: string[]) => {
      const body: { content: string; mediaUrls?: string[] } = { content };
      if (mediaUrls !== undefined) {
        body.mediaUrls = mediaUrls;
      }
      return fetchApi<{ post: any }>(`/posts/${postId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    delete: (postId: number) =>
      fetchApi(`/posts/${postId}`, { method: "DELETE" }),
    share: (postId: number) =>
      fetchApi<{ postId: number; shareCount: number }>(`/posts/${postId}/share`, { method: "POST" }),
    reshare: (postId: number, comment?: string, teamId?: number) =>
      fetchApi<{ post: any }>(`/posts/${postId}/reshare`, {
        method: "POST",
        body: JSON.stringify({ comment, teamId }),
      }),
    report: (postId: number, reason: string, details?: string) =>
      fetchApi(`/posts/${postId}/report`, { method: "POST", body: JSON.stringify({ reason, details }) }),
    hide: (postId: number) =>
      fetchApi(`/posts/${postId}/hide`, { method: "POST" }),
    unhide: (postId: number) =>
      fetchApi(`/posts/${postId}/hide`, { method: "DELETE" }),
    save: (postId: number, categoryId: number | null) =>
      fetchApi<{ savedPost: { id: number; postId: number; categoryId: number | null; createdAt: string } }>(
        `/posts/${postId}/save`,
        { method: "POST", body: JSON.stringify({ categoryId }) },
      ),
    unsave: (postId: number) =>
      fetchApi(`/posts/${postId}/save`, { method: "DELETE" }),
    listSaved: (categoryId?: number | "uncategorized") =>
      fetchApi<{ savedPosts: ApiSavedPost[] }>(
        `/posts/saved${categoryId !== undefined ? `?categoryId=${categoryId}` : ""}`,
      ),
  },

  savedCategories: {
    list: () =>
      fetchApi<{ categories: ApiSavedCategory[]; uncategorizedCount: number }>("/saved-categories"),
    create: (name: string) =>
      fetchApi<{ category: ApiSavedCategory }>("/saved-categories", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    update: (id: number, data: { name?: string; sortOrder?: number }) =>
      fetchApi<{ category: ApiSavedCategory }>(`/saved-categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      fetchApi(`/saved-categories/${id}`, { method: "DELETE" }),
  },

  teams: {
    list: () => fetchApi<{ teams: ApiTeam[] }>("/teams", undefined, "teams:list", CACHE_TTL.MEDIUM),
    get: (teamId: number) => fetchApi<{ team: ApiTeamDetail }>(`/teams/${teamId}`, undefined, `teams:${teamId}`, CACHE_TTL.SHORT),
    create: (data: { name: string; description?: string; imageUrl?: string | null; privacy: "public" | "private"; memberIds?: number[] }) => {
      cache.invalidate("teams:list");
      return fetchApi<{ team: ApiTeam }>("/teams", { method: "POST", body: JSON.stringify(data) });
    },
    update: (teamId: number, data: { name?: string; description?: string; imageUrl?: string | null; privacy?: "public" | "private" }) => {
      cache.invalidate(`teams:${teamId}`);
      cache.invalidate("teams:list");
      return fetchApi<{ team: ApiTeam }>(`/teams/${teamId}`, { method: "PUT", body: JSON.stringify(data) });
    },
    uploadImage: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);

      const token = typeof window !== "undefined" ? localStorage.getItem("ps_token") : null;
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/teams/upload-image`, {
        method: "POST",
        headers,
        body: formData,
      });
      return (await response.json()) as { success: boolean; data?: { imageUrl: string }; message?: string };
    },
    delete: (teamId: number) => {
      cache.invalidate(`teams:${teamId}`);
      cache.invalidate("teams:list");
      return fetchApi(`/teams/${teamId}`, { method: "DELETE" });
    },
    join: (teamId: number) => {
      cache.invalidate(`teams:${teamId}`);
      cache.invalidate("teams:list");
      return fetchApi<{ teamId: number; memberCount: number; isMember: boolean }>(
        `/teams/${teamId}/join`, { method: "POST" }
      );
    },
    leave: (teamId: number) => {
      cache.invalidate(`teams:${teamId}`);
      cache.invalidate("teams:list");
      return fetchApi<{ teamId: number; memberCount: number; isMember: boolean }>(
        `/teams/${teamId}/leave`, { method: "POST" }
      );
    },
    searchUsers: (q: string) =>
      fetchApi<{ users: { id: number; username: string; name: string }[] }>(
        `/teams/users/search?q=${encodeURIComponent(q)}`
      ),
    getJoinRequests: (teamId: number) =>
      fetchApi<{ requests: ApiJoinRequest[] }>(`/teams/${teamId}/join-requests`, undefined, `teams:${teamId}:requests`, CACHE_TTL.SHORT),
    approveJoinRequest: (teamId: number, requestId: number) => {
      cache.invalidate(`teams:${teamId}:requests`);
      cache.invalidate(`teams:${teamId}`);
      return fetchApi(`/teams/${teamId}/join-requests/${requestId}/approve`, { method: "POST" });
    },
    rejectJoinRequest: (teamId: number, requestId: number) => {
      cache.invalidate(`teams:${teamId}:requests`);
      return fetchApi(`/teams/${teamId}/join-requests/${requestId}/reject`, { method: "POST" });
    },
    invite: (teamId: number, userIds: number[]) =>
      fetchApi(`/teams/${teamId}/invite`, { method: "POST", body: JSON.stringify({ userIds }) }),
    getMyInvites: () =>
      fetchApi<{ invites: ApiTeamInvite[] }>("/teams/invites/my", undefined, "teams:invites:my", CACHE_TTL.SHORT),
    acceptInvite: (inviteId: number) => {
      cache.invalidate("teams:invites:my");
      cache.invalidate("teams:list");
      return fetchApi(`/teams/invites/${inviteId}/accept`, { method: "POST" });
    },
    declineInvite: (inviteId: number) => {
      cache.invalidate("teams:invites:my");
      return fetchApi(`/teams/invites/${inviteId}/decline`, { method: "POST" });
    },
    promoteMember: (teamId: number, memberId: number) => {
      cache.invalidate(`teams:${teamId}`);
      return fetchApi(`/teams/${teamId}/members/${memberId}/promote`, { method: "POST" });
    },
    removeMember: (teamId: number, memberId: number) => {
      cache.invalidate(`teams:${teamId}`);
      return fetchApi(`/teams/${teamId}/members/${memberId}`, { method: "DELETE" });
    },
  },

  notifications: {
    list: (cursor?: number, limit?: number) => {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor.toString());
      if (limit) params.set("limit", limit.toString());
      const qs = params.toString();
      return fetchApi<{
        notifications: ApiNotification[];
        nextCursor: number | null;
        unreadCount: number;
      }>(`/notifications${qs ? `?${qs}` : ""}`);
    },
    getUnreadCount: () => fetchApi<{ count: number }>("/notifications/unread-count"),
    markRead: (id: number) =>
      fetchApi(`/notifications/${id}/read`, { method: "POST" }),
    markAllRead: () =>
      fetchApi("/notifications/read-all", { method: "POST" }),
    delete: (id: number) =>
      fetchApi(`/notifications/${id}`, { method: "DELETE" }),
  },

  follows: {
    follow: (userId: number) =>
      fetchApi<{ isFollowing: boolean; requestSent: boolean }>(`/users/${userId}/follow`, { method: "POST" }),
    unfollow: (userId: number) =>
      fetchApi<{ isFollowing: boolean; requestSent: boolean }>(`/users/${userId}/follow`, { method: "DELETE" }),
    getFollowers: (userId: number) =>
      fetchApi<{ users: { id: number; username: string; name: string }[] }>(
        `/users/${userId}/followers`
      ),
    getFollowing: (userId: number) =>
      fetchApi<{ users: { id: number; username: string; name: string }[] }>(
        `/users/${userId}/following`
      ),
    getUserProfile: (userId: number) =>
      fetchApi<{ user: ApiUserProfile }>(`/users/${userId}`),
    getFollowRequests: () =>
      fetchApi<{ requests: ApiFollowRequest[] }>("/users/follow-requests"),
    acceptFollowRequest: (requestId: number) =>
      fetchApi("/users/follow-requests/" + requestId + "/accept", { method: "POST" }),
    rejectFollowRequest: (requestId: number) =>
      fetchApi("/users/follow-requests/" + requestId + "/reject", { method: "POST" }),
    removeFollower: (userId: number) =>
      fetchApi(`/users/${userId}/follower`, { method: "DELETE" }),
  },

  tags: {
    list: () =>
      fetchApi<{ tags: { id: number; slug: string; label: string; description: string | null }[] }>(
        "/tags"
      ),
  },

  search: {
    all: (q: string) =>
      fetchApi<{ users: ApiSearchUser[]; teams: ApiTeam[] }>(
        `/search?q=${encodeURIComponent(q)}`
      ),
    users: (q: string) =>
      fetchApi<{ users: ApiSearchUser[]; teams: ApiTeam[] }>(
        `/search?type=users&q=${encodeURIComponent(q)}`
      ),
    teams: (q: string) =>
      fetchApi<{ users: ApiSearchUser[]; teams: ApiTeam[] }>(
        `/search?type=teams&q=${encodeURIComponent(q)}`
      ),
  },

  // Points system
  points: {
    getRanges: () =>
      fetchApi<{ ranges: ApiPointsRange[] }>("/points/ranges", undefined, "points:ranges", CACHE_TTL.VERY_LONG),
    createRange: (data: { name: string; minScore: number; maxScore: number; points: number; sortOrder?: number }) => {
      cache.invalidate("points:ranges");
      return fetchApi<{ range: ApiPointsRange }>("/points/ranges", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    updateRange: (
      id: number,
      data: Partial<{ name: string; minScore: number; maxScore: number; points: number; isActive: boolean; sortOrder: number }>
    ) => {
      cache.invalidate("points:ranges");
      return fetchApi<{ range: ApiPointsRange }>(`/points/ranges/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    deleteRange: (id: number) => {
      cache.invalidate("points:ranges");
      return fetchApi(`/points/ranges/${id}`, { method: "DELETE" });
    },
    calculateTournamentPoints: (tournId: string, year?: number) => {
      cache.invalidatePattern("points");
      cache.invalidatePattern("leaderboard");
      return fetchApi(`/points/calculate/${tournId}${year ? `?year=${year}` : ""}`, {
        method: "POST",
      });
    },
    getWallet: () =>
      fetchApi<{ wallet: ApiPointsWallet }>("/points/wallet", undefined, "points:wallet", CACHE_TTL.SHORT),
    getRank: () =>
      fetchApi<{ rank: number | null; total: number; balance: number }>("/points/rank", undefined, "points:rank", CACHE_TTL.SHORT),
    getHistory: (params?: { year?: number; month?: number; type?: string }) => {
      const query = new URLSearchParams();
      if (params?.year) query.set('year', params.year.toString());
      if (params?.month) query.set('month', params.month.toString());
      if (params?.type) query.set('type', params.type);
      const cacheKey = `points:history:${query.toString() || 'all'}`;
      return fetchApi<ApiPointsHistory>(`/points/history${query.toString() ? `?${query.toString()}` : ""}`, undefined, cacheKey, CACHE_TTL.SHORT);
    },
  },

  // Leaderboard
  leaderboard: {
    getAll: () =>
      fetchApi<{
        leaderboard: ApiLeaderboardEntry[];
        totalOwners: number;
        userRank: number | null;
        userPoints: number;
        rank1Points: number;
      }>("/leaderboard", undefined, "leaderboard", CACHE_TTL.SHORT),
  },

  // Achievement Challenges
  challenges: {
    list: () =>
      fetchApi<{ challenges: ApiChallenge[] }>(
        "/challenges",
        undefined,
        "challenges:list",
        CACHE_TTL.MEDIUM,
      ),
    listMine: () =>
      fetchApi<{ challenges: ApiMyChallenge[] }>(
        "/users/my-challenges",
        undefined,
        "challenges:mine",
        CACHE_TTL.SHORT,
      ),
  },

  // Announcements
  announcements: {
    getActive: () =>
      fetchApi<{ announcement: ApiAnnouncement | null }>(
        "/announcements/active",
        undefined,
        "announcements:active",
        CACHE_TTL.MEDIUM,
      ),
    adminList: () =>
      fetchApi<{ announcements: ApiAnnouncement[] }>("/admin/announcements"),
    adminCreate: (data: { title: string; message: string; type?: string; audience?: string; status?: string; scheduledAt?: string | null; ctaText?: string; ctaHref?: string }) =>
      fetchApi<{ announcement: ApiAnnouncement }>("/admin/announcements", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    adminUpdate: (id: number, data: Partial<{ title: string; message: string; type: string; audience: string; status: string; scheduledAt: string | null; ctaText: string; ctaHref: string }>) =>
      fetchApi<{ announcement: ApiAnnouncement }>(`/admin/announcements/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    adminDelete: (id: number) =>
      fetchApi(`/admin/announcements/${id}`, { method: "DELETE" }),
  },

  // ─── Head-to-Head ─────────────────────────────────────────────────────────
  h2h: {
    getStats: () =>
      fetchApi<{ wins: number; losses: number; ties: number; activeCount: number; bonus: number }>(
        "/h2h/stats"
      ),
    listChallenges: (role?: "incoming" | "outgoing" | "active" | "past" | "all") => {
      const qs = role && role !== "all" ? `?role=${role}` : "";
      return fetchApi<{ challenges: ApiH2HChallenge[] }>(`/h2h/challenges${qs}`);
    },
    getChallenge: (id: number) =>
      fetchApi<{ challenge: ApiH2HChallenge }>(`/h2h/challenges/${id}`),
    createChallenge: (body: { opponentId: number; tournamentId: number; wager: number; trashTalk?: string }) => {
      cache.invalidatePattern("points:wallet");
      return fetchApi<{ challenge: ApiH2HChallenge }>("/h2h/challenges", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    accept: (id: number) => {
      cache.invalidatePattern("points:wallet");
      return fetchApi<{ challenge: ApiH2HChallenge }>(`/h2h/challenges/${id}/accept`, { method: "POST" });
    },
    decline: (id: number) =>
      fetchApi<{ challenge: ApiH2HChallenge }>(`/h2h/challenges/${id}/decline`, { method: "POST" }),
    cancel: (id: number) => {
      cache.invalidatePattern("points:wallet");
      return fetchApi<{ challenge: ApiH2HChallenge }>(`/h2h/challenges/${id}/cancel`, { method: "POST" });
    },
    savePicks: (id: number, playerIds: string[]) =>
      fetchApi<{ pick: ApiH2HPick; challengeStatus: string }>(
        `/h2h/challenges/${id}/picks`,
        { method: "PUT", body: JSON.stringify({ playerIds }) },
      ),
    lockPicks: (id: number, playerIds: string[]) =>
      fetchApi<{ pick: ApiH2HPick; challengeStatus: string; bothLocked: boolean }>(
        `/h2h/challenges/${id}/picks/lock`,
        { method: "POST", body: JSON.stringify({ playerIds }) },
      ),
    getField: (id: number) =>
      fetchApi<{ players: ApiH2HFieldPlayer[] }>(`/h2h/challenges/${id}/field`),
  },
};

export interface ApiTeam {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  privacy: "public" | "private";
  creatorId: number;
  memberCount: number;
  isMember: boolean;
  role: "admin" | "member" | null;
  createdAt: string;
}

export interface ApiTeamDetail extends ApiTeam {
  isPreview?: boolean;
  hasPendingRequest?: boolean;
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

export type ApiChallengeTrigger =
  | "bag_registered"
  | "profile_completed"
  | "h2h_won"
  | "reward_redeemed"
  | "nfc_tap_5x_month"
  | "referral";

export interface ApiChallenge {
  id: number;
  triggerType: ApiChallengeTrigger;
  title: string;
  description: string;
  points: number;
  isActive: boolean;
}

export interface ApiMyChallenge {
  id: number;
  triggerType: ApiChallengeTrigger;
  title: string;
  description: string;
  points: number;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
}

export interface ApiPointsRange {
  id: number;
  name: string;
  minScore: number;
  maxScore: number;
  points: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiPointsTransaction {
  id: number;
  walletId: number;
  userId: number;
  amount: number;
  type: string;
  description: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export interface ApiPointsWallet {
  id: number;
  userId: number;
  balance: number;
  heldBalance: number;
  createdAt: string;
  updatedAt: string;
  transactions: ApiPointsTransaction[];
}

export type NotificationType =
  | "POST_LIKED"
  | "POST_COMMENTED"
  | "COMMENT_REPLIED"
  | "USER_FOLLOWED"
  | "FOLLOW_REQUEST_RECEIVED"
  | "FOLLOW_REQUEST_ACCEPTED"
  | "TEAM_INVITED"
  | "TEAM_JOIN_REQUEST"
  | "TEAM_JOIN_APPROVED"
  | "TEAM_JOIN_REJECTED"
  | "TEAM_ROLE_CHANGED"
  | "TEAM_REMOVED"
  | "TEAM_POST_CREATED"
  | "POST_RESHARED"
  | "H2H_CHALLENGE_RECEIVED"
  | "H2H_CHALLENGE_ACCEPTED"
  | "H2H_CHALLENGE_DECLINED"
  | "H2H_CHALLENGE_CANCELLED"
  | "H2H_CHALLENGE_OPPONENT_LOCKED"
  | "H2H_CHALLENGE_FIELD_AVAILABLE"
  | "H2H_CHALLENGE_RESULT"
  | "CHALLENGE_UNLOCKED"
  | "FANTASY_TOURNAMENT_LIVE";

export interface ApiNotification {
  id: number;
  type: NotificationType;
  actorId: number | null;
  actor: { id: number; username: string; name: string } | null;
  entityType: string | null;
  entityId: number | null;
  teamId: number | null;
  data: Record<string, any> | null;
  read: boolean;
  createdAt: string;
}

export interface ApiSearchUser {
  id: number;
  username: string;
  name: string;
  photoUrl: string | null;
}

export interface ApiUserProfile {
  id: number;
  username: string;
  name: string;
  country: string | null;
  createdAt: string;
  isPrivate: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
  isFollowing: boolean;
  requestSent: boolean;
  canViewPosts: boolean;
  isSelf: boolean;
  photoUrl?: string | null;
  bio?: string | null;
}

export interface ApiFollowRequest {
  id: number;
  senderId: number;
  username: string;
  name: string;
  photoUrl: string | null;
  createdAt: string;
}

export interface ApiSavedCategory {
  id: number;
  name: string;
  sortOrder: number;
  postCount?: number;
  createdAt?: string;
}

export interface ApiSavedPost {
  savedAt: string;
  category: { id: number; name: string } | null;
  post: {
    id: number;
    content: string;
    mediaUrls: unknown;
    shareCount: number;
    createdAt: string;
    user: { id: number; username: string; profile: { name: string; golfPassport?: { photoUrl: string | null } | null } | null };
    _count: { likes: number; comments: number };
    tagSlugs: string[];
    isSavedByMe: boolean;
    myCategoryId: number | null;
  };
}

export interface ApiLeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  name: string;
  country: string | null;
  bagName: string | null;
  points: number;
  weeksRegistered: number;
  streak: number;
  isCurrentUser: boolean;
}

export interface ApiPointsHistory {
  summary: {
    currentBalance: number;
    totalEarned: number;
    totalSpent: number;
  };
  transactions: ApiPointsTransaction[];
}

export interface ApiH2HUser {
  id: number;
  username: string;
  name: string;
  photoUrl: string | null;
}

export interface ApiH2HTournament {
  id: number;
  tournId: string;
  year: number;
  name: string;
  status: "upcoming" | "live" | "completed";
  startDate: string | null;
  endDate: string | null;
  fieldAvailable: boolean;
  isMajor: boolean;
  h2hMultiplier: number | null;
  h2hBonusDescription: string | null;
}

export interface ApiH2HPick {
  userId: number;
  playerIds: string[] | null;
  submittedAt: string | null;
  lockedAt: string | null;
}

export interface ApiH2HScoreBreakdownEntry {
  playerId: string;
  name: string | null;
  score: string | null;
  strokes: number;
  missedCut: boolean;
}

export interface ApiH2HScore {
  total: number;
  breakdown: ApiH2HScoreBreakdownEntry[];
}

export interface ApiH2HChallenge {
  id: number;
  status: "PENDING" | "ACCEPTED" | "LOCKED" | "LIVE" | "COMPLETED" | "DECLINED" | "CANCELLED" | "REFUNDED";
  role: "challenger" | "opponent" | "observer";
  wager: number;
  multiplier: number;
  effectiveWager: number;
  trashTalk: string | null;
  createdAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  cancelledAt: string | null;
  settledAt: string | null;
  challengerStrokes: number | null;
  opponentStrokes: number | null;
  winnerId: number | null;
  challenger: ApiH2HUser | null;
  opponent: ApiH2HUser | null;
  tournament: ApiH2HTournament | null;
  yourPick?: ApiH2HPick | null;
  opponentPick?: ApiH2HPick | null;
  yourScore?: ApiH2HScore;
  opponentScore?: ApiH2HScore;
}

export interface ApiH2HFieldPlayer {
  playerId: string;
  firstName: string;
  lastName: string;
  country: string | null;
  owgrRank: number | null;
  tier: string;
  tierRank: number;
}

export interface ApiPost {
  id: number;
  content: string;
  mediaUrls: any;
  createdAt: string;
  _count: { likes: number; comments: number };
  reshareComment?: string | null;
  author?: {
    id: number;
    username: string;
    name: string;
    photoUrl?: string | null;
  };
  user?: {
    id: number;
    username: string;
    profile: { name: string; golfPassport?: { photoUrl: string | null } | null } | null;
  };
  originalPost?: {
    id: number;
    content: string;
    mediaUrls: any;
    _count: { likes: number; comments: number };
    author?: {
      id: number;
      username: string;
      name: string;
      photoUrl?: string | null;
    };
    user?: {
      id: number;
      username: string;
      profile: { name: string; golfPassport?: { photoUrl: string | null } | null } | null;
    };
  } | null;
}

export interface ApiAnnouncement {
  id: number;
  title: string;
  message: string;
  type: string;
  audience: string;
  status: string;
  scheduledAt: string | null;
  ctaText: string | null;
  ctaHref: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiDashboardOverview {
  user: {
    id: number;
    name: string;
    rank: number | null;
    points: number;
    weeksRegistered: number;
    memberSince: string | null;
  };
  weeklyDelta: {
    points: number;
    rank: number | null;
  };
  achievements: {
    earned: number;
    total: number;
    newThisWeek: number;
  };
  activeTournament: {
    id: number;
    tournId: string;
    year: number;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    isMajor: boolean;
    courseName: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    h2hMultiplier: number | null;
    countdown: string | null;
  } | null;
  picks: Array<{
    tier: string;
    golfer: string | null;
    score: string | null;
    status: string;
  }>;
  picksRemaining: number | null;
  featuredChallenge: {
    id: number;
    triggerType: string;
    title: string;
    description: string;
    points: number;
    progress: number;
    unlocked: boolean;
    unlockedAt: string | null;
  } | null;
  leaderboardTop: Array<{
    rank: number;
    initials: string;
    name: string;
    club: string;
    score: number;
  }>;
  posts: Array<{
    id: number;
    author: string;
    authorPhotoUrl: string | null;
    badge: string;
    isPinned: boolean;
    timeAgo: string;
    content: string;
    likes: number;
    replies: number;
  }>;
  announcement: {
    id: number;
    title: string;
    description: string;
    ctaText: string;
    ctaHref: string;
  } | null;
  weather: {
    location: string;
    tempF: number;
    tempC: number;
    condition: string;
    wind: string;
    playingCondition: string;
  } | null;
}

// ─── Tenor GIF picker types ─────────────────────────────────────────────────

export interface GifResult {
  id: string;
  // Full-quality animated GIF URL. Hand to the upload pipeline.
  url: string;
  // Smaller-dimension URL for the picker grid thumbnails.
  preview: string;
  width: number | null;
  height: number | null;
  title: string;
}

// ─── NFC-gated login + device verification ──────────────────────────────────

export interface BagCheckResponse {
  status: "new_user" | "existing_user";
  bag: {
    uid: string;
    tokenId?: string | null;
    name: string;
    description: string | null;
    imageUrl: string | null;
    collection: string | null;
  };
  // Only present when status === "existing_user". The frontend stashes these
  // in sessionStorage and submits them with /auth/login so the login server
  // can verify the user actually came through an NFC tap.
  nfcToken?: string;
  nfcTokenExpiresAt?: string;
  maskedEmail?: string;
  username?: string | null;
}

export interface LoginResponse {
  token?: string;
  user?: User;
  // When an unknown device tries to log in, the server holds the JWT and
  // returns an OTP challenge instead. The frontend then collects the OTP
  // and calls /auth/verify-device-otp.
  requiresDeviceOtp?: boolean;
  challengeId?: number;
  email?: string;
  otp?: string; // dev fallback when SMTP isn't configured
  deviceLabel?: string;
}

export interface TrustedDevice {
  id: number;
  label: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
}
