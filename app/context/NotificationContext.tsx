"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { io } from "socket.io-client";
import { api, ApiNotification } from "@/app/services/api";
import { SOCKET_URL } from "@/app/lib/constants";
import { useAuth } from "@/app/context/AuthContext";

// Notification types bucketed by sidebar tab
const COMMUNITY_TYPES = new Set([
  "POST_LIKED", "POST_COMMENTED", "COMMENT_REPLIED",
  "POST_RESHARED", "TEAM_POST_CREATED",
  "TEAM_JOIN_REQUEST", "TEAM_JOIN_APPROVED", "TEAM_JOIN_REJECTED",
  "TEAM_INVITED", "TEAM_ROLE_CHANGED", "TEAM_REMOVED",
]);

const H2H_TYPES = new Set([
  "H2H_CHALLENGE_RECEIVED", "H2H_CHALLENGE_ACCEPTED", "H2H_CHALLENGE_DECLINED",
  "H2H_CHALLENGE_CANCELLED", "H2H_CHALLENGE_OPPONENT_LOCKED",
  "H2H_CHALLENGE_FIELD_AVAILABLE", "H2H_CHALLENGE_RESULT",
]);

const FANTASY_TYPES = new Set([
  "FANTASY_TOURNAMENT_LIVE",
]);

const CHALLENGES_TYPES = new Set([
  "CHALLENGE_UNLOCKED",
]);

const PROFILE_TYPES = new Set([
  "USER_FOLLOWED", "FOLLOW_REQUEST_RECEIVED", "FOLLOW_REQUEST_ACCEPTED",
]);

interface NotificationContextType {
  unreadCount: number;
  invitesCount: number;
  h2hIncomingCount: number;
  communityUnreadCount: number;
  h2hUnreadCount: number;
  fantasyUnreadCount: number;
  challengesUnreadCount: number;
  profileUnreadCount: number;
  clearCommunityCount: () => void;
  clearH2HCount: () => void;
  clearFantasyCount: () => void;
  clearChallengesCount: () => void;
  clearProfileCount: () => void;
  refreshUnreadCount: () => Promise<void>;
  refreshSidebarCounts: () => Promise<void>;
  decrementUnreadCount: (amount?: number) => void;
  setUnreadCount: (count: number) => void;
  setInvitesCount: (count: number) => void;
  setH2hIncomingCount: (count: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [invitesCount, setInvitesCount] = useState(0);
  const [h2hIncomingCount, setH2hIncomingCount] = useState(0);
  const [communityUnreadCount, setCommunityUnreadCount] = useState(0);
  const [h2hUnreadCount, setH2hUnreadCount] = useState(0);
  const [fantasyUnreadCount, setFantasyUnreadCount] = useState(0);
  const [challengesUnreadCount, setChallengesUnreadCount] = useState(0);
  const [profileUnreadCount, setProfileUnreadCount] = useState(0);
  const { user } = useAuth();

  const clearCommunityCount = useCallback(() => setCommunityUnreadCount(0), []);
  const clearH2HCount = useCallback(() => setH2hUnreadCount(0), []);
  const clearFantasyCount = useCallback(() => setFantasyUnreadCount(0), []);
  const clearChallengesCount = useCallback(() => setChallengesUnreadCount(0), []);
  const clearProfileCount = useCallback(() => setProfileUnreadCount(0), []);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await api.notifications.getUnreadCount();
      if (res.success) setUnreadCount((res.data as any)?.count ?? 0);
    } catch { /* ignore */ }
  }, []);

  const refreshSidebarCounts = useCallback(async () => {
    try {
      const [invRes, h2hRes, notifRes] = await Promise.all([
        api.teams.getMyInvites(),
        api.h2h.listChallenges("incoming"),
        api.notifications.list(undefined, 50),
      ]);
      if (invRes.success)
        setInvitesCount(((invRes.data as any)?.invites || []).length);
      if (h2hRes.success)
        setH2hIncomingCount(((h2hRes.data as any)?.challenges || []).length);
      if (notifRes.success) {
        const unread = ((notifRes.data as any)?.notifications || [] as ApiNotification[])
          .filter((n: ApiNotification) => !n.read);
        setCommunityUnreadCount(unread.filter((n: ApiNotification) => COMMUNITY_TYPES.has(n.type)).length);
        setH2hUnreadCount(unread.filter((n: ApiNotification) => H2H_TYPES.has(n.type)).length);
        setFantasyUnreadCount(unread.filter((n: ApiNotification) => FANTASY_TYPES.has(n.type)).length);
        setChallengesUnreadCount(unread.filter((n: ApiNotification) => CHALLENGES_TYPES.has(n.type)).length);
        setProfileUnreadCount(unread.filter((n: ApiNotification) => PROFILE_TYPES.has(n.type)).length);
      }
    } catch { /* ignore */ }
  }, []);

  const decrementUnreadCount = useCallback((amount: number = 1) => {
    setUnreadCount(prev => Math.max(0, prev - amount));
  }, []);

  useEffect(() => {
    if (!user) return;
    refreshUnreadCount();
    refreshSidebarCounts();
  }, [user?.id, refreshUnreadCount, refreshSidebarCounts]);

  useEffect(() => {
    if (!user) return;

    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });

    socket.on("connect", () => {
      socket.emit("user:identify", { userId: user.id });
    });

    socket.on("notification:new", (n: ApiNotification) => {
      setUnreadCount(prev => prev + 1);
      if (COMMUNITY_TYPES.has(n.type))   setCommunityUnreadCount(prev => prev + 1);
      if (H2H_TYPES.has(n.type))         setH2hUnreadCount(prev => prev + 1);
      if (FANTASY_TYPES.has(n.type))     setFantasyUnreadCount(prev => prev + 1);
      if (CHALLENGES_TYPES.has(n.type))  setChallengesUnreadCount(prev => prev + 1);
      if (PROFILE_TYPES.has(n.type))     setProfileUnreadCount(prev => prev + 1);
      if (n.type === "H2H_CHALLENGE_RECEIVED") setH2hIncomingCount(prev => prev + 1);
      if (n.type === "TEAM_INVITED")           setInvitesCount(prev => prev + 1);
    });

    socket.on("h2h:challengeUpdated", () => {
      api.h2h.listChallenges("incoming").then(res => {
        if (res.success) setH2hIncomingCount(((res.data as any)?.challenges || []).length);
      });
    });

    socket.on("team:invite", (data: { userId: number; action: string }) => {
      if (data.userId === user.id) {
        api.teams.getMyInvites().then(res => {
          if (res.success) setInvitesCount(((res.data as any)?.invites || []).length);
        });
      }
    });

    return () => { socket.disconnect(); };
  }, [user?.id]);

  return (
    <NotificationContext.Provider value={{
      unreadCount, invitesCount, h2hIncomingCount,
      communityUnreadCount, h2hUnreadCount, fantasyUnreadCount, challengesUnreadCount, profileUnreadCount,
      clearCommunityCount, clearH2HCount, clearFantasyCount, clearChallengesCount, clearProfileCount,
      refreshUnreadCount, refreshSidebarCounts,
      decrementUnreadCount, setUnreadCount, setInvitesCount, setH2hIncomingCount,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within NotificationProvider");
  return context;
}
