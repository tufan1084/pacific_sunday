"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/services/api";

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

  const cells = [
    { label: "Posts this week", value: fmt(stats?.postsThisWeek) },
    { label: "Active owners", value: fmt(stats?.activeOwners) },
    { label: "NFC scans today", value: fmt(stats?.nfcScansToday) },
  ];

  return (
    <div
      className="community-status"
      style={{
        backgroundColor: "#13192A",
        borderRadius: "5px",
        fontFamily: "var(--font-poppins), sans-serif",
      }}
    >
      {/* Mobile: compact one-line 3-column row (value over label, vertical dividers).
          Saves vertical space on narrow screens + keeps the Community Status block short. */}
      <div className="block lg:hidden" style={{ padding: "14px 14px 16px" }}>
        <div style={{ marginBottom: "12px" }}>
          <span style={{ fontSize: "clamp(14px, 1.5vw, 16px)", color: "#E8C96A", fontWeight: 600 }}>Community Status</span>
        </div>
        <div className="flex items-stretch" style={{ gap: 0 }}>
          {cells.map((cell, i) => (
            <div
              key={cell.label}
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "4px 6px",
                borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.1)" : "none",
              }}
            >
              <div style={{ color: "#E8C96A", fontSize: "clamp(16px, 2vw, 20px)", fontWeight: 700, lineHeight: 1.1 }}>
                {cell.value}
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.55)",
                  fontSize: "clamp(10px, 1.1vw, 11px)",
                  fontWeight: 400,
                  marginTop: "4px",
                  lineHeight: 1.2,
                }}
              >
                {cell.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop (lg+): original stacked list with horizontal dividers —
          matches the other right-panel widgets on the community page. */}
      <div className="hidden lg:block" style={{ padding: "20px 16px" }}>
        <div style={{ paddingBottom: "20px", paddingTop: "8px" }}>
          <span style={{ fontSize: "18px", color: "#E8C96A", fontWeight: 600 }}>Community Status</span>
        </div>
        <div style={{ height: "1.5px", backgroundColor: "rgba(255,255,255,0.15)", marginLeft: "-16px", marginRight: "-16px" }} />
        {cells.map((cell, i) => (
          <div key={cell.label}>
            <div className="flex items-center justify-between" style={{ paddingTop: "14px", paddingBottom: "14px" }}>
              <span style={{ color: "#E8C96A", fontSize: "clamp(13px, 1.3vw, 16px)", fontWeight: 400 }}>{cell.label}</span>
              <span style={{ color: "#E8C96A", fontSize: "clamp(13px, 1.3vw, 16px)", fontWeight: 400 }}>{cell.value}</span>
            </div>
            {i < cells.length - 1 && (
              <div style={{ height: "1.5px", backgroundColor: "rgba(255,255,255,0.15)", marginLeft: "-16px", marginRight: "-16px" }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
