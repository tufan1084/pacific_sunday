"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/services/api";
import { GOLF_STATS } from "@/app/lib/profile-data";
import type { ApiResponse, GolfPassport } from "@/app/types";

const goldenFilter = "brightness(0) saturate(100%) invert(83%) sepia(43%) saturate(500%) hue-rotate(358deg) brightness(98%)";

function StatIcon({ type }: { type: string }) {
  if (type === "index") return <img src="/icons/index.svg" alt="index" width={36} height={36} style={{ flexShrink: 0 }} />;
  if (type === "home") return <img src="/icons/home.svg" alt="home" width={36} height={36} style={{ flexShrink: 0 }} />;
  if (type === "score") return <img src="/icons/leaderboard.svg" alt="score" width={36} height={36} style={{ flexShrink: 0, filter: goldenFilter }} />;
  return null;
}

export default function YourGolfStats() {
  const [golfData, setGolfData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGolfPassport = async () => {
      try {
        const response = await api.profile.getGolfPassport() as ApiResponse<{ golfPassport: GolfPassport | null }>;
        if (response.success && response.data?.golfPassport) {
          setGolfData(response.data.golfPassport);
        }
      } catch (error) {
        console.error("Failed to load golf stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGolfPassport();
  }, []);

  const stats = [
    {
      icon: "index",
      value: golfData?.handicap || GOLF_STATS[0].value,
      label: "Handicap Index",
    },
    {
      icon: "score",
      value: golfData?.bestScore || GOLF_STATS[2].value,
      label: "Best Score Ever",
    },
    {
      icon: "home",
      value: golfData?.homeCourse || GOLF_STATS[1].value,
      label: "Home Golf Course",
    },
  ];

  return (
    <div style={{ backgroundColor: "#13192A", borderRadius: "5px", padding: "20px", fontFamily: "var(--font-poppins), sans-serif" }}>
      <div style={{ color: "#E8C96A", fontSize: "clamp(16px, 1.8vw, 20px)", fontWeight: 400, marginBottom: "14px" }}>Your Golf Stats</div>
      <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.08)", marginLeft: "-20px", marginRight: "-20px" }} />

      {loading ? (
        <div style={{ padding: "20px", textAlign: "center", color: "#94A3B8" }}>Loading...</div>
      ) : (
        stats.map((stat, i) => (
          <div key={i} className="flex items-center gap-3" style={{ paddingTop: "12px", paddingBottom: "12px" }}>
            <StatIcon type={stat.icon} />
            <div>
              <div style={{ color: "#E8C96A", fontSize: "clamp(14px, 1.5vw, 18px)", fontWeight: 400 }}>{stat.value}</div>
              <div style={{ color: "#FFFFFF", fontSize: "clamp(12px, 1.2vw, 15px)", fontWeight: 400, marginTop: "2px" }}>{stat.label}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
