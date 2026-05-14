"use client";

import type { ReactElement } from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { FiHeart, FiMessageCircle, FiUserPlus, FiUsers, FiCheck, FiX, FiArrowUp, FiUserMinus, FiCornerDownRight, FiEdit3, FiAward } from "react-icons/fi";
import { NotificationIcon } from "@/app/components/ui/Icons";
import { api, ApiNotification, NotificationType, ApiTeamInvite } from "@/app/services/api";
import { SOCKET_URL } from "@/app/lib/constants";
import { useToast } from "@/app/context/ToastContext";
import { useNotifications } from "@/app/context/NotificationContext";
import { useAuth } from "@/app/context/AuthContext";
import { getNotificationHref } from "@/app/utils/notificationLink";

const ICON_FOR: Record<NotificationType, { icon: ReactElement; color: string }> = {
  POST_LIKED:              { icon: <FiHeart size={14} />,           color: "#F87171" },
  POST_COMMENTED:          { icon: <FiMessageCircle size={14} />,   color: "#60A5FA" },
  COMMENT_REPLIED:         { icon: <FiCornerDownRight size={14} />, color: "#60A5FA" },
  USER_FOLLOWED:           { icon: <FiUserPlus size={14} />,        color: "#34D399" },
  FOLLOW_REQUEST_RECEIVED: { icon: <FiUserPlus size={14} />,        color: "#E8C96A" },
  FOLLOW_REQUEST_ACCEPTED: { icon: <FiCheck size={14} />,           color: "#34D399" },
  TEAM_INVITED:            { icon: <FiUsers size={14} />,           color: "#E8C96A" },
  TEAM_JOIN_REQUEST:  { icon: <FiUserPlus size={14} />,     color: "#E8C96A" },
  TEAM_JOIN_APPROVED: { icon: <FiCheck size={14} />,        color: "#34D399" },
  TEAM_JOIN_REJECTED: { icon: <FiX size={14} />,            color: "#F87171" },
  TEAM_ROLE_CHANGED:  { icon: <FiArrowUp size={14} />,      color: "#E8C96A" },
  TEAM_REMOVED:       { icon: <FiUserMinus size={14} />,    color: "#F87171" },
  TEAM_POST_CREATED:  { icon: <FiEdit3 size={14} />,        color: "#E8C96A" },
  POST_RESHARED:      { icon: <FiCornerDownRight size={14} />, color: "#34D399" },
  H2H_CHALLENGE_RECEIVED:      { icon: <FiUsers size={14} />,  color: "#E8C96A" },
  H2H_CHALLENGE_ACCEPTED:      { icon: <FiCheck size={14} />,  color: "#34D399" },
  H2H_CHALLENGE_DECLINED:      { icon: <FiX size={14} />,      color: "#F87171" },
  H2H_CHALLENGE_CANCELLED:     { icon: <FiX size={14} />,      color: "#888" },
  H2H_CHALLENGE_OPPONENT_LOCKED: { icon: <FiCheck size={14} />, color: "#E8C96A" },
  H2H_CHALLENGE_FIELD_AVAILABLE: { icon: <FiUsers size={14} />, color: "#60A5FA" },
  H2H_CHALLENGE_RESULT:          { icon: <FiAward size={14} />, color: "#E8C96A" },
  CHALLENGE_UNLOCKED:            { icon: <FiAward size={14} />, color: "#34D399" },
  FANTASY_TOURNAMENT_LIVE:       { icon: <FiAward size={14} />, color: "#E8C96A" },
};

