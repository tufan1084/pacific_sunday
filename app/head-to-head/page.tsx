"use client";

import { useCallback, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { api } from "@/app/services/api";
import type { ApiH2HChallenge, ApiNotification } from "@/app/services/api";
import type { User } from "@/app/types";
import { SOCKET_URL } from "@/app/lib/constants";
import H2HHeader from "@/app/components/h2h/H2HHeader";
import StatsCards from "@/app/components/ui/StatsCards";
import IncomingRequests from "@/app/components/h2h/IncomingRequests";
import ChallengeList from "@/app/components/h2h/ChallengeList";
import { useNotifications } from "@/app/context/NotificationContext";
import { Skeleton, SkeletonList, shimmerCss } from "@/app/components/ui/Skeleton";

const H2H_TYPES = new Set(["H2H_CHALLENGE_RECEIVED","H2H_CHALLENGE_ACCEPTED","H2H_CHALLENGE_DECLINED","H2H_CHALLENGE_CANCELLED","H2H_CHALLENGE_OPPONENT_LOCKED","H2H_CHALLENGE_FIELD_AVAILABLE","H2H_CHALLENGE_RESULT"]);

function H2HSkeleton() {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ background: "#0f1a30", borderRadius: 8, padding: 20 }}>
            <Skeleton h={28} w="50%" mb={8} />
            <Skeleton h={13} w="70%" />
          </div>
        ))}
      </div>
      <div style={{ background: "#0f1a30", borderRadius: 8, padding: 20, marginBottom: 16 }}>
        <Skeleton h={18} w="40%" mb={16} />
        <SkeletonList count={3} rowHeight={56} />
      </div>
    </>
  );
}

export default function HeadToHeadPage() {
  const [me, setMe] = useState<User | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [challenges, setChallenges] = useState<ApiH2HChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const { setH2hIncomingCount } = useNotifications();

  const reload = useCallback(async () => {
    const [meRes, statsRes, listRes] = await Promise.all([
      api.auth.me(), api.h2h.getStats(), api.h2h.listChallenges("all"),
    ]);
    if (meRes.success && meRes.data) setMe(meRes.data.user);
    if (statsRes.success && statsRes.data) setStats(statsRes.data);
    if (listRes.success && listRes.data) {
      const all = listRes.data.challenges;
      setChallenges(all);
      const meId = meRes.success && meRes.data ? meRes.data.user.id : me?.id;
      setH2hIncomingCount(all.filter(c => c.status === "PENDING" && c.opponent?.id === meId).length);
    }
    setLoading(false);
  }, [me?.id, setH2hIncomingCount]);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    const userId = me?.id;
    if (!userId) return;
    const socket: Socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socket.on("connect", () => socket.emit("user:identify", { userId }));
    socket.on("notification:new", (n: ApiNotification) => { if (H2H_TYPES.has(n.type)) reload(); });
    socket.on("h2h:bothLocked", reload);
    socket.on("h2h:challengeUpdated", reload);
    return () => { socket.disconnect(); };
  }, [me?.id, reload]);

  const myId = me?.id;
  const incoming = challenges.filter(c => c.status === "PENDING" && c.opponent?.id === myId);
  const outgoing = challenges.filter(c => c.status === "PENDING" && c.challenger?.id === myId);
  const active   = challenges.filter(c => ["ACCEPTED","LOCKED","LIVE"].includes(c.status));
  const past     = challenges.filter(c => ["COMPLETED","REFUNDED","DECLINED","CANCELLED"].includes(c.status));

  const statCards = stats ? [
    { value: `${stats.wins} – ${stats.losses}${stats.ties ? ` – ${stats.ties}T` : ""}`, label: "Win Loss Record" },
    { value: `${stats.bonus >= 0 ? "+" : ""}${stats.bonus}`, label: "H2H Bonus Points" },
    { value: String(stats.activeCount), label: "Active Challenges" },
  ] : [];

  return (
    <>
      <style>{shimmerCss}</style>
      <H2HHeader onCreated={reload} />

      {loading ? <H2HSkeleton /> : (
        <>
          {stats && <StatsCards stats={statCards} cols={3} maxWidth="100%" marginBottom="24px" />}
          {incoming.length > 0 && <IncomingRequests challenges={incoming} onAction={reload} />}
          {outgoing.length > 0 && <ChallengeList title="Sent Requests" icon="hourglass" challenges={outgoing} viewerId={myId ?? null} variant="outgoing" onAction={reload} />}
          <ChallengeList title="Active Challenges" icon="trophy" challenges={active} viewerId={myId ?? null} variant="active" emptyMessage="No active challenges. Send one to get started." onAction={reload} />
          {past.length > 0 && <ChallengeList title="Past Challenges" icon="history" challenges={past} viewerId={myId ?? null} variant="past" onAction={reload} />}
        </>
      )}
    </>
  );
}
