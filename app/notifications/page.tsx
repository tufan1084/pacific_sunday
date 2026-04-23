"use client";

import type { ReactElement } from "react";
import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { FiHeart, FiMessageCircle, FiUserPlus, FiUsers, FiCheck, FiX, FiArrowUp, FiUserMinus, FiCornerDownRight } from "react-icons/fi";
import { api, ApiNotification, NotificationType } from "@/app/services/api";
import { SOCKET_URL } from "@/app/lib/constants";

const ICON_FOR: Record<NotificationType, { icon: ReactElement; color: string }> = {
  POST_LIKED:         { icon: <FiHeart size={18} />,         color: "#F87171" },
  POST_COMMENTED:     { icon: <FiMessageCircle size={18} />, color: "#60A5FA" },
  COMMENT_REPLIED:    { icon: <FiCornerDownRight size={18} />, color: "#60A5FA" },
  USER_FOLLOWED:      { icon: <FiUserPlus size={18} />,      color: "#34D399" },
  TEAM_INVITED:       { icon: <FiUsers size={18} />,         color: "#E8C96A" },
  TEAM_JOIN_REQUEST:  { icon: <FiUserPlus size={18} />,      color: "#E8C96A" },
  TEAM_JOIN_APPROVED: { icon: <FiCheck size={18} />,         color: "#34D399" },
  TEAM_JOIN_REJECTED: { icon: <FiX size={18} />,             color: "#F87171" },
  TEAM_ROLE_CHANGED:  { icon: <FiArrowUp size={18} />,       color: "#E8C96A" },
  TEAM_REMOVED:       { icon: <FiUserMinus size={18} />,     color: "#F87171" },
};

function describe(n: ApiNotification): string {
  const actor = n.actor?.name || "Someone";
  const team = (n.data as any)?.teamName || "a team";
  const preview = (n.data as any)?.preview;
  switch (n.type) {
    case "POST_LIKED":         return `${actor} liked your post${preview ? `: “${preview}”` : ""}`;
    case "POST_COMMENTED":     return `${actor} commented on your post${preview ? `: “${preview}”` : ""}`;
    case "COMMENT_REPLIED":    return `${actor} replied to your comment${preview ? `: “${preview}”` : ""}`;
    case "USER_FOLLOWED":      return `${actor} started following you`;
    case "TEAM_INVITED":       return `${actor} invited you to ${team}`;
    case "TEAM_JOIN_REQUEST":  return `${actor} requested to join ${team}`;
    case "TEAM_JOIN_APPROVED": return `Your request to join ${team} was approved`;
    case "TEAM_JOIN_REJECTED": return `Your request to join ${team} was declined`;
    case "TEAM_ROLE_CHANGED":  return `You were promoted to ${(n.data as any)?.newRole || "admin"} in ${team}`;
    case "TEAM_REMOVED":       return `You were removed from ${team}`;
    default:                   return "New notification";
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationsPage() {
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const currentUserId = typeof window !== "undefined"
    ? parseInt(localStorage.getItem("ps_user_id") || "0") : 0;

  const load = useCallback(async (nextCursor?: number) => {
    if (nextCursor) setLoadingMore(true); else setLoading(true);
    try {
      const res = await api.notifications.list(nextCursor, 20);
      if (res.success) {
        const data = res.data as any;
        setItems(prev => nextCursor ? [...prev, ...(data?.notifications || [])] : (data?.notifications || []));
        setCursor(data?.nextCursor ?? null);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load();
    api.notifications.markAllRead();
  }, [load]);

  useEffect(() => {
    if (!currentUserId) return;
    const socket: Socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socket.on("connect", () => socket.emit("user:identify", { userId: currentUserId }));
    socket.on("notification:new", (n: ApiNotification) => {
      setItems(prev => [n, ...prev]);
    });
    return () => { socket.disconnect(); };
  }, [currentUserId]);

  return (
    <>
      <div style={{ fontFamily: "var(--font-poppins), sans-serif", marginBottom: "30px" }}>
        <span style={{ color: "#E8C96A", fontSize: "clamp(18px, 2.5vw, 25px)", fontWeight: 400 }}>Notifications</span>
      </div>

      {loading && (
        <div style={{ color: "#888", textAlign: "center", padding: "40px", fontFamily: "var(--font-poppins), sans-serif" }}>
          Loading notifications…
        </div>
      )}

      {!loading && items.length === 0 && (
        <div style={{ backgroundColor: "#13192A", borderRadius: "5px", padding: "40px 20px", textAlign: "center", color: "#888", fontFamily: "var(--font-poppins), sans-serif" }}>
          You're all caught up — no notifications yet.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontFamily: "var(--font-poppins), sans-serif" }}>
        {items.map(n => {
          const meta = ICON_FOR[n.type] || ICON_FOR.POST_LIKED;
          return (
            <div
              key={n.id}
              style={{
                backgroundColor: "#13192A",
                borderRadius: "5px",
                padding: "20px",
                borderLeft: n.read ? "3px solid transparent" : "3px solid #E8C96A",
              }}
            >
              <div className="flex items-start gap-3" style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "50%",
                  backgroundColor: "#060D1F", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: meta.color,
                }}>
                  {meta.icon}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ color: "#FFFFFF", fontSize: "clamp(13px, 1.4vw, 16px)", fontWeight: 400, marginBottom: "6px", lineHeight: 1.5 }}>
                    {describe(n)}
                  </div>
                  <div style={{ color: "#74FF6D", fontSize: "clamp(11px, 1.1vw, 13px)", fontWeight: 400 }}>
                    {timeAgo(n.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {cursor && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            onClick={() => load(cursor)}
            disabled={loadingMore}
            style={{
              backgroundColor: "transparent", color: "#E8C96A",
              border: "1px solid #E8C96A", borderRadius: "5px",
              padding: "10px 24px", fontSize: "13px", fontWeight: 500,
              cursor: loadingMore ? "not-allowed" : "pointer",
              opacity: loadingMore ? 0.6 : 1,
              fontFamily: "var(--font-poppins), sans-serif",
            }}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}
