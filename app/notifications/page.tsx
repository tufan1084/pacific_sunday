"use client";

import type { ReactElement } from "react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { FiHeart, FiMessageCircle, FiUserPlus, FiUsers, FiCheck, FiX, FiArrowUp, FiUserMinus, FiCornerDownRight, FiEdit3, FiAward } from "react-icons/fi";
import { api, ApiNotification, NotificationType } from "@/app/services/api";
import { SOCKET_URL } from "@/app/lib/constants";
import { getNotificationHref } from "@/app/utils/notificationLink";
import { Skeleton, shimmerCss } from "@/app/components/ui/Skeleton";

const ICON_FOR: Record<NotificationType, { icon: ReactElement; color: string }> = {
  POST_LIKED:              { icon: <FiHeart size={14} />,           color: "#F87171" },
  POST_COMMENTED:          { icon: <FiMessageCircle size={14} />,   color: "#60A5FA" },
  COMMENT_REPLIED:         { icon: <FiCornerDownRight size={14} />, color: "#60A5FA" },
  USER_FOLLOWED:           { icon: <FiUserPlus size={14} />,        color: "#34D399" },
  FOLLOW_REQUEST_RECEIVED: { icon: <FiUserPlus size={14} />,        color: "#E8C96A" },
  FOLLOW_REQUEST_ACCEPTED: { icon: <FiCheck size={14} />,           color: "#34D399" },
  TEAM_INVITED:            { icon: <FiUsers size={14} />,           color: "#E8C96A" },
  TEAM_JOIN_REQUEST:       { icon: <FiUserPlus size={14} />,        color: "#E8C96A" },
  TEAM_JOIN_APPROVED:      { icon: <FiCheck size={14} />,           color: "#34D399" },
  TEAM_JOIN_REJECTED:      { icon: <FiX size={14} />,               color: "#F87171" },
  TEAM_ROLE_CHANGED:       { icon: <FiArrowUp size={14} />,         color: "#E8C96A" },
  TEAM_REMOVED:            { icon: <FiUserMinus size={14} />,       color: "#F87171" },
  TEAM_POST_CREATED:       { icon: <FiEdit3 size={14} />,           color: "#E8C96A" },
  POST_RESHARED:           { icon: <FiCornerDownRight size={14} />, color: "#34D399" },
  H2H_CHALLENGE_RECEIVED:        { icon: <FiUsers size={14} />,  color: "#E8C96A" },
  H2H_CHALLENGE_ACCEPTED:        { icon: <FiCheck size={14} />,  color: "#34D399" },
  H2H_CHALLENGE_DECLINED:        { icon: <FiX size={14} />,      color: "#F87171" },
  H2H_CHALLENGE_CANCELLED:       { icon: <FiX size={14} />,      color: "#888" },
  H2H_CHALLENGE_OPPONENT_LOCKED: { icon: <FiCheck size={14} />,  color: "#E8C96A" },
  H2H_CHALLENGE_FIELD_AVAILABLE: { icon: <FiUsers size={14} />,  color: "#60A5FA" },
  H2H_CHALLENGE_RESULT:          { icon: <FiAward size={14} />,  color: "#E8C96A" },
  CHALLENGE_UNLOCKED:            { icon: <FiAward size={14} />,  color: "#E8C96A" },
  FANTASY_TOURNAMENT_LIVE:       { icon: <FiAward size={14} />,  color: "#E8C96A" },
};

function describe(n: ApiNotification): string {
  const actor = n.actor?.name || "Someone";
  const team = (n.data as any)?.teamName || "a team";
  const preview = (n.data as any)?.preview;
  const tournamentName = (n.data as any)?.tournamentName;
  switch (n.type) {
    case "POST_LIKED":         return `${actor} liked your post${preview ? `: "${preview}"` : ""}`;
    case "POST_COMMENTED":     return `${actor} commented on your post${preview ? `: "${preview}"` : ""}`;
    case "COMMENT_REPLIED":    return `${actor} replied to your comment${preview ? `: "${preview}"` : ""}`;
    case "USER_FOLLOWED":      return `${actor} started following you`;
    case "FOLLOW_REQUEST_RECEIVED": return `${actor} requested to follow you`;
    case "FOLLOW_REQUEST_ACCEPTED": return `${actor} accepted your follow request`;
    case "TEAM_INVITED":       return `${actor} invited you to ${team}`;
    case "TEAM_JOIN_REQUEST":  return `${actor} requested to join ${team}`;
    case "TEAM_JOIN_APPROVED": return `Your request to join ${team} was approved`;
    case "TEAM_JOIN_REJECTED": return `Your request to join ${team} was declined`;
    case "TEAM_ROLE_CHANGED":  return `You were promoted to ${(n.data as any)?.newRole || "admin"} in ${team}`;
    case "TEAM_REMOVED":       return `You were removed from ${team}`;
    case "TEAM_POST_CREATED":  return `${actor} posted in ${team}${preview ? `: "${preview}"` : ""}`;
    case "POST_RESHARED":      return `${actor} reshared your post${preview ? `: "${preview}"` : ""}`;
    case "CHALLENGE_UNLOCKED": {
      const title = (n.data as any)?.title || "an achievement";
      const pts = (n.data as any)?.points;
      return pts ? `Achievement unlocked: ${title} (+${pts} pts)` : `Achievement unlocked: ${title}`;
    }
    case "FANTASY_TOURNAMENT_LIVE": return `${tournamentName || "A tournament"} is now live — your picks are locked in!`;
    default: return "New notification";
  }
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function NotificationsSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{ background: "#13192A", borderRadius: 5, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <Skeleton h={26} w={26} r={13} />
          <Skeleton h={13} w={`${50 + (i % 3) * 15}%`} />
          <Skeleton h={11} w={40} style={{ marginLeft: "auto" }} />
        </div>
      ))}
    </div>
  );
}

