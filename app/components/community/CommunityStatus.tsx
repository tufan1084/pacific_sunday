"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/services/api";

const dividerStyle = {
  height: "1.5px",
  backgroundColor: "rgba(255,255,255,0.15)",
  marginLeft: "-16px",
  marginRight: "-16px",
};

type StatsShape = { postsThisWeek: number; activeOwners: number; nfcScansToday: number };

// Shared module-level cache so navigating between /community and /post/:id
// doesn't re-hit the endpoint. 60s TTL is tight enough that a new post /
// scan shows up quickly but avoids per-render fetches.
let cache: { data: StatsShape; timestamp: number } | null = null;
const CACHE_MS = 60 * 1000;

export default function CommunityStatus() {
  const [stats, setStats] = useState<StatsShape | null>(cache?.data ?? null);

  useEffect(() => {
    let cancelled = false;
    const fresh = cache && Date.now() - cache.timestamp < CACHE_MS;
    if (fresh) {
      setStats(cache!.data);
      return;
    }
    api.stats.community().then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        const data: StatsShape = {
          postsThisWeek: res.data.postsThisWeek ?? 0,
          activeOwners: res.data.activeOwners ?? 0,
          nfcScansToday: res.data.nfcScansToday ?? 0,
        };
        setStats(data);
        cache = { data, timestamp: Date.now() };
      }
    }).catch(() => {
      // leave stats null so the UI falls back to "—"
    });
    return () => { cancelled = true; };
  }, []);

  const fmt = (n: number | null | undefined) =>
    n == null ? "—" : n.toLocaleString("en-US");

  const rows = [
    { label: "Posts this week", value: fmt(stats?.postsThisWeek) },
    { label: "Active owners", value: fmt(stats?.activeOwners) },
    { label: "NFC scans today", value: fmt(stats?.nfcScansToday) },
  ];

  return (
    <div
      style={{
        backgroundColor: "#13192A",
        borderRadius: "5px",
        padding: "20px 16px",
        fontFamily: "var(--font-poppins), sans-serif",
      }}
    >
      <div style={{ paddingBottom: "20px", paddingTop: "8px" }}>
        <span style={{ fontSize: "18px", color: "#E8C96A", fontWeight: 600 }}>Community Status</span>
      </div>
      <div style={dividerStyle} />

      {rows.map((row, i) => (
        <div key={row.label}>
          <div className="flex items-center justify-between" style={{ paddingTop: "14px", paddingBottom: "14px" }}>
            <span style={{ color: "#E8C96A", fontSize: "clamp(13px, 1.3vw, 16px)", fontWeight: 400 }}>{row.label}</span>
            <span style={{ color: "#E8C96A", fontSize: "clamp(13px, 1.3vw, 16px)", fontWeight: 400 }}>{row.value}</span>
          </div>
          {i < rows.length - 1 && <div style={dividerStyle} />}
        </div>
      ))}
    </div>
  );
}
