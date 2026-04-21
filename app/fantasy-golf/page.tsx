"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TournamentSection from "@/app/components/fantasy/TournamentSection";
import FantasyStats from "@/app/components/fantasy/FantasyStats";
import { api } from "@/app/services/api";
import { FANTASY_STATS } from "@/app/lib/fantasy-data";
import type { TournamentList } from "@/app/types/fantasy";

const EMPTY: TournamentList = { completed: [], live: [], upcoming: [] };

// Simple in-memory cache
let tournamentsCache: { data: TournamentList; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function FantasyGolfPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<TournamentList>(tournamentsCache?.data || EMPTY);
  const [tournLoading, setTournLoading] = useState(!tournamentsCache);

  useEffect(() => {
    let cancelled = false;
    
    // Check if cache is valid
    const now = Date.now();
    if (tournamentsCache && (now - tournamentsCache.timestamp) < CACHE_DURATION) {
      setTournaments(tournamentsCache.data);
      setTournLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await api.golf.getTournaments();
        if (!cancelled && res.success && res.data) {
          const data = res.data as TournamentList;
          setTournaments(data);
          // Update cache
          tournamentsCache = { data, timestamp: Date.now() };
        }
      } catch {
        // leave EMPTY on failure
      } finally {
        if (!cancelled) setTournLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
        stats={FANTASY_STATS} 
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
