"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TournamentSection from "@/app/components/fantasy/TournamentSection";
import FantasyStats from "@/app/components/fantasy/FantasyStats";
import { api } from "@/app/services/api";
import { FANTASY_STATS, MOCK_TOURNAMENTS, STATIC_TIER_FILES } from "@/app/lib/fantasy-data";
import type { TournamentList } from "@/app/types/fantasy";

export default function FantasyGolfPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<TournamentList>(MOCK_TOURNAMENTS);
  const [tournLoading, setTournLoading] = useState(true);
  const [availableTournId, setAvailableTournId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.golf.getTournaments();
        if (!cancelled && res.success && res.data) {
          const data = res.data as TournamentList;
          const hasEvents = data.completed.length + data.live.length + data.upcoming.length > 0;
          if (hasEvents) setTournaments(data);
          else setTournaments(MOCK_TOURNAMENTS);
        } else {
          setTournaments(MOCK_TOURNAMENTS);
        }
      } catch {
        setTournaments(MOCK_TOURNAMENTS);
      } finally {
        if (!cancelled) setTournLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Check if next upcoming tournament has player data (static JSON)
  useEffect(() => {
    const next = tournaments.upcoming[0] || tournaments.live[0];
    if (!next) return;
    const file = STATIC_TIER_FILES[next.tournId];
    if (!file) { setAvailableTournId(null); return; }
    fetch(file, { method: "HEAD" })
      .then((res) => setAvailableTournId(res.ok ? next.tournId : null))
      .catch(() => setAvailableTournId(null));
  }, [tournaments]);

  return (
    <>
      {/* Page Title */}
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

      {/* Stats Cards */}
      <FantasyStats stats={FANTASY_STATS} />

      {/* Tournament Tabs */}
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