export default function NotificationsPage() {
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();
  const currentUserId = typeof window !== "undefined" ? parseInt(localStorage.getItem("ps_user_id") || "0") : 0;

  const handleDelete = async (id: number) => {
    const snapshot = items;
    setItems(prev => prev.filter(n => n.id !== id));
    try {
      const res = await api.notifications.delete(id);
      if (!res.success) setItems(snapshot);
    } catch { setItems(snapshot); }
  };

  const load = useCallback(async (nextCursor?: number) => {
    if (nextCursor) setLoadingMore(true); else setLoading(true);
    try {
      const res = await api.notifications.list(nextCursor, 20);
      if (res.success) {
        const data = res.data as any;
        setItems(prev => nextCursor ? [...prev, ...(data?.notifications || [])] : (data?.notifications || []));
        setCursor(data?.nextCursor ?? null);
      }
    } finally { setLoading(false); setLoadingMore(false); }
  }, []);

  useEffect(() => { load(); api.notifications.markAllRead(); }, [load]);

  useEffect(() => {
    if (!currentUserId) return;
    const socket: Socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socket.on("connect", () => socket.emit("user:identify", { userId: currentUserId }));
    socket.on("notification:new", (n: ApiNotification) => setItems(prev => [n, ...prev]));
    return () => { socket.disconnect(); };
  }, [currentUserId]);

  return (
    <>
      <style>{shimmerCss}</style>
      <div style={{ fontFamily: "var(--font-poppins), sans-serif", marginBottom: 16 }}>
        <span style={{ color: "#E8C96A", fontSize: "clamp(16px,2vw,22px)", fontWeight: 400 }}>Notifications</span>
      </div>

      {loading && <NotificationsSkeleton />}

      {!loading && items.length === 0 && (
        <div style={{ backgroundColor: "#13192A", borderRadius: 5, padding: "40px 20px", textAlign: "center", color: "#888", fontFamily: "var(--font-poppins), sans-serif" }}>
          You're all caught up — no notifications yet.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: "var(--font-poppins), sans-serif" }}>
        {items.map(n => {
          const meta = ICON_FOR[n.type] || ICON_FOR.POST_LIKED;
          const href = getNotificationHref(n);
          return (
            <div key={n.id} onClick={() => { if (href) router.push(href); }}
              role={href ? "link" : undefined} tabIndex={href ? 0 : undefined}
              onKeyDown={e => { if (href && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); router.push(href); } }}
              style={{ backgroundColor: "#13192A", borderRadius: 5, padding: "10px 12px", borderLeft: n.read ? "3px solid transparent" : "3px solid #E8C96A", cursor: href ? "pointer" : "default" }}
            >
              <div className="flex items-center" style={{ flex: 1, minWidth: 0, gap: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", backgroundColor: "#060D1F", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: meta.color }}>{meta.icon}</div>
                <div style={{ color: "#FFFFFF", fontSize: "clamp(12px,1.2vw,13.5px)", fontWeight: 400, lineHeight: 1.4, flex: 1, minWidth: 0, wordBreak: "break-word" }}>{describe(n)}</div>
                <div style={{ color: "#74FF6D", fontSize: "clamp(10px,1vw,11.5px)", fontWeight: 400, flexShrink: 0, whiteSpace: "nowrap" }}>{timeAgo(n.createdAt)}</div>
                <button type="button" onClick={e => { e.stopPropagation(); handleDelete(n.id); }}
                  style={{ background: "none", border: "none", padding: 2, color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0, borderRadius: 4 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#F87171"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)"; }}
                ><FiX size={14} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {cursor && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button onClick={() => load(cursor)} disabled={loadingMore}
            style={{ backgroundColor: "transparent", color: "#E8C96A", border: "1px solid #E8C96A", borderRadius: 5, padding: "10px 24px", fontSize: 13, fontWeight: 500, cursor: loadingMore ? "not-allowed" : "pointer", opacity: loadingMore ? 0.6 : 1, fontFamily: "var(--font-poppins), sans-serif" }}
          >{loadingMore ? "Loading…" : "Load more"}</button>
        </div>
      )}
    </>
  );
}
