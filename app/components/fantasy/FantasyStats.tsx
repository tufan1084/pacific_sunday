"use client";

import { useState, useEffect } from "react";
import StatsCards from "@/app/components/ui/StatsCards";
import type { FantasyStatCard } from "@/app/types/fantasy";
import type { Tournament } from "@/app/types/fantasy";

interface FantasyStatsProps {
  stats: FantasyStatCard[];
  liveTournaments?: Tournament[];
  upcomingTournaments?: Tournament[];
}

function formatCountdown(ms: number) {
  if (ms <= 0) return "Starting Soon";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${Math.max(1, m)}m`;
}

export default function FantasyStats({ stats, liveTournaments = [], upcomingTournaments = [] }: FantasyStatsProps) {
  const [now, setNow] = useState(() => Date.now());

  // Update countdown every 30 seconds
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Calculate dynamic third card value
  const getThirdCardValue = () => {
    if (liveTournaments.length > 0) {
      return "LIVE";
    }
    
    if (upcomingTournaments.length > 0) {
      // Find next upcoming tournament (earliest start date)
      const sorted = [...upcomingTournaments].sort((a, b) => {
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();
        return dateA - dateB;
      });
      const nextTournament = sorted[0];
      const startTs = new Date(nextTournament.startDate).getTime();
      const msRemaining = Math.max(0, startTs - now);
      return formatCountdown(msRemaining);
    }
    
    return "--";
  };

  const getThirdCardLabel = () => {
    if (liveTournaments.length > 0) {
      return liveTournaments.length === 1 ? "Tournament Live" : "Tournaments Live";
    }
    return "Until Next";
  };

  // Create dynamic stats array
  const dynamicStats: FantasyStatCard[] = [
    stats[0], // Your Points
    stats[1], // Club Rank
    { value: getThirdCardValue(), label: getThirdCardLabel() },
  ];

  return <StatsCards stats={dynamicStats} cols={3} maxWidth="100%" marginBottom="24px" />;
}
