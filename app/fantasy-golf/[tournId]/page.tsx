"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import TierPlayerList from "@/app/components/fantasy/TierPlayerList";
import LockedPicksTable from "@/app/components/fantasy/LockedPicksTable";
import LockConfirmModal from "@/app/components/fantasy/LockConfirmModal";
import { api } from "@/app/services/api";
import { useToast } from "@/app/context/ToastContext";
import type { Tournament, ApiTier } from "@/app/types/fantasy";

// Simple in-memory cache for picks
let picksCache: Record<string, { picks: Record<string, string | null>; submittedAt: string | null; lockedAt: string | null; timestamp: number }> = {};
const PICKS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache for tournament fantasy data (tiers)
let fantasyCache: Record<string, { tournament: Tournament; tiers: ApiTier[]; timestamp: number }> = {};
const FANTASY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// DB stores dates in UTC; UI always renders in Pacific Time so a user in any
// timezone sees the PGA's "tournament day" (Thu–Sun PT) consistently.
const PT_OPTS: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", timeZone: "America/Los_Angeles" };
function formatDateRange(start: string, end: string) {
  if (!start) return "";
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const sStr = s.toLocaleDateString("en-US", PT_OPTS);
  if (!e) return sStr;
  const eStr = e.toLocaleDateString("en-US", PT_OPTS);
  return `${sStr}–${eStr}`;
}

