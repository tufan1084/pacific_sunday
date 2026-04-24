"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { Tournament } from "@/app/types/fantasy";

// Shape of the /fantasy endpoint response (leaderboard is denormalized in DB JSONB)
type FantasyLeaderboardRow = {
  playerId: string;
  position: string;
  name: string;
  country: string;
  score: string;
  status: string;
  thru: string;
  currentRoundScore?: string;
  rounds: string[];
  totalStrokes: string;
};
type CompletedResults = {
  courseName: string | null;
  rows: FantasyLeaderboardRow[];
};
import { api } from "@/app/services/api";

interface TournamentSectionProps {
  completed: Tournament[];
  live: Tournament[];
  upcoming: Tournament[];
  selectedTournId: string | null;
  onSelect: (tournId: string) => void;
  loading?: boolean;
  availableTournId?: string | null;
}

const TABS = ["live", "upcoming", "completed"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  live: "Live",
  upcoming: "Upcoming",
  completed: "Completed",
};

// DB stores UTC; UI always renders in Pacific Time so tournament days line up
// with the PGA's Thu–Sun schedule regardless of the viewer's timezone.
function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Los_Angeles" });
}

function getCountryFlag(country: string) {
  if (!country || country.length !== 2) return null;
  const code = country.toUpperCase();
  const offset = 127397;
  return String.fromCodePoint(...[...code].map((c) => c.charCodeAt(0) + offset));
}

function getScoreColor(player: FantasyLeaderboardRow) {
  if (player.status === "cut" || player.position === "CUT") return "#FF6B6B";
  if (player.score.startsWith("-")) return "#4ADE80";
  if (player.score === "E") return "rgba(255,255,255,0.5)";
  return "#FF6B6B";
}

const dividerStyle = {
  height: "1px",
  backgroundColor: "rgba(255,255,255,0.08)",
  margin: "0",
};

