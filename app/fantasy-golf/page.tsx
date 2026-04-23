"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import TournamentSection from "@/app/components/fantasy/TournamentSection";
import FantasyStats from "@/app/components/fantasy/FantasyStats";
import { api } from "@/app/services/api";
import { FANTASY_STATS } from "@/app/lib/fantasy-data";
import type { TournamentList } from "@/app/types/fantasy";
import type { FantasyStatCard } from "@/app/types/fantasy";

const EMPTY: TournamentList = { completed: [], live: [], upcoming: [] };

// Module-level caches persist across client navigations so the page fetches
// once per session (5-min TTL). `null` balance = never fetched; 0 is a real value.
let tournamentsCache: { data: TournamentList; timestamp: number } | null = null;
let walletCache: { balance: number; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000;

export default function FantasyGolfPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<TournamentList>(tournamentsCache?.data || EMPTY);
  const [tournLoading, setTournLoading] = useState(!tournamentsCache);
  const [walletBalance, setWalletBalance] = useState<number | null>(walletCache?.balance ?? null);

  useEffect(() => {
    let cancelled = false;
    const now = Date.now();
    const tournFresh = tournamentsCache && (now - tournamentsCache.timestamp) < CACHE_DURATION;
    const walletFresh = walletCache && (now - walletCache.timestamp) < CACHE_DURATION;

    if (tournFresh) {
      setTournaments(tournamentsCache!.data);
      setTournLoading(false);
    }
    if (walletFresh) setWalletBalance(walletCache!.balance);

    const tasks: Promise<void>[] = [];

    if (!tournFresh) {
      tasks.push((async () => {
        try {
          const res = await api.golf.getTournaments();
          if (!cancelled && res.success && res.data) {
            const data = res.data as TournamentList;
            setTournaments(data);
            tournamentsCache = { data, timestamp: Date.now() };
          }
        } catch {
          // leave EMPTY on failure
        } finally {
          if (!cancelled) setTournLoading(false);
        }
      })());
    }

    if (!walletFresh) {
      tasks.push((async () => {
        try {
          const res = await api.points.getWallet();
          if (!cancelled && res.success && res.data) {
            const balance = res.data.wallet?.balance ?? 0;
            setWalletBalance(balance);
            walletCache = { balance, timestamp: Date.now() };
          }
        } catch {
          // leave prior/null balance on failure — card will render "—"
        }
      })());
    }

    void Promise.all(tasks);
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo<FantasyStatCard[]>(() => {
    const pointsValue = walletBalance === null ? "—" : walletBalance.toLocaleString("en-US");
    return [
      { value: pointsValue, label: "Your Points" },
      FANTASY_STATS[1],
      FANTASY_STATS[2],
    ];
  }, [walletBalance]);

  // Signal "field ready" — first upcoming/live tournament with fieldAvailable=true
  const availableTournId =
    tournaments.upcoming.find((t) => t.fieldAvailable)?.tournId ||
    tournaments.live.find((t) => t.fieldAvailable)?.tournId ||
    null;

  return (
    <>
      <div
        className="tracking-wide"
        style={{
          fontSize: "clamp(18px, 2.5vw, 25px)",
          color: "#E8C96A",
          fontWeight: 400,
          fontFamily: "var(--font-poppins), sans-serif",
        }}
      >
        PGA Tour — {new Date().getFullYear()} Season
      </div>
      <div
        style={{
          fontSize: "clamp(12px, 1.2vw, 15px)",
          color: "rgba(255,255,255,0.5)",
          fontFamily: "var(--font-poppins), sans-serif",
          marginTop: "4px",
        }}
      >
        Fantasy Golf · Pick your players each week and compete with your club
      </div>

      <FantasyStats
        stats={stats}
        liveTournaments={tournaments.live}
        upcomingTournaments={tournaments.upcoming}
      />

      <TournamentSection
        completed={tournaments.completed}
        live={tournaments.live}
        upcoming={tournaments.upcoming}
        selectedTournId={null}
        onSelect={(tournId) => router.push(`/fantasy-golf/${tournId}`)}
        loading={tournLoading}
        availableTournId={availableTournId}
      />
    </>
  );
}