function formatCountdown(ms: number) {
  if (ms <= 0) return "Locked";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${Math.max(1, m)}m`;
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

type FantasyData = {
  tournament: Tournament;
  tiers: ApiTier[];
  leaderboard: unknown | null;
  tiersComputedAt: string | null;
};

type PlayerScoring = {
  tier: string;
  playerId: string;
  playerName: string;
  score: string;
  points: number;
};

type PicksResponse = {
  picks: Record<string, string | null>;
  submittedAt: string;
  lockedAt: string | null;
  pointsAwarded: number | null;
  scoring: { playerScores: PlayerScoring[]; totalPoints: number } | null;
  pointsCalculatedAt: string | null;
};

export default function TournamentPicksPage() {
  const params = useParams();
  const router = useRouter();
  const tournId = params.tournId as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [tiers, setTiers] = useState<ApiTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState<Record<string, string | null>>({});
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [lockedAt, setLockedAt] = useState<string | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [showLockModal, setShowLockModal] = useState(false);
  const [nextTournament, setNextTournament] = useState<Tournament | null>(null);
  const [picksLoading, setPicksLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [pointsAwarded, setPointsAwarded] = useState<number | null>(null);
  const [scoring, setScoring] = useState<{ playerScores: PlayerScoring[]; totalPoints: number } | null>(null);

  // Reactive clock — ticks every 30s so the countdown stays live
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Fetch next upcoming tournament for countdown
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.golf.getTournaments();
        if (cancelled || !res.success || !res.data) return;
        const data = res.data as { upcoming: Tournament[]; live: Tournament[]; completed: Tournament[] };
        
        // Find the next upcoming tournament (earliest start date)
        const upcoming = data.upcoming || [];
        if (upcoming.length > 0) {
          const sorted = [...upcoming].sort((a, b) => {
            const dateA = new Date(a.startDate).getTime();
            const dateB = new Date(b.startDate).getTime();
            return dateA - dateB;
          });
          setNextTournament(sorted[0]);
        }
      } catch {
        /* silent */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load persisted picks from DB once tournId is known
  useEffect(() => {
    if (!tournId) return;
    let cancelled = false;
    (async () => {
      setPicksLoading(true);
      
      // Check cache first
      const cached = picksCache[tournId];
      const now = Date.now();
      if (cached && (now - cached.timestamp) < PICKS_CACHE_DURATION) {
        setPicks(cached.picks);
        setSavedAt(cached.submittedAt);
        setLockedAt(cached.lockedAt);
        setPicksLoading(false);
        return;
      }
      
      try {
        const res = await api.golf.getPicks(tournId);
        if (cancelled || !res.success || !res.data) return;
        const d = res.data as PicksResponse;
        const picks = d.picks || {};
        const submittedAt = d.submittedAt ?? null;
        const lockedAt = d.lockedAt ?? null;

        setPicks(picks);
        setSavedAt(submittedAt);
        setLockedAt(lockedAt);
        setPointsAwarded(d.pointsAwarded);
        setScoring(d.scoring);

        // Update cache
        picksCache[tournId] = { picks, submittedAt, lockedAt, timestamp: Date.now() };
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setPicksLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tournId]);

  const startTs = tournament?.startDate ? new Date(tournament.startDate).getTime() : 0;
  const msRemaining = startTs ? Math.max(0, startTs - now) : 0;
  const timeLocked = startTs > 0 && now >= startTs;
  const statusLocked = tournament?.status === "live" || tournament?.status === "completed";
  const userLocked = !!lockedAt;
  const isLocked = statusLocked || timeLocked || userLocked;

  // Single call: tournament meta + tiers + leaderboard
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Check cache first
      const cached = fantasyCache[tournId];
      const now = Date.now();
      if (cached && (now - cached.timestamp) < FANTASY_CACHE_DURATION) {
        setTournament(cached.tournament);
        setTiers(cached.tiers);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const res = await api.golf.getTournamentFantasy(tournId);
        if (cancelled) return;
        if (res.success && res.data) {
          const data = res.data as FantasyData;
          setTournament(data.tournament);
          setTiers(Array.isArray(data.tiers) ? data.tiers : []);
          setLeaderboard(data.leaderboard || null);
          
          // Update cache
          fantasyCache[tournId] = {
            tournament: data.tournament,
            tiers: Array.isArray(data.tiers) ? data.tiers : [],
            timestamp: Date.now()
          };
        }
      } catch {
        // silently fail — tiers stays empty, UI shows empty-state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tournId]);

  const selectedCount = Object.values(picks).filter(Boolean).length;
  const totalPicks = 5;

  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const handleSave = async () => {
    if (isLocked || selectedCount === 0 || busy) return;
    setBusy(true);
    try {
      const res = await api.golf.savePicks(tournId, picks);
      if (res.success && res.data) {
        const d = res.data as PicksResponse;
        setSavedAt(d.submittedAt);
        setLockedAt(d.lockedAt ?? null);
        toast.success(`Picks saved · ${selectedCount}/${totalPicks}`);
      } else {
        toast.error(res.message || "Failed to save picks");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Network error");
    } finally {
      setBusy(false);
    }
  };

  const handleLockClick = () => {
    if (isLocked || selectedCount < totalPicks || busy) return;
    setShowLockModal(true);
  };

  const handleLockConfirm = async () => {
    setShowLockModal(false);
    setBusy(true);
    try {
      const res = await api.golf.lockPicks(tournId, picks);
      if (res.success && res.data) {
        const d = res.data as PicksResponse;
        setSavedAt(d.submittedAt);
        setLockedAt(d.lockedAt ?? null);
        toast.success("Picks locked · Good luck!");
      } else {
        toast.error(res.message || "Failed to lock picks");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Network error");
    } finally {
      setBusy(false);
    }
  };

  const handleLockCancel = () => {
    setShowLockModal(false);
  };

  const lockReason = useMemo(() => {
    if (statusLocked) return `Tournament is ${tournament?.status === "live" ? "live" : "completed"} · Picks are locked`;
    if (timeLocked) return "Round 1 has started · Picks are locked";
    if (userLocked) return `Locked ${formatRelative(lockedAt!)}`;
    return null;
  }, [statusLocked, timeLocked, userLocked, lockedAt, tournament?.status]);

  return (
    <div style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
      <div style={{ marginBottom: "clamp(16px, 3vw, 24px)" }}>
        <button
          onClick={() => router.back()}
          className="flex items-center"
          style={{
            gap: "6px",
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
            fontSize: "clamp(12px, 1.5vw, 13px)",
            fontFamily: "var(--font-poppins), sans-serif",
            padding: "0",
            marginBottom: "clamp(8px, 2vw, 12px)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Tournaments
        </button>

        <div className="flex flex-col gap-3" style={{ gap: "clamp(8px, 2vw, 12px)" }}>
          <div className="flex items-center justify-between">
            <div>
              <div
                className="tracking-wide"
                style={{
                  fontSize: "clamp(16px, 3vw, 25px)",
                  color: "#E8C96A",
                  fontWeight: 400,
                }}
              >
                Fantasy Golf — {tournament?.name || "Tournament"}
              </div>
              <div
                className="mt-1"
                style={{
                  fontSize: "clamp(12px, 1.8vw, 16px)",
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
            <div className="hidden sm:flex items-center gap-4" style={{ gap: "clamp(8px, 2vw, 16px)" }}>
              <span
                style={{
                  color: "#E8C96A",
                  fontSize: "clamp(14px, 2vw, 18px)",
                  fontWeight: 500,
                }}
              >
                {selectedCount}/{totalPicks} Picks
              </span>
              {isLocked && (
                <span
                  style={{
                    fontSize: "clamp(10px, 1.5vw, 12px)",
                    fontWeight: 600,
                    backgroundColor: "#FF6B6B",
                    color: "#060D1F",
                    padding: "clamp(3px, 0.5vw, 4px) clamp(8px, 1.5vw, 10px)",
                    borderRadius: "5px",
                  }}
                >
                  LOCKED
                </span>
              )}
            </div>
          </div>
          <div className="flex sm:hidden items-center gap-4" style={{ gap: "clamp(8px, 2vw, 16px)" }}>
            <span
              style={{
                color: "#E8C96A",
                fontSize: "clamp(14px, 2vw, 18px)",
                fontWeight: 500,
              }}
            >
              {selectedCount}/{totalPicks} Picks
            </span>
            {isLocked && (
              <span
                style={{
                  fontSize: "clamp(10px, 1.5vw, 12px)",
                  fontWeight: 600,
                  backgroundColor: "#FF6B6B",
                  color: "#060D1F",
                  padding: "clamp(3px, 0.5vw, 4px) clamp(8px, 1.5vw, 10px)",
                  borderRadius: "5px",
                }}
              >
                LOCKED
              </span>
            )}
          </div>
        </div>
      </div>

      {loading || picksLoading ? (
        <div
          style={{
            backgroundColor: "#13192A",
            borderRadius: "5px",
            padding: "40px 20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid rgba(232,201,106,0.2)",
              borderTop: "3px solid #E8C96A",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>
            {picksLoading && !loading ? "Loading picks..." : "Loading players..."}
          </div>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : tiers.length > 0 ? (
        isLocked ? (
          <LockedPicksTable tiers={tiers} picks={picks} />
        ) : (
          <TierPlayerList
            tiers={tiers}
            selectedPicks={picks}
            onPlayerSelect={(tierName, player) => {
              setPicks((prev) => ({ ...prev, [tierName]: player.playerId }));
            }}
          />
        )
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

      {/* Your Points (completed tournaments) — shown above the final leaderboard
          so users see their result first, before scanning the full board. */}
      {tournament?.status === "completed" && pointsAwarded !== null && scoring && (
        <div style={{ marginTop: "clamp(16px, 3vw, 24px)" }}>
          <div
            style={{
              fontSize: "clamp(16px, 2.5vw, 20px)",
              color: "#E8C96A",
              fontWeight: 600,
              marginBottom: "clamp(12px, 2vw, 16px)",
            }}
          >
            Your Points
          </div>
          <div
            style={{
              backgroundColor: "#13192A",
              borderRadius: "5px",
              padding: "clamp(16px, 2.5vw, 20px)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: "12px",
                paddingBottom: "12px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                marginBottom: "12px",
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>
                Total earned
              </span>
              <span style={{ color: "#E8C96A", fontSize: "22px", fontWeight: 700 }}>
                +{pointsAwarded.toLocaleString()} pts
              </span>
            </div>
            {scoring.playerScores.length === 0 ? (
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", textAlign: "center", padding: "8px 0" }}>
                No player picks matched the final leaderboard.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "8px 4px", textAlign: "left", color: "rgba(232,201,106,0.8)", fontSize: "11px", fontWeight: 600 }}>Tier</th>
                      <th style={{ padding: "8px 4px", textAlign: "left", color: "rgba(232,201,106,0.8)", fontSize: "11px", fontWeight: 600 }}>Player</th>
                      <th style={{ padding: "8px 4px", textAlign: "center", color: "rgba(232,201,106,0.8)", fontSize: "11px", fontWeight: 600 }}>Score</th>
                      <th style={{ padding: "8px 4px", textAlign: "right", color: "rgba(232,201,106,0.8)", fontSize: "11px", fontWeight: 600 }}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoring.playerScores.map((ps, idx) => (
                      <tr key={idx} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "10px 4px", color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>{ps.tier}</td>
                        <td style={{ padding: "10px 4px", color: "#FFF", fontSize: "13px", fontWeight: 500 }}>{ps.playerName}</td>
                        <td style={{ padding: "10px 4px", textAlign: "center", color: "#FFF", fontSize: "13px" }}>{ps.score}</td>
                        <td style={{ padding: "10px 4px", textAlign: "right", color: ps.points > 0 ? "#4ADE80" : "rgba(255,255,255,0.4)", fontSize: "13px", fontWeight: 600 }}>
                          {ps.points > 0 ? `+${ps.points}` : 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Final Leaderboard (completed tournaments only — live leaderboard lives on the Live tab) */}
      {tournament?.status === "completed" && leaderboard && Array.isArray(leaderboard) && leaderboard.length > 0 && (
        <div style={{ marginTop: "clamp(16px, 3vw, 24px)" }}>
          <div
            style={{
              fontSize: "clamp(16px, 2.5vw, 20px)",
              color: "#E8C96A",
              fontWeight: 600,
              marginBottom: "clamp(12px, 2vw, 16px)",
            }}
          >
            Final Leaderboard
          </div>
          <div
            style={{
              backgroundColor: "#13192A",
              borderRadius: "5px",
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "480px" }}>
                <thead>
                  <tr style={{ backgroundColor: "rgba(232,201,106,0.1)" }}>
                    <th style={{ padding: "clamp(8px, 2vw, 12px)", textAlign: "left", color: "#E8C96A", fontSize: "12px", fontWeight: 600 }}>Pos</th>
                    <th style={{ padding: "clamp(8px, 2vw, 12px)", textAlign: "left", color: "#E8C96A", fontSize: "12px", fontWeight: 600, minWidth: "120px" }}>Player</th>
                    <th style={{ padding: "clamp(8px, 2vw, 12px)", textAlign: "center", color: "#E8C96A", fontSize: "12px", fontWeight: 600 }}>Score</th>
                    <th style={{ padding: "clamp(8px, 2vw, 12px)", textAlign: "center", color: "#E8C96A", fontSize: "12px", fontWeight: 600 }}>Thru</th>
                    <th style={{ padding: "clamp(8px, 2vw, 12px)", textAlign: "center", color: "#E8C96A", fontSize: "12px", fontWeight: 600 }}>Today</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.slice(0, 20).map((player: any, idx: number) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                      }}
                    >
                      <td style={{ padding: "clamp(8px, 2vw, 12px)", color: "#FFF", fontSize: "13px" }}>{player.position || "-"}</td>
                      <td style={{ padding: "clamp(8px, 2vw, 12px)", color: "#FFF", fontSize: "13px", fontWeight: 500 }}>
                        {player.firstName} {player.lastName}
                      </td>
                      <td style={{ padding: "clamp(8px, 2vw, 12px)", textAlign: "center", color: "#E8C96A", fontSize: "13px", fontWeight: 600 }}>
                        {player.totalScore || "E"}
                      </td>
                      <td style={{ padding: "clamp(8px, 2vw, 12px)", textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>
                        {player.thru || "-"}
                      </td>
                      <td style={{ padding: "clamp(8px, 2vw, 12px)", textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>
                        {player.today || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tiers.length > 0 && !isLocked && !picksLoading && (
        <div style={{ marginTop: "clamp(16px, 3vw, 20px)", display: "flex", flexDirection: "column", gap: "clamp(8px, 1.5vw, 10px)" }}>
          <div className="flex flex-col sm:flex-row" style={{ gap: "clamp(8px, 1.5vw, 10px)" }}>
            <button
              onClick={handleSave}
              disabled={isLocked || selectedCount === 0 || busy}
              style={{
                flex: 1,
                height: "clamp(44px, 6vw, 52px)",
                backgroundColor: isLocked || selectedCount === 0 ? "rgba(255,255,255,0.06)" : "rgba(232,201,106,0.15)",
                color: isLocked || selectedCount === 0 ? "rgba(255,255,255,0.25)" : "#E8C96A",
                fontSize: "clamp(13px, 1.8vw, 14px)",
                fontWeight: 600,
                fontFamily: "var(--font-poppins), sans-serif",
                border: isLocked || selectedCount === 0 ? "1.5px solid rgba(255,255,255,0.08)" : "1.5px solid #E8C96A",
                borderRadius: "5px",
                cursor: isLocked || selectedCount === 0 || busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.6 : 1,
                transition: "all 0.2s ease",
              }}
            >
              {busy ? "Saving..." : savedAt && !isLocked ? "Update Picks" : "Save Picks"}
            </button>
            <button
              onClick={handleLockClick}
              disabled={isLocked || selectedCount < totalPicks || busy}
              style={{
                flex: 1,
                height: "clamp(44px, 6vw, 52px)",
                backgroundColor:
                  isLocked
                    ? "rgba(255,255,255,0.06)"
                    : selectedCount < totalPicks
                    ? "transparent"
                    : "#E8C96A",
                color:
                  isLocked
                    ? "rgba(255,255,255,0.25)"
                    : selectedCount < totalPicks
                    ? "rgba(232,201,106,0.7)"
                    : "#060D1F",
                fontSize: "clamp(13px, 1.8vw, 14px)",
                fontWeight: 600,
                fontFamily: "var(--font-poppins), sans-serif",
                border:
                  isLocked
                    ? "1.5px solid rgba(255,255,255,0.08)"
                    : selectedCount < totalPicks
                    ? "1.5px dashed rgba(232,201,106,0.5)"
                    : "1.5px solid #E8C96A",
                borderRadius: "5px",
                cursor: isLocked || selectedCount < totalPicks || busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.6 : 1,
                boxShadow:
                  !isLocked && selectedCount === totalPicks && !busy
                    ? "0 4px 14px rgba(232,201,106,0.35)"
                    : "none",
                transition: "all 0.2s ease",
              }}
            >
              {busy
                ? "Working..."
                : isLocked
                ? "Picks Locked"
                : selectedCount < totalPicks
                ? `Pick ${totalPicks - selectedCount} more to Lock (${selectedCount}/${totalPicks})`
                : `Lock Picks (${selectedCount}/${totalPicks})`}
            </button>
          </div>

          {!isLocked && tournament?.startDate && (
            <div
              style={{
                fontSize: "clamp(11px, 1.5vw, 12px)",
                color: "rgba(255,255,255,0.4)",
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <span>
                Round 1 starts in{" "}
                <span style={{ color: "#E8C96A", fontWeight: 500 }}>{formatCountdown(msRemaining)}</span>
              </span>
              {savedAt && <span style={{ color: "rgba(255,255,255,0.3)" }}>· Saved {formatRelative(savedAt)}</span>}
            </div>
          )}

          {isLocked && lockReason && (
            <div style={{ fontSize: "clamp(11px, 1.5vw, 12px)", color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
              {lockReason}
            </div>
          )}

          {isLocked && nextTournament && nextTournament.startDate && (() => {
            const nextStartTs = new Date(nextTournament.startDate).getTime();
            const nextMsRemaining = Math.max(0, nextStartTs - now);
            return nextMsRemaining > 0 ? (
              <div
                style={{
                  marginTop: "clamp(8px, 2vw, 12px)",
                  padding: "clamp(12px, 2vw, 16px)",
                  backgroundColor: "rgba(232,201,106,0.08)",
                  border: "1px solid rgba(232,201,106,0.2)",
                  borderRadius: "5px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "clamp(10px, 1.5vw, 11px)", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>
                  Next Tournament
                </div>
                <div style={{ fontSize: "clamp(12px, 1.8vw, 13px)", color: "#E8C96A", fontWeight: 600, marginBottom: "4px" }}>
                  {nextTournament.name}
                </div>
                <div style={{ fontSize: "clamp(11px, 1.5vw, 12px)", color: "rgba(255,255,255,0.6)" }}>
                  Unlocks in <span style={{ color: "#E8C96A", fontWeight: 500 }}>{formatCountdown(nextMsRemaining)}</span>
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {showLockModal && (
        <LockConfirmModal
          onConfirm={handleLockConfirm}
          onCancel={handleLockCancel}
          selectedCount={selectedCount}
          totalPicks={totalPicks}
        />
      )}
    </div>
  );
}