export default function TournamentSection({
  completed,
  live,
  upcoming,
  selectedTournId,
  onSelect,
  loading,
  availableTournId,
}: TournamentSectionProps) {
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");

  // Update active tab when data loads
  useEffect(() => {
    if (!loading) {
      if (live.length > 0) {
        setActiveTab("live");
      } else if (upcoming.length > 0) {
        setActiveTab("upcoming");
      } else if (completed.length > 0) {
        setActiveTab("completed");
      }
    }
  }, [loading, live.length, upcoming.length, completed.length]);

  // Expanded completed tournament state
  const [expandedTournId, setExpandedTournId] = useState<string | null>(null);
  const [resultsData, setResultsData] = useState<Record<string, CompletedResults>>({});
  const [resultsLoading, setResultsLoading] = useState<string | null>(null);
  const [liveLeaderboards, setLiveLeaderboards] = useState<Record<string, CompletedResults>>({});
  const [liveLoading, setLiveLoading] = useState<Record<string, boolean>>({});

  // Track which upcoming tournaments have picks
  const [tournamentsWithPicks, setTournamentsWithPicks] = useState<Set<string>>(new Set());
  // Mobile leaderboard: track which player cards are expanded (to show R1–R4).
  // Keyed by `${tournId}:${playerId-or-index}` so two tournaments don't collide.
  const [expandedLbRows, setExpandedLbRows] = useState<Set<string>>(new Set());
  const toggleLbRow = (key: string) => {
    setExpandedLbRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };
  const [picksLoading, setPicksLoading] = useState(true);

  // Find the next upcoming tournament (earliest start date)
  const nextUpcomingTournament = useMemo(() => {
    if (upcoming.length === 0) return null;
    const sorted = [...upcoming].sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      return dateA - dateB;
    });
    return sorted[0];
  }, [upcoming]);

  // Fetch picks only for the next upcoming tournament
  useEffect(() => {
    const fetchPicks = async () => {
      if (!nextUpcomingTournament) {
        setPicksLoading(false);
        return;
      }

      try {
        const res = await api.golf.getPicks(nextUpcomingTournament.tournId);
        if (res.success && res.data && res.data.picks) {
          const picksCount = Object.values(res.data.picks).filter(Boolean).length;
          if (picksCount > 0) {
            setTournamentsWithPicks(new Set([nextUpcomingTournament.tournId]));
          }
        }
      } catch {
        // Silent fail
      } finally {
        setPicksLoading(false);
      }
    };

    fetchPicks();
  }, [nextUpcomingTournament]);

  // Fetch live leaderboard + course name per live tournament. Backend returns
  // `leaderboard` as a flat row array (or null), matching the detail-page contract.
  useEffect(() => {
    const fetchLiveData = async () => {
      if (live.length === 0) return;

      for (const tournament of live) {
        if (liveLeaderboards[tournament.tournId]) continue; // Already loaded

        setLiveLoading(prev => ({ ...prev, [tournament.tournId]: true }));
        try {
          const res = await api.golf.getTournamentFantasy(tournament.tournId);
          if (res.success && res.data) {
            const d = res.data as {
              tournament: { courseName: string | null };
              leaderboard: FantasyLeaderboardRow[] | null;
            };
            const rows = Array.isArray(d.leaderboard) ? d.leaderboard : [];
            setLiveLeaderboards(prev => ({ ...prev, [tournament.tournId]: { courseName: d.tournament.courseName, rows } }));
          }
        } catch {
          // Silent fail
        } finally {
          setLiveLoading(prev => ({ ...prev, [tournament.tournId]: false }));
        }
      }
    };

    fetchLiveData();
  }, [live]);

  const lists: Record<Tab, Tournament[]> = { live, upcoming, completed };
  const events = lists[activeTab];

  const handleCompletedClick = async (tournId: string) => {
    if (expandedTournId === tournId) {
      setExpandedTournId(null);
      return;
    }
    setExpandedTournId(tournId);
    if (resultsData[tournId]) return;

    setResultsLoading(tournId);
    try {
      const res = await api.golf.getTournamentFantasy(tournId);
      if (res.success && res.data) {
        const d = res.data as { tournament: { courseName: string | null }; leaderboard: FantasyLeaderboardRow[] | null };
        const rows = Array.isArray(d.leaderboard) ? d.leaderboard : [];
        setResultsData((prev) => ({ ...prev, [tournId]: { courseName: d.tournament.courseName, rows } }));
      }
    } catch {
      // silently fail
    } finally {
      setResultsLoading(null);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#13192A",
        borderRadius: "5px",
        padding: "clamp(16px, 2vw, 20px)",
        marginBottom: "24px",
        fontFamily: "var(--font-poppins), sans-serif",
      }}
    >
      {/* Tabs + timezone hint (all dates rendered in Pacific Time — label flips PDT/PST with DST) */}
      <div
        className="flex"
        style={{
          gap: "4px",
          marginBottom: "16px",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          rowGap: "8px",
        }}
      >
        <div className="flex" style={{ gap: "4px", flexWrap: "wrap" }}>
          {TABS.map((tab) => {
            const count = lists[tab].length;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "clamp(6px, 1.2vw, 8px) clamp(10px, 2.5vw, 16px)",
                  borderRadius: "5px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "clamp(11px, 1.5vw, 13px)",
                  fontWeight: 500,
                  fontFamily: "var(--font-poppins), sans-serif",
                  backgroundColor: isActive ? "#E8C96A" : "rgba(255,255,255,0.06)",
                  color: isActive ? "#060D1F" : "rgba(255,255,255,0.5)",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {TAB_LABELS[tab]}
                {tab === "live" && count > 0 && (
                  <span
                    style={{
                      display: "inline-block",
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: isActive ? "#060D1F" : "#4ADE80",
                      marginLeft: "6px",
                      verticalAlign: "middle",
                    }}
                  />
                )}
                {count > 0 && (
                  <span style={{ marginLeft: "6px", opacity: 0.7 }}>({count})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "40px 0" }}>
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
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Empty */}
      {!loading && events.length === 0 && (
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", padding: "20px 0", textAlign: "center" }}>
          No {activeTab} tournaments
        </div>
      )}

      {/* Event list - Table format for upcoming */}
      {!loading && events.length > 0 && activeTab === "upcoming" && (
        <>
          {/* Desktop Table */}
          <div
            className="hidden md:block"
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              borderRadius: "5px",
              overflow: "hidden",
            }}
          >
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <th
                    style={{
                      padding: "clamp(10px, 2vw, 14px) clamp(12px, 3vw, 16px)",
                      textAlign: "left",
                      color: "rgba(255,255,255,0.6)",
                      fontSize: "clamp(10px, 1.5vw, 12px)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Tournament
                  </th>
                  <th
                    style={{
                      padding: "clamp(10px, 2vw, 14px) clamp(12px, 3vw, 16px)",
                      textAlign: "left",
                      color: "rgba(255,255,255,0.6)",
                      fontSize: "clamp(10px, 1.5vw, 12px)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Dates
                  </th>
                  <th
                    style={{
                      padding: "clamp(10px, 2vw, 14px) clamp(12px, 3vw, 16px)",
                      textAlign: "center",
                      color: "rgba(255,255,255,0.6)",
                      fontSize: "clamp(10px, 1.5vw, 12px)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const isNextUpcoming = nextUpcomingTournament?.tournId === event.tournId;
                  const hasData = event.tournId === availableTournId;
                  const hasPicks = tournamentsWithPicks.has(event.tournId);
                  const disabled = !isNextUpcoming || (!hasData && !hasPicks);
                  
                  let buttonText = "Pick Players";
                  let buttonColor = "#E8C96A";
                  
                  if (!isNextUpcoming) {
                    buttonText = "Coming Soon";
                  } else if (hasPicks) {
                    buttonText = "View Picks";
                    buttonColor = "#E8C96A";
                  } else if (disabled) {
                    buttonText = "Coming Soon";
                  }

                  return (
                    <tr
                      key={event.tournId}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(232,201,106,0.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <td
                        style={{
                          padding: "10px 16px",
                        }}
                      >
                        <div className="flex items-center" style={{ gap: "8px" }}>
                          <span
                            style={{
                              color: "#FFFFFF",
                              fontWeight: 500,
                              fontSize: "clamp(12px, 1.5vw, 14px)",
                            }}
                          >
                            {event.name}
                          </span>
                          {event.isMajor && (
                            <span
                              style={{
                                fontSize: "9px",
                                fontWeight: 600,
                                backgroundColor: "#E8C96A",
                                color: "#060D1F",
                                padding: "2px 6px",
                                borderRadius: "3px",
                                flexShrink: 0,
                              }}
                            >
                              MAJOR
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "10px 16px",
                          color: "rgba(255,255,255,0.6)",
                          fontSize: "clamp(11px, 1.5vw, 13px)",
                        }}
                      >
                        {formatDate(event.startDate)}{event.endDate && `–${formatDate(event.endDate)}`}
                      </td>
                      <td
                        style={{
                          padding: "10px 16px",
                          textAlign: "center",
                        }}
                      >
                        <button
                          disabled={disabled}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!disabled) onSelect(event.tournId);
                          }}
                          style={{
                            padding: "6px 16px",
                            borderRadius: "5px",
                            border: "none",
                            cursor: disabled ? "not-allowed" : "pointer",
                            fontSize: "clamp(11px, 1.5vw, 12px)",
                            fontWeight: 600,
                            fontFamily: "var(--font-poppins), sans-serif",
                            backgroundColor: disabled ? "rgba(255,255,255,0.08)" : buttonColor,
                            color: disabled ? "rgba(255,255,255,0.3)" : "#060D1F",
                            whiteSpace: "nowrap",
                            transition: "all 0.2s ease",
                            opacity: disabled ? 0.6 : 1,
                          }}
                        >
                          {buttonText}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {events.map((event) => {
            const isNextUpcoming = nextUpcomingTournament?.tournId === event.tournId;
            const hasData = event.tournId === availableTournId;
            const hasPicks = tournamentsWithPicks.has(event.tournId);
            const disabled = !isNextUpcoming || (!hasData && !hasPicks);
            
            let buttonText = "Pick Players";
            let buttonColor = "#E8C96A";
            
            if (!isNextUpcoming) {
              buttonText = "Coming Soon";
            } else if (hasPicks) {
              buttonText = "View Picks";
              buttonColor = "#E8C96A";
            } else if (disabled) {
              buttonText = "Coming Soon";
            }

            return (
              <div
                key={event.tournId}
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderRadius: "5px",
                  padding: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center" style={{ gap: "6px", marginBottom: "4px", flexWrap: "wrap" }}>
                    <span style={{ color: "#FFFFFF", fontWeight: 500, fontSize: "14px" }}>
                      {event.name}
                    </span>
                    {event.isMajor && (
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 600,
                          backgroundColor: "#E8C96A",
                          color: "#060D1F",
                          padding: "2px 6px",
                          borderRadius: "3px",
                          flexShrink: 0,
                        }}
                      >
                        MAJOR
                      </span>
                    )}
                    <span className="hidden sm:inline" style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginLeft: "4px" }}>
                      {formatDate(event.startDate)}{event.endDate && `–${formatDate(event.endDate)}`}
                    </span>
                  </div>
                  <div className="sm:hidden" style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>
                    {formatDate(event.startDate)}{event.endDate && `–${formatDate(event.endDate)}`}
                  </div>
                </div>
                <button
                  disabled={disabled}
                  onClick={() => !disabled && onSelect(event.tournId)}
                  style={{
                    padding: "6px clamp(10px, 3vw, 14px)",
                    borderRadius: "5px",
                    border: "none",
                    cursor: disabled ? "not-allowed" : "pointer",
                    fontSize: "clamp(11px, 2vw, 12px)",
                    fontWeight: 600,
                    fontFamily: "var(--font-poppins), sans-serif",
                    backgroundColor: disabled ? "rgba(255,255,255,0.08)" : buttonColor,
                    color: disabled ? "rgba(255,255,255,0.3)" : "#060D1F",
                    transition: "all 0.2s ease",
                    opacity: disabled ? 0.6 : 1,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {buttonText}
                </button>
              </div>
            );
          })}
        </div>
      </>
      )}

      {/* Event list - Table format for live */}
      {!loading && events.length > 0 && activeTab === "live" && (
        <>
          {/* Desktop Table */}
          <div
            className="hidden md:block"
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              borderRadius: "5px",
              overflow: "hidden",
            }}
          >
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <th
                    style={{
                      padding: "clamp(10px, 2vw, 14px) clamp(12px, 3vw, 16px)",
                      textAlign: "left",
                      color: "rgba(255,255,255,0.6)",
                      fontSize: "clamp(10px, 1.5vw, 12px)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Tournament
                  </th>
                  <th
                    style={{
                      padding: "clamp(10px, 2vw, 14px) clamp(12px, 3vw, 16px)",
                      textAlign: "left",
                      color: "rgba(255,255,255,0.6)",
                      fontSize: "clamp(10px, 1.5vw, 12px)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Dates
                  </th>
                  <th
                    style={{
                      padding: "clamp(10px, 2vw, 14px) clamp(12px, 3vw, 16px)",
                      textAlign: "center",
                      color: "rgba(255,255,255,0.6)",
                      fontSize: "clamp(10px, 1.5vw, 12px)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const leaderboard = liveLeaderboards[event.tournId];
                  const isLoading = liveLoading[event.tournId];

                  return (
                    <React.Fragment key={event.tournId}>
                      <tr
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                          transition: "background-color 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(74,222,128,0.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <td
                          style={{
                            padding: "clamp(12px, 2vw, 16px)",
                          }}
                        >
                          <div className="flex items-center" style={{ gap: "8px" }}>
                            <span
                              style={{
                                color: "#FFFFFF",
                                fontWeight: 500,
                                fontSize: "clamp(12px, 1.5vw, 14px)",
                              }}
                            >
                              {event.name}
                            </span>
                            {event.isMajor && (
                              <span
                                style={{
                                  fontSize: "9px",
                                  fontWeight: 600,
                                  backgroundColor: "#E8C96A",
                                  color: "#060D1F",
                                  padding: "2px 6px",
                                  borderRadius: "3px",
                                  flexShrink: 0,
                                }}
                              >
                                MAJOR
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: "9px",
                                fontWeight: 600,
                                backgroundColor: "#4ADE80",
                                color: "#060D1F",
                                padding: "2px 6px",
                                borderRadius: "3px",
                                flexShrink: 0,
                              }}
                            >
                              LIVE
                            </span>
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "clamp(12px, 2vw, 16px)",
                            color: "rgba(255,255,255,0.6)",
                            fontSize: "clamp(11px, 1.5vw, 13px)",
                          }}
                        >
                          {formatDate(event.startDate)}{event.endDate && `–${formatDate(event.endDate)}`}
                        </td>
                        <td
                          style={{
                            padding: "clamp(12px, 2vw, 16px)",
                            textAlign: "center",
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelect(event.tournId);
                            }}
                            style={{
                              padding: "6px 16px",
                              borderRadius: "5px",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "clamp(11px, 1.5vw, 12px)",
                              fontWeight: 600,
                              fontFamily: "var(--font-poppins), sans-serif",
                              backgroundColor: "#4ADE80",
                              color: "#060D1F",
                              whiteSpace: "nowrap",
                              transition: "all 0.2s ease",
                            }}
                          >
                            View Picks
                          </button>
                        </td>
                      </tr>

                      {/* Live Leaderboard Row — also shown while waiting for first tee so
                          users see the state instead of an invisible section. */}
                      {(leaderboard || isLoading) && (
                        <tr>
                          <td colSpan={3} style={{ padding: 0, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ backgroundColor: "rgba(74,222,128,0.03)", padding: "16px" }}>
                              <div style={{ fontSize: "14px", color: "#4ADE80", fontWeight: 600, marginBottom: "12px" }}>Live Leaderboard</div>
                              {isLoading ? (
                                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", textAlign: "center", padding: "16px 0" }}>
                                  Loading leaderboard...
                                </div>
                              ) : !leaderboard || leaderboard.rows.length === 0 ? (
                                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
                                  Waiting for first tee off · leaderboard updates hourly once play begins
                                </div>
                              ) : (
                                <div>
                                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                                    <thead>
                                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                        <th style={{ padding: "8px 4px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Pos</th>
                                        <th style={{ padding: "8px 8px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase", minWidth: "120px" }}>Name</th>
                                        <th style={{ padding: "8px 6px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>R1</th>
                                        <th style={{ padding: "8px 6px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>R2</th>
                                        <th style={{ padding: "8px 6px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>R3</th>
                                        <th style={{ padding: "8px 6px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>R4</th>
                                        <th style={{ padding: "8px 6px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Total</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {leaderboard.rows.map((player, i) => {
                                        const flag = getCountryFlag(player.country);
                                        const isLeader = i === 0;
                                        const round = (n: number) => player.rounds?.[n] || "-";
                                        return (
                                          <tr key={player.playerId || i} style={{ borderBottom: i < leaderboard.rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                                            <td style={{ padding: "10px 4px", color: isLeader ? "#4ADE80" : "rgba(255,255,255,0.5)", fontWeight: isLeader ? 600 : 400, fontSize: "12px" }}>
                                              {player.position}
                                            </td>
                                            <td style={{ padding: "10px 8px" }}>
                                              <div className="flex items-center" style={{ gap: "6px" }}>
                                                {isLeader && <span style={{ fontSize: "14px" }}>🏆</span>}
                                                <span style={{ color: isLeader ? "#4ADE80" : "#FFFFFF", fontWeight: isLeader ? 600 : 400 }}>
                                                  {player.name}
                                                </span>
                                                {flag && <span style={{ fontSize: "11px" }}>{flag}</span>}
                                              </div>
                                            </td>
                                            <td style={{ padding: "10px 6px", textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: "11px" }}>{round(0)}</td>
                                            <td style={{ padding: "10px 6px", textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: "11px" }}>{round(1)}</td>
                                            <td style={{ padding: "10px 6px", textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: "11px" }}>{round(2)}</td>
                                            <td style={{ padding: "10px 6px", textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: "11px" }}>{round(3)}</td>
                                            <td style={{ padding: "10px 6px", textAlign: "center", color: getScoreColor(player), fontWeight: 600 }}>
                                              {player.score}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                  {leaderboard.courseName && (
                                    <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px", textAlign: "center", marginTop: "12px" }}>
                                      {leaderboard.courseName}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {events.map((event) => {
            const leaderboard = liveLeaderboards[event.tournId];
            const isLoading = liveLoading[event.tournId];

            return (
              <div key={event.tournId} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    borderRadius: "5px",
                    padding: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center" style={{ gap: "6px", marginBottom: "4px", flexWrap: "wrap" }}>
                      <span style={{ color: "#FFFFFF", fontWeight: 500, fontSize: "14px" }}>
                        {event.name}
                      </span>
                      {event.isMajor && (
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: 600,
                            backgroundColor: "#E8C96A",
                            color: "#060D1F",
                            padding: "2px 6px",
                            borderRadius: "3px",
                            flexShrink: 0,
                          }}
                        >
                          MAJOR
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 600,
                          backgroundColor: "#4ADE80",
                          color: "#060D1F",
                          padding: "2px 6px",
                          borderRadius: "3px",
                          flexShrink: 0,
                        }}
                      >
                        LIVE
                      </span>
                      <span className="hidden sm:inline" style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginLeft: "4px" }}>
                        {formatDate(event.startDate)}{event.endDate && `–${formatDate(event.endDate)}`}
                      </span>
                    </div>
                    <div className="sm:hidden" style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>
                      {formatDate(event.startDate)}{event.endDate && `–${formatDate(event.endDate)}`}
                    </div>
                  </div>
                  <button
                    onClick={() => onSelect(event.tournId)}
                    style={{
                      padding: "6px clamp(10px, 3vw, 14px)",
                      borderRadius: "5px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "clamp(11px, 2vw, 12px)",
                      fontWeight: 600,
                      fontFamily: "var(--font-poppins), sans-serif",
                      backgroundColor: "#4ADE80",
                      color: "#060D1F",
                      transition: "all 0.2s ease",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    View Picks
                  </button>
                </div>

                {/* Live Leaderboard */}
                {isLoading && (
                  <div style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "5px", padding: "16px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                    Loading leaderboard...
                  </div>
                )}

                {!isLoading && (!leaderboard || leaderboard.rows.length === 0) && (
                  <div style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "5px", padding: "16px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>
                    Waiting for first tee off · leaderboard updates hourly once play begins
                  </div>
                )}

                {!isLoading && leaderboard && leaderboard.rows.length > 0 && (
                  <div style={{ backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "5px", padding: "12px" }}>
                    <div style={{ fontSize: "13px", color: "#E8C96A", fontWeight: 600, marginBottom: "10px" }}>Live Leaderboard</div>
                    {/* Collapsible stacked cards — header row (pos / name / total) is
                        always visible; tap to expand and reveal R1–R4 tiles below. */}
                    <div className="flex flex-col" style={{ gap: "6px" }}>
                      {leaderboard.rows.map((player, i) => {
                        const flag = getCountryFlag(player.country);
                        const isLeader = i === 0;
                        const round = (n: number) => player.rounds?.[n] || "-";
                        const rowKey = `${event.tournId}:${player.playerId || i}`;
                        const isExpanded = expandedLbRows.has(rowKey);
                        return (
                          <div
                            key={player.playerId || i}
                            style={{
                              backgroundColor: isLeader ? "rgba(232,201,106,0.06)" : "rgba(255,255,255,0.02)",
                              borderRadius: "6px",
                              border: isLeader ? "1px solid rgba(232,201,106,0.25)" : "1px solid rgba(255,255,255,0.04)",
                              overflow: "hidden",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => toggleLbRow(rowKey)}
                              aria-expanded={isExpanded}
                              className="flex items-center"
                              style={{
                                gap: "8px",
                                width: "100%",
                                padding: "8px 10px",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontFamily: "inherit",
                                textAlign: "left",
                              }}
                            >
                              <span style={{ color: isLeader ? "#E8C96A" : "rgba(255,255,255,0.5)", fontWeight: isLeader ? 700 : 500, fontSize: "11px", minWidth: "22px" }}>
                                {player.position}
                              </span>
                              <div className="flex items-center" style={{ gap: "4px", flex: 1, minWidth: 0 }}>
                                <span style={{ color: isLeader ? "#E8C96A" : "#FFFFFF", fontWeight: isLeader ? 600 : 500, fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {player.name}
                                </span>
                                {flag && <span style={{ fontSize: "10px", flexShrink: 0 }}>{flag}</span>}
                              </div>
                              <span style={{ color: getScoreColor(player), fontWeight: 700, fontSize: "13px", flexShrink: 0 }}>
                                {player.score}
                              </span>
                              <span
                                style={{
                                  color: "rgba(255,255,255,0.4)",
                                  fontSize: "11px",
                                  flexShrink: 0,
                                  transition: "transform 0.15s ease",
                                  transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                  lineHeight: 1,
                                }}
                                aria-hidden="true"
                              >
                                ▾
                              </span>
                            </button>
                            {isExpanded && (
                              <div className="grid grid-cols-4" style={{ gap: "6px", padding: "0 10px 10px" }}>
                                {[0, 1, 2, 3].map((n) => (
                                  <div
                                    key={n}
                                    style={{
                                      backgroundColor: "rgba(255,255,255,0.03)",
                                      borderRadius: "4px",
                                      padding: "6px",
                                      textAlign: "center",
                                    }}
                                  >
                                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "9px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                      R{n + 1}
                                    </div>
                                    <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "12px", fontWeight: 600, marginTop: "2px" }}>
                                      {round(n)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {leaderboard.courseName && (
                      <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px", textAlign: "center", marginTop: "10px" }}>
                        {leaderboard.courseName}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>
      )}

      {/* Event list - Table format for completed */}
      {!loading && events.length > 0 && activeTab === "completed" && (
        <>
          {/* Desktop Table */}
          <div
            className="hidden md:block"
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              borderRadius: "5px",
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
              <thead>
                <tr
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <th
                    style={{
                      padding: "clamp(10px, 2vw, 14px) clamp(12px, 3vw, 16px)",
                      textAlign: "left",
                      color: "rgba(255,255,255,0.6)",
                      fontSize: "clamp(10px, 1.5vw, 12px)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Tournament
                  </th>
                  <th
                    style={{
                      padding: "clamp(10px, 2vw, 14px) clamp(12px, 3vw, 16px)",
                      textAlign: "left",
                      color: "rgba(255,255,255,0.6)",
                      fontSize: "clamp(10px, 1.5vw, 12px)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Dates
                  </th>
                  <th
                    style={{
                      padding: "clamp(10px, 2vw, 14px) clamp(12px, 3vw, 16px)",
                      textAlign: "center",
                      color: "rgba(255,255,255,0.6)",
                      fontSize: "clamp(10px, 1.5vw, 12px)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const isExpanded = expandedTournId === event.tournId;
                  const results = resultsData[event.tournId];
                  const isLoadingResults = resultsLoading === event.tournId;

                  return (
                    <React.Fragment key={event.tournId}>
                      <tr
                        style={{
                          borderBottom: isExpanded ? "none" : "1px solid rgba(255,255,255,0.05)",
                          transition: "background-color 0.2s ease",
                          backgroundColor: isExpanded ? "rgba(232,201,106,0.05)" : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!isExpanded) {
                            e.currentTarget.style.backgroundColor = "rgba(232,201,106,0.05)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isExpanded) {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }
                        }}
                      >
                        <td
                          style={{
                            padding: "clamp(12px, 2vw, 16px)",
                          }}
                        >
                          <div className="flex items-center" style={{ gap: "8px" }}>
                            <span
                              style={{
                                color: isExpanded ? "#E8C96A" : "#FFFFFF",
                                fontWeight: 500,
                                fontSize: "clamp(12px, 1.5vw, 14px)",
                              }}
                            >
                              {event.name}
                            </span>
                            {event.isMajor && (
                              <span
                                style={{
                                  fontSize: "9px",
                                  fontWeight: 600,
                                  backgroundColor: "#E8C96A",
                                  color: "#060D1F",
                                  padding: "2px 6px",
                                  borderRadius: "3px",
                                  flexShrink: 0,
                                }}
                              >
                                MAJOR
                              </span>
                            )}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "clamp(12px, 2vw, 16px)",
                            color: "rgba(255,255,255,0.6)",
                            fontSize: "clamp(11px, 1.5vw, 13px)",
                          }}
                        >
                          {formatDate(event.startDate)}{event.endDate && `–${formatDate(event.endDate)}`}
                        </td>
                        <td
                          style={{
                            padding: "clamp(12px, 2vw, 16px)",
                            textAlign: "center",
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompletedClick(event.tournId);
                            }}
                            style={{
                              padding: "6px 16px",
                              borderRadius: "5px",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "clamp(11px, 1.5vw, 12px)",
                              fontWeight: 600,
                              fontFamily: "var(--font-poppins), sans-serif",
                              backgroundColor: isExpanded ? "#E8C96A" : "rgba(255,255,255,0.1)",
                              color: isExpanded ? "#060D1F" : "rgba(255,255,255,0.7)",
                              whiteSpace: "nowrap",
                              transition: "all 0.2s ease",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              margin: "0 auto",
                            }}
                          >
                            {isExpanded ? "Hide" : "View"} Results
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{
                                transition: "transform 0.2s ease",
                                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                              }}
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>
                        </td>
                      </tr>

                      {/* Expanded results row */}
                      {isExpanded && (
                        <tr>
                          <td
                            colSpan={3}
                            style={{
                              padding: 0,
                              borderBottom: "1px solid rgba(255,255,255,0.05)",
                            }}
                          >
                            <div
                              style={{
                                backgroundColor: "rgba(232,201,106,0.04)",
                                padding: "clamp(12px, 2vw, 16px)",
                              }}
                            >
                              {isLoadingResults && (
                                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", textAlign: "center", padding: "16px 0" }}>
                                  Loading results...
                                </div>
                              )}

                              {!isLoadingResults && !results && (
                                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", textAlign: "center", padding: "16px 0" }}>
                                  No results available
                                </div>
                              )}

                              {!isLoadingResults && results && (
                                <div style={{ overflowX: "auto", maxHeight: "400px", overflowY: "auto" }}>
                                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                                    <thead style={{ position: "sticky", top: 0, backgroundColor: "#13192A", zIndex: 1 }}>
                                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                        <th style={{ padding: "8px 4px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Pos</th>
                                        <th style={{ padding: "8px 8px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase", minWidth: "140px" }}>Player</th>
                                        <th style={{ padding: "8px 4px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>R1</th>
                                        <th style={{ padding: "8px 4px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>R2</th>
                                        <th style={{ padding: "8px 4px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>R3</th>
                                        <th style={{ padding: "8px 4px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>R4</th>
                                        <th style={{ padding: "8px 6px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Total</th>
                                        <th style={{ padding: "8px 6px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>Thru</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {results.rows.map((player, i) => {
                                        const flag = getCountryFlag(player.country);
                                        const isCut = player.status === "cut" || player.position === "CUT";
                                        const isWinner = i === 0;
                                        return (
                                          <tr
                                            key={player.playerId || i}
                                            style={{
                                              borderBottom: i < results.rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                                            }}
                                          >
                                            <td style={{ padding: "10px 4px", color: isWinner ? "#E8C96A" : "rgba(255,255,255,0.5)", fontWeight: isWinner ? 600 : 400, fontSize: "12px" }}>
                                              {isCut ? "CUT" : player.position}
                                            </td>
                                            <td style={{ padding: "10px 8px" }}>
                                              <div className="flex items-center" style={{ gap: "6px" }}>
                                                {isWinner && <span style={{ fontSize: "14px" }}>🏆</span>}
                                                <span style={{ color: isWinner ? "#E8C96A" : "#FFFFFF", fontWeight: isWinner ? 600 : 400 }}>
                                                  {player.name}
                                                </span>
                                                {flag && <span style={{ fontSize: "11px" }}>{flag}</span>}
                                              </div>
                                            </td>
                                            <td style={{ padding: "10px 4px", textAlign: "center", color: "rgba(255,255,255,0.6)" }}>
                                              {player.rounds[0] || "-"}
                                            </td>
                                            <td style={{ padding: "10px 4px", textAlign: "center", color: "rgba(255,255,255,0.6)" }}>
                                              {player.rounds[1] || "-"}
                                            </td>
                                            <td style={{ padding: "10px 4px", textAlign: "center", color: "rgba(255,255,255,0.6)" }}>
                                              {player.rounds[2] || "-"}
                                            </td>
                                            <td style={{ padding: "10px 4px", textAlign: "center", color: "rgba(255,255,255,0.6)" }}>
                                              {player.rounds[3] || "-"}
                                            </td>
                                            <td style={{ padding: "10px 6px", textAlign: "center", color: getScoreColor(player), fontWeight: 600 }}>
                                              {player.score}
                                            </td>
                                            <td style={{ padding: "10px 6px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: "11px" }}>
                                              {player.thru || "F"}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                  <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px", textAlign: "center", marginTop: "12px" }}>
                                    {results.rows.length} players · {results.courseName}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>

          {/* Mobile Card View */}
        <div className="md:hidden" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {events.map((event) => {
            const isExpanded = expandedTournId === event.tournId;
            const results = resultsData[event.tournId];
            const isLoadingResults = resultsLoading === event.tournId;

            return (
              <div key={event.tournId}>
                <div
                  style={{
                    backgroundColor: isExpanded ? "rgba(232,201,106,0.08)" : "rgba(255,255,255,0.03)",
                    borderRadius: isExpanded ? "5px 5px 0 0" : "5px",
                    padding: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    border: isExpanded ? "1px solid #E8C96A" : "none",
                    borderBottom: isExpanded ? "1px solid rgba(232,201,106,0.3)" : "none",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center" style={{ gap: "6px", marginBottom: "4px", flexWrap: "wrap" }}>
                      <span style={{ color: isExpanded ? "#E8C96A" : "#FFFFFF", fontWeight: 500, fontSize: "14px" }}>
                        {event.name}
                      </span>
                      {event.isMajor && (
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: 600,
                            backgroundColor: "#E8C96A",
                            color: "#060D1F",
                            padding: "2px 6px",
                            borderRadius: "3px",
                            flexShrink: 0,
                          }}
                        >
                          MAJOR
                        </span>
                      )}
                      <span className="hidden sm:inline" style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginLeft: "4px" }}>
                        {formatDate(event.startDate)}{event.endDate && `–${formatDate(event.endDate)}`}
                      </span>
                    </div>
                    <div className="sm:hidden" style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>
                      {formatDate(event.startDate)}{event.endDate && `–${formatDate(event.endDate)}`}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCompletedClick(event.tournId)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "5px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 600,
                      fontFamily: "var(--font-poppins), sans-serif",
                      backgroundColor: isExpanded ? "#E8C96A" : "rgba(255,255,255,0.1)",
                      color: isExpanded ? "#060D1F" : "rgba(255,255,255,0.7)",
                      transition: "all 0.2s ease",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {isExpanded ? "Hide" : "View"}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transition: "transform 0.2s ease",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>

                {/* Expanded results */}
                {isExpanded && (
                  <div
                    style={{
                      border: "1px solid #E8C96A",
                      borderTop: "none",
                      borderRadius: "0 0 5px 5px",
                      backgroundColor: "rgba(232,201,106,0.04)",
                      padding: "12px",
                    }}
                  >
                    {isLoadingResults && (
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", textAlign: "center", padding: "16px 0" }}>
                        Loading results...
                      </div>
                    )}

                    {!isLoadingResults && !results && (
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", textAlign: "center", padding: "16px 0" }}>
                        No results available
                      </div>
                    )}

                    {!isLoadingResults && results && (
                      <div style={{ overflowX: "auto", maxHeight: "400px", overflowY: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                          <thead style={{ position: "sticky", top: 0, backgroundColor: "#13192A", zIndex: 1 }}>
                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                              <th style={{ padding: "6px 4px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "9px", textTransform: "uppercase" }}>Pos</th>
                              <th style={{ padding: "6px 6px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "9px", textTransform: "uppercase", minWidth: "100px" }}>Player</th>
                              <th style={{ padding: "6px 3px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "9px", textTransform: "uppercase" }}>R1</th>
                              <th style={{ padding: "6px 3px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "9px", textTransform: "uppercase" }}>R2</th>
                              <th style={{ padding: "6px 3px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "9px", textTransform: "uppercase" }}>R3</th>
                              <th style={{ padding: "6px 3px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "9px", textTransform: "uppercase" }}>R4</th>
                              <th style={{ padding: "6px 4px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "9px", textTransform: "uppercase" }}>Total</th>
                              <th style={{ padding: "6px 4px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "9px", textTransform: "uppercase" }}>Thru</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.rows.map((player, i) => {
                              const flag = getCountryFlag(player.country);
                              const isCut = player.status === "cut" || player.position === "CUT";
                              const isWinner = i === 0;
                              return (
                                <tr
                                  key={player.playerId || i}
                                  style={{
                                    borderBottom: i < results.rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                                  }}
                                >
                                  <td style={{ padding: "8px 4px", color: isWinner ? "#E8C96A" : "rgba(255,255,255,0.5)", fontWeight: isWinner ? 600 : 400, fontSize: "11px" }}>
                                    {isCut ? "CUT" : player.position}
                                  </td>
                                  <td style={{ padding: "8px 6px" }}>
                                    <div className="flex items-center" style={{ gap: "4px" }}>
                                      {isWinner && <span style={{ fontSize: "12px" }}>🏆</span>}
                                      <span style={{ color: isWinner ? "#E8C96A" : "#FFFFFF", fontWeight: isWinner ? 600 : 400, fontSize: "11px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {player.name}
                                      </span>
                                      {flag && <span style={{ fontSize: "10px", flexShrink: 0 }}>{flag}</span>}
                                    </div>
                                  </td>
                                  <td style={{ padding: "8px 3px", textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: "11px" }}>
                                    {player.rounds[0] || "-"}
                                  </td>
                                  <td style={{ padding: "8px 3px", textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: "11px" }}>
                                    {player.rounds[1] || "-"}
                                  </td>
                                  <td style={{ padding: "8px 3px", textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: "11px" }}>
                                    {player.rounds[2] || "-"}
                                  </td>
                                  <td style={{ padding: "8px 3px", textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: "11px" }}>
                                    {player.rounds[3] || "-"}
                                  </td>
                                  <td style={{ padding: "8px 4px", textAlign: "center", color: getScoreColor(player), fontWeight: 600, fontSize: "11px" }}>
                                    {player.score}
                                  </td>
                                  <td style={{ padding: "8px 4px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: "10px" }}>
                                    {player.thru || "F"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px", textAlign: "center", marginTop: "10px" }}>
                          {results.rows.length} players · {results.courseName}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>
      )}

    </div>
  );
}