function describe(n: ApiNotification): string {
  const actor = n.actor?.name || "Someone";
  const team = (n.data as any)?.teamName || "a team";
  const preview = (n.data as any)?.preview;
  const tournamentName = (n.data as any)?.tournamentName;
  const wager = (n.data as any)?.wager;
  const effectiveWager = (n.data as any)?.effectiveWager;
  
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
    case "H2H_CHALLENGE_RECEIVED": return `${actor} challenged you to H2H${tournamentName ? ` for ${tournamentName}` : ""}${effectiveWager ? ` (${effectiveWager} pts)` : ""}`;
    case "H2H_CHALLENGE_ACCEPTED": return `${actor} accepted your H2H challenge${tournamentName ? ` for ${tournamentName}` : ""}`;
    case "H2H_CHALLENGE_DECLINED": return `${actor} declined your H2H challenge${tournamentName ? ` for ${tournamentName}` : ""}`;
    case "H2H_CHALLENGE_CANCELLED": return `${actor} cancelled the H2H challenge${tournamentName ? ` for ${tournamentName}` : ""}`;
    case "H2H_CHALLENGE_OPPONENT_LOCKED": return `${actor} locked their team for your H2H challenge${tournamentName ? ` (${tournamentName})` : ""}`;
    case "H2H_CHALLENGE_FIELD_AVAILABLE": return `The field is now available for your H2H challenge${tournamentName ? ` (${tournamentName})` : ""}. Pick your team!`;
    case "H2H_CHALLENGE_RESULT": return `Your H2H challenge${tournamentName ? ` for ${tournamentName}` : ""} has been settled`;
    case "CHALLENGE_UNLOCKED": return `You unlocked a new achievement!`;
    case "FANTASY_TOURNAMENT_LIVE": return `${tournamentName || "A tournament"} is now live — your picks are locked in!`;
    default:                   return "New notification";
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [invites, setInvites] = useState<ApiTeamInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<number | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount, setUnreadCount, decrementUnreadCount, setInvitesCount, invitesCount } = useNotifications();

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [nRes, iRes] = await Promise.all([
        api.notifications.list(undefined, 20),
        api.teams.getMyInvites(),
      ]);
      if (nRes.success) {
        const data = nRes.data as any;
        const all = (data?.notifications || []) as ApiNotification[];
        setItems(all.filter((n) => !n.read));
        setUnreadCount(data?.unreadCount ?? 0);
      }
      if (iRes.success) {
        const fetchedInvites = (iRes.data as any)?.invites || [];
        setInvites(fetchedInvites);
        setInvitesCount(fetchedInvites.length);
      }
    } finally {
      setLoading(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    if (!user) return;
    loadAll();
  }, [user, loadAll]);

  // Use the shared singleton socket — no new connection needed
  useEffect(() => {
    if (!user) return;

    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });

    socket.on("connect", () => {
      socket.emit("user:identify", { userId: user.id });
    });

    socket.on("notification:new", (n: ApiNotification) => {
      setItems(prev => [n, ...prev].slice(0, 30));
    });
    const onTeamInvite = (data: { teamId: number; userId: number; action: string }) => {
      if (data.userId === user.id) {
        api.teams.getMyInvites().then(res => {
          if (res.success) {
            const fetched = (res.data as any)?.invites || [];
            setInvites(fetched);
            setInvitesCount(fetched.length);
          }
        });
      }
    };
    socket.on("team:invite", onTeamInvite);
    return () => { socket.disconnect(); };
  }, [user?.id, setInvitesCount]);

  useEffect(() => {
    const handle = (e: Event) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, []);

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      await loadAll();
    }
  };

  const handleMarkAllRead = async () => {
    const res = await api.notifications.markAllRead();
    if (res.success) {
      setItems([]);
      setUnreadCount(0);
    }
  };

  const handleItemClick = async (n: ApiNotification) => {
    const href = getNotificationHref(n);

    // Mark-as-read in the background so navigation isn't blocked on the API.
    if (!n.read) {
      setItems(prev => prev.filter(x => x.id !== n.id));
      decrementUnreadCount();
      api.notifications.markRead(n.id).catch(() => { /* best-effort */ });
    }

    setOpen(false);
    if (href) router.push(href);
  };

  const handleAcceptInvite = async (inviteId: number) => {
    setProcessing(inviteId);
    try {
      const res = await api.teams.acceptInvite(inviteId);
      if (res.success) {
        setInvites(prev => prev.filter(i => i.id !== inviteId));
        setInvitesCount(invites.filter(i => i.id !== inviteId).length);
        toast.success("Invite accepted");
      } else {
        toast.error(res.message || "Failed to accept");
      }
    } finally {
      setProcessing(null);
    }
  };

  const handleDeclineInvite = async (inviteId: number) => {
    setProcessing(inviteId);
    try {
      const res = await api.teams.declineInvite(inviteId);
      if (res.success) {
        setInvites(prev => prev.filter(i => i.id !== inviteId));
        setInvitesCount(invites.filter(i => i.id !== inviteId).length);
        toast.success("Invite declined");
      }
    } finally {
      setProcessing(null);
    }
  };

  const badgeCount = unreadCount + invitesCount;
  const isEmpty = items.length === 0 && invites.length === 0;

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={handleOpen}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          color: "#E8C96A", background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", padding: "6px", borderRadius: "6px",
          WebkitTapHighlightColor: "transparent",
        }}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <NotificationIcon size={20} />
        {badgeCount > 0 && (
          <span style={{ position: "absolute", top: "0px", right: "0px", backgroundColor: "#F87171", color: "#FFF", fontSize: "9px", fontWeight: 700, borderRadius: "10px", padding: "2px 5px", minWidth: "16px", textAlign: "center", pointerEvents: "none" }}>
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
        {showTooltip && (
          <span style={{
            position: "absolute",
            bottom: "-32px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#1E2A47",
            color: "#FFF",
            fontSize: "12px",
            padding: "6px 10px",
            borderRadius: "6px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 100,
            display: window.innerWidth < 640 ? "none" : "block"
          }}>
            Notifications
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "fixed",
          top: "calc(clamp(50px, 6vw, 70px) + 8px)",
          right: "12px",
          width: "min(420px, calc(100vw - 24px))",
          maxHeight: "calc(100vh - clamp(50px, 6vw, 70px) - 24px)",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          backgroundColor: "#13192A", border: "1px solid #1E2A47",
          borderRadius: "8px",
          zIndex: 50, boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          fontFamily: "var(--font-poppins), sans-serif",
          WebkitTransform: "translateZ(0)",
          transform: "translateZ(0)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #1E2A47", position: "sticky", top: 0, backgroundColor: "#13192A" }}>
            <div style={{ color: "#E8C96A", fontSize: "14px", fontWeight: 600 }}>Notifications</div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} style={{ background: "none", border: "none", color: "#888", fontSize: "11px", cursor: "pointer" }}>
                Mark all read
              </button>
            )}
          </div>

          {invites.length > 0 && (
            <div>
              <div style={{ padding: "8px 16px", fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Pending invitations
              </div>
              {invites.map(invite => (
                <div key={invite.id} style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ color: "#FFF", fontSize: "13px", marginBottom: "6px" }}>
                    Invited to <span style={{ color: "#E8C96A", fontWeight: 600 }}>{invite.teamName}</span>
                  </div>
                  {invite.teamDescription && (
                    <div style={{ color: "#888", fontSize: "11px", marginBottom: "8px" }}>{invite.teamDescription}</div>
                  )}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => handleAcceptInvite(invite.id)} disabled={processing === invite.id} style={{ flex: 1, backgroundColor: "#E8C96A", color: "#060D1F", border: "none", borderRadius: "5px", padding: "7px", fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: processing === invite.id ? 0.5 : 1 }}>
                      Accept
                    </button>
                    <button onClick={() => handleDeclineInvite(invite.id)} disabled={processing === invite.id} style={{ flex: 1, backgroundColor: "transparent", color: "#888", border: "1px solid #1E2A47", borderRadius: "5px", padding: "7px", fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: processing === invite.id ? 0.5 : 1 }}>
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {loading && items.length === 0 && (
            <div style={{ padding: "20px", color: "#888", fontSize: "12px", textAlign: "center" }}>Loading…</div>
          )}

          {!loading && isEmpty && (
            <div style={{ padding: "28px 16px", color: "#888", fontSize: "12px", textAlign: "center" }}>
              You're all caught up.
            </div>
          )}

          {items.map(n => {
            const meta = ICON_FOR[n.type] || ICON_FOR.POST_LIKED;
            return (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                style={{
                  display: "flex", gap: "8px", padding: "7px 12px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  cursor: "pointer",
                  backgroundColor: n.read ? "transparent" : "rgba(232,201,106,0.05)",
                }}
              >
                <div style={{
                  width: "22px", height: "22px", borderRadius: "50%",
                  backgroundColor: "#060D1F",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: meta.color, flexShrink: 0, marginTop: "1px",
                }}>
                  {meta.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "#FFF", fontSize: "11.5px", lineHeight: 1.35 }}>
                    {describe(n)}
                  </div>
                  <div style={{ color: "#888", fontSize: "10px", marginTop: "2px" }}>
                    {timeAgo(n.createdAt)}
                  </div>
                </div>
                {!n.read && (
                  <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#E8C96A", alignSelf: "center", flexShrink: 0 }} />
                )}
              </div>
            );
          })}

          <div style={{ padding: "10px 16px", textAlign: "center", borderTop: "1px solid #1E2A47" }}>
            <Link href="/notifications" onClick={() => setOpen(false)} style={{ color: "#E8C96A", fontSize: "12px", textDecoration: "none" }}>
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
