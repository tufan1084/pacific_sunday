"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import TournamentSection from "@/app/components/fantasy/TournamentSection";
import FantasyStats from "@/app/components/fantasy/FantasyStats";
import { api } from "@/app/services/api";
import { FANTASY_STATS } from "@/app/lib/fantasy-data";
import type { TournamentList, FantasyStatCard } from "@/app/types/fantasy";
import { Skeleton, shimmerCss } from "@/app/components/ui/Skeleton";

const EMPTY: TournamentList = { completed: [], live: [], upcoming: [] };

function FantasySkeleton() {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ background: "#0f1a30", borderRadius: 8, padding: 20 }}>
            <Skeleton h={28} w="50%" mb={8} />
            <Skeleton h={13} w="70%" />
          </div>
        ))}
      </div>
      <div style={{ background: "#0f1a30", borderRadius: 8, padding: 20, marginBottom: 16 }}>
        <Skeleton h={18} w="30%" mb={16} />
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ background: "#13192A", borderRadius: 8, padding: 16, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <Skeleton h={15} w="60%" mb={8} />
              <Skeleton h={12} w="40%" />
            </div>
            <Skeleton h={32} w={80} r={6} />
          </div>
        ))}
      </div>
    </>
  );
}

export default function FantasyGolfPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<TournamentList>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [tRes, wRes, rRes] = await Promise.all([
          api.golf.getTournaments(),
          api.points.getWallet(),
          api.points.getRank(),
        ]);
        if (cancelled) return;
        if (tRes.success && tRes.data) setTournaments(tRes.data as TournamentList);
        if (wRes.success && wRes.data) setWalletBalance(wRes.data.wallet?.balance ?? 0);
        if (rRes.success && rRes.data) setRank(rRes.data.rank);
      } finally { if (!cancelled) setLoading(false); }
    };
    load();
    const poll = setInterval(load, 2 * 60 * 1000);
    return () => { cancelled = true; clearInterval(poll); };
  }, []);

  const stats = useMemo<FantasyStatCard[]>(() => [
    { value: walletBalance === null ? "—" : walletBalance.toLocaleString("en-US"), label: "Your Points", clickable: true },
    { value: rank === null ? "—" : `#${rank}`, label: "Club Rank" },
    FANTASY_STATS[2],
  ], [walletBalance, rank]);

  const availableTournIds = useMemo(() => {
    const ids = new Set<string>();
    [...tournaments.upcoming, ...tournaments.live].forEach(t => { if (t.fieldAvailable) ids.add(t.tournId); });
    return ids;
  }, [tournaments.upcoming, tournaments.live]);

  return (
    <>
      <style>{shimmerCss}</style>
      <div style={{ fontSize: "clamp(18px,2.5vw,25px)", color: "#E8C96A", fontWeight: 400, fontFamily: "var(--font-poppins), sans-serif" }}>
        PGA Tour — {new Date().getFullYear()} Season
      </div>
      <div style={{ fontSize: "clamp(12px,1.2vw,15px)", color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-poppins), sans-serif", marginTop: 4, marginBottom: 16 }}>
        Fantasy Golf · Pick your players each week and compete with your club
      </div>

      {loading ? <FantasySkeleton /> : (
        <>
          <FantasyStats stats={stats} liveTournaments={tournaments.live} upcomingTournaments={tournaments.upcoming} />
          <TournamentSection
            completed={tournaments.completed} live={tournaments.live} upcoming={tournaments.upcoming}
            selectedTournId={null} onSelect={tournId => router.push(`/fantasy-golf/${tournId}`)}
            loading={false} availableTournIds={availableTournIds}
          />
        </>
      )}
    </>
  );
}
