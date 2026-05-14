"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import YourPicksLive from "@/app/components/live-scores/YourPicksLive";
import FullLeaderboard from "@/app/components/live-scores/FullLeaderboard";
import { api } from "@/app/services/api";
import { Skeleton, SkeletonList, shimmerCss } from "@/app/components/ui/Skeleton";

type Tournament = { id: number; tournId: string; year: number; name: string; status: string; startDate: string; endDate: string; courseName: string; };

function LiveSkeleton() {
  return (
    <>
      <div style={{ background: "#0f1a30", borderRadius: 8, padding: 20, marginBottom: 16 }}>
        <Skeleton h={18} w="40%" mb={12} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ background: "#13192A", borderRadius: 8, padding: 14 }}>
              <Skeleton h={13} w="60%" mb={8} />
              <Skeleton h={20} w="50%" mb={6} />
              <Skeleton h={11} w="40%" />
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: "#0f1a30", borderRadius: 8, padding: 20 }}>
        <Skeleton h={18} w="35%" mb={16} />
        <SkeletonList count={10} rowHeight={48} />
      </div>
    </>
  );
}

export default function LiveScoresPage() {
  const [liveTournaments, setLiveTournaments] = useState<Tournament[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userPicks, setUserPicks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTournamentData = async (tournament: Tournament, currentLeaderboard: any[] = []) => {
    const fantasyRes = await api.golf.getTournamentFantasy(tournament.tournId);
    let fantasyData: any = null;
    if (fantasyRes.success && fantasyRes.data) {
      fantasyData = fantasyRes.data as any;
      const lb = Array.isArray(fantasyData.leaderboard) ? fantasyData.leaderboard : [];
      setLeaderboard(lb);
      currentLeaderboard = lb;
    }
    const picksRes = await api.golf.getPicks(tournament.tournId);
    if (picksRes.success && picksRes.data) {
      const picks = (picksRes.data as any).picks || {};
      const tiers = fantasyData?.tiers || [];
      const picksWithData: any[] = [];
      Object.entries(picks).forEach(([tierName, playerId]) => {
        if (!playerId) return;
        const tier = tiers.find((t: any) => t.tier === tierName);
        if (!tier) return;
        const player = tier.players?.find((p: any) => p.playerId === playerId);
        if (!player) return;
        const lbPlayer = currentLeaderboard.find((lb: any) => lb.playerId === playerId);
        picksWithData.push({ tier: tierName, name: `${player.firstName} ${player.lastName}`, score: lbPlayer?.totalScore || "E", thru: lbPlayer?.thru || "-", scoreType: lbPlayer?.totalScore?.startsWith("-") ? "negative" : "positive" });
      });
      setUserPicks(picksWithData);
    }
  };

  const loadLiveData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true); else setLoading(true);
    try {
      const res = await api.golf.getTournaments();
      if (res.success && res.data) {
        const live = (res.data as { live: Tournament[] }).live || [];
        setLiveTournaments(live);
        if (live.length > 0) await loadTournamentData(live[selectedIndex] || live[0]);
      }
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadLiveData(); }, []);

  const liveTournament = liveTournaments[selectedIndex] || null;

  if (loading) return (
    <>
      <style>{shimmerCss}</style>
      <div style={{ marginBottom: 24 }}>
        <Skeleton h={28} w="40%" mb={8} />
        <Skeleton h={16} w="55%" />
      </div>
      <LiveSkeleton />
    </>
  );

  if (liveTournaments.length === 0) return (
    <div style={{ backgroundColor: "#13192A", borderRadius: 5, padding: "60px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(232,201,106,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
      <div style={{ color: "#E8C96A", fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No Tournament Live</div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.6 }}>There are no tournaments currently in progress.<br />Check back when a tournament is live to see real-time scores.</div>
    </div>
  );

  return (
    <>
      <style>{shimmerCss}</style>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: "clamp(18px,2.5vw,25px)", color: "#E8C96A", fontWeight: 400 }}>Live Scores</span>
            <div className="flex items-center gap-1">
              <Image src="/icons/nfc.svg" alt="live" width={24} height={24} />
              <span style={{ color: "#74FF6D", fontSize: 16, fontWeight: 400 }}>Live</span>
            </div>
          </div>
          <div style={{ color: "#FFFFFF", fontSize: 16, fontWeight: 400, marginTop: 4 }}>{liveTournament?.name} · {liveTournament?.courseName}</div>
        </div>
        <button onClick={() => loadLiveData(true)} disabled={refreshing}
          style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "transparent", border: "1px solid #E8C96A", borderRadius: 5, color: "#E8C96A", fontSize: 14, fontWeight: 400, padding: "8px 20px", cursor: refreshing ? "not-allowed" : "pointer", opacity: refreshing ? 0.6 : 1, fontFamily: "var(--font-poppins), sans-serif", flexShrink: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }}>
            <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {liveTournaments.length > 1 && (
        <div className="flex gap-2 mb-6" style={{ flexWrap: "wrap" }}>
          {liveTournaments.map((t, i) => (
            <button key={t.tournId} onClick={async () => { setSelectedIndex(i); setLeaderboard([]); setUserPicks([]); await loadTournamentData(t); }}
              style={{ padding: "8px 16px", borderRadius: 5, border: `1px solid ${i === selectedIndex ? "#E8C96A" : "rgba(255,255,255,0.15)"}`, backgroundColor: i === selectedIndex ? "rgba(232,201,106,0.1)" : "transparent", color: i === selectedIndex ? "#E8C96A" : "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-poppins), sans-serif" }}
            >{t.name}</button>
          ))}
        </div>
      )}

      {userPicks.length > 0 && <YourPicksLive picks={userPicks} />}
      <FullLeaderboard leaderboard={leaderboard} tournamentName={liveTournament.name} />

      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </>
  );
}
