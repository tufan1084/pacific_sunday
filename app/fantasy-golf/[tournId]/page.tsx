"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import TierPlayerList from "@/app/components/fantasy/TierPlayerList";
import { api } from "@/app/services/api";
import { MOCK_TIERS, STATIC_TIER_FILES } from "@/app/lib/fantasy-data";
import type { Tournament, ApiTier, TournamentList } from "@/app/types/fantasy";

function formatDateRange(start: string, end: string) {
  if (!start) return "";
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const sStr = s.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (!e) return sStr;
  const eStr = e.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${sStr}–${eStr}`;
}

export default function TournamentPicksPage() {
  const params = useParams();
  const router = useRouter();
  const tournId = params.tournId as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [tiers, setTiers] = useState<ApiTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState<Record<string, string | null>>({});
  const [isLocked, setIsLocked] = useState(false);

  // Fetch tournament info
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.golf.getTournaments();
        if (!cancelled && res.success && res.data) {
          const data = res.data as TournamentList;
          const allTournaments = [...data.live, ...data.upcoming, ...data.completed];
          const found = allTournaments.find((t) => t.tournId === tournId);
          if (found) {
            setTournament(found);
            setIsLocked(found.status === "live" || found.status === "completed");
          }
        }
      } catch {
        // silently fail
      }
    })();
    return () => { cancelled = true; };
  }, [tournId]);

  // Fetch players/tiers
  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Check static JSON first
      const staticFile = STATIC_TIER_FILES[tournId];
      if (staticFile) {
        const res = await fetch(staticFile);
        if (res.ok) {
          const data: ApiTier[] = await res.json();
          if (data.length > 0) {
            setTiers(data);
            return;
          }
        }
      }

      // 2. Try the backend API
      const res = await api.golf.getTournamentPlayers(tournId);
      if (res.success && res.data) {
        const data = res.data as { tournament: { name: string }; tiers: ApiTier[] };
        if (data.tiers && data.tiers.length > 0) {
          setTiers(data.tiers);
          return;
        }
      }

      // 3. Fallback to mock tiers for dev
      setTiers(MOCK_TIERS);
    } catch {
      setTiers(MOCK_TIERS);
    } finally {
      setLoading(false);
    }
  }, [tournId]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const selectedCount = Object.values(picks).filter(Boolean).length;
  const totalPicks = 5;

  return (
    <div style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
      {/* Back + Header */}
      <div style={{ marginBottom: "24px" }}>
        <button
          onClick={() => router.push("/fantasy-golf")}
          className="flex items-center"
          style={{
            gap: "6px",
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
            fontSize: "13px",
            fontFamily: "var(--font-poppins), sans-serif",
            padding: "0",
            marginBottom: "12px",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Tournaments
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div
              className="tracking-wide"
              style={{
                fontSize: "clamp(18px, 2.5vw, 25px)",
                color: "#E8C96A",
                fontWeight: 400,
              }}
            >
              Fantasy Golf — {tournament?.name || "Tournament"}
            </div>
            <div
              className="mt-1"
              style={{
                fontSize: "clamp(13px, 1.5vw, 16px)",
                color: "#FFFFFF",
                fontWeight: 400,
              }}
            >
              {tournament ? (
                <>
                  {tournament.name} · {tournament.courseName}
                  {tournament.startDate && ` · ${formatDateRange(tournament.startDate, tournament.endDate)}`}
                </>
              ) : (
                "Loading tournament info..."
              )}
            </div>
          </div>

          <div className="flex items-center gap-4" style={{ flexShrink: 0 }}>
            <span
              style={{
                color: "#E8C96A",
                fontSize: "clamp(14px, 1.5vw, 18px)",
                fontWeight: 500,
              }}
            >
              {selectedCount}/{totalPicks} Picks
            </span>
            {isLocked && (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  backgroundColor: "#FF6B6B",
                  color: "#060D1F",
                  padding: "4px 10px",
                  borderRadius: "5px",
                }}
              >
                LOCKED
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tier Player List */}
      {loading ? (
        <div
          style={{
            backgroundColor: "#13192A",
            borderRadius: "5px",
            padding: "40px 20px",
            textAlign: "center",
            color: "rgba(255,255,255,0.4)",
            fontSize: "14px",
          }}
        >
          Loading players...
        </div>
      ) : tiers.length > 0 ? (
        <TierPlayerList
          tiers={tiers}
          onPlayerSelect={isLocked ? undefined : (tierName, player) => {
            setPicks((prev) => ({ ...prev, [tierName]: player.playerId }));
          }}
        />
      ) : (
        <div
          style={{
            backgroundColor: "#13192A",
            borderRadius: "5px",
            padding: "40px 20px",
            textAlign: "center",
            color: "rgba(255,255,255,0.4)",
            fontSize: "14px",
          }}
        >
          No player data available for this tournament yet.
          <br />
          <span style={{ fontSize: "12px", marginTop: "8px", display: "block" }}>
            Player fields are typically published 2–3 days before the tournament starts.
          </span>
        </div>
      )}

      {/* Save & Lock Footer */}
      {tiers.length > 0 && (
        <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              disabled={isLocked || selectedCount === 0}
              style={{
                flex: 1,
                height: "clamp(44px, 4.5vw, 52px)",
                backgroundColor: isLocked || selectedCount === 0 ? "rgba(255,255,255,0.06)" : "rgba(232,201,106,0.15)",
                color: isLocked || selectedCount === 0 ? "rgba(255,255,255,0.25)" : "#E8C96A",
                fontSize: "14px",
                fontWeight: 600,
                fontFamily: "var(--font-poppins), sans-serif",
                border: isLocked || selectedCount === 0 ? "1.5px solid rgba(255,255,255,0.08)" : "1.5px solid #E8C96A",
                borderRadius: "5px",
                cursor: isLocked || selectedCount === 0 ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Save Picks
            </button>
            <button
              disabled={isLocked || selectedCount < totalPicks}
              style={{
                flex: 1,
                height: "clamp(44px, 4.5vw, 52px)",
                backgroundColor: isLocked ? "rgba(255,255,255,0.06)" : selectedCount < totalPicks ? "rgba(232,201,106,0.3)" : "#E8C96A",
                color: isLocked ? "rgba(255,255,255,0.25)" : selectedCount < totalPicks ? "rgba(6,13,31,0.5)" : "#060D1F",
                fontSize: "14px",
                fontWeight: 600,
                fontFamily: "var(--font-poppins), sans-serif",
                border: "none",
                borderRadius: "5px",
                cursor: isLocked || selectedCount < totalPicks ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {isLocked ? "Picks Locked" : `Lock Picks (${selectedCount}/${totalPicks})`}
            </button>
          </div>

          {!isLocked && tournament?.startDate && (
            <div
              style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.4)",
                textAlign: "center",
              }}
            >
              Picks lock when the tournament starts ·{" "}
              {new Date(tournament.startDate).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
          )}

          {isLocked && (
            <div
              style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.3)",
                textAlign: "center",
              }}
            >
              Tournament is {tournament?.status === "live" ? "live" : "completed"} · Picks are locked
            </div>
          )}
        </div>
      )}
    </div>
  );
}
