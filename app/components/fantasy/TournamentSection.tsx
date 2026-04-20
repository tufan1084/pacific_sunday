"use client";

import { useState } from "react";
import type { Tournament, TournamentResults, TournamentResultPlayer } from "@/app/types/fantasy";
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

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getCountryFlag(country: string) {
  if (!country || country.length !== 2) return null;
  const code = country.toUpperCase();
  const offset = 127397;
  return String.fromCodePoint(...[...code].map((c) => c.charCodeAt(0) + offset));
}

function getScoreColor(player: TournamentResultPlayer) {
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
  const defaultTab: Tab = upcoming.length > 0 ? "upcoming" : live.length > 0 ? "live" : "completed";
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  // Expanded completed tournament state
  const [expandedTournId, setExpandedTournId] = useState<string | null>(null);
  const [resultsData, setResultsData] = useState<Record<string, TournamentResults>>({});
  const [resultsLoading, setResultsLoading] = useState<string | null>(null);

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
      const res = await api.golf.getTournamentResults(tournId);
      if (res.success && res.data) {
        setResultsData((prev) => ({ ...prev, [tournId]: res.data as TournamentResults }));
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
      {/* Tabs */}
      <div className="flex" style={{ gap: "4px", marginBottom: "16px" }}>
        {TABS.map((tab) => {
          const count = lists[tab].length;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 16px",
                borderRadius: "5px",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 500,
                fontFamily: "var(--font-poppins), sans-serif",
                backgroundColor: isActive ? "#E8C96A" : "rgba(255,255,255,0.06)",
                color: isActive ? "#060D1F" : "rgba(255,255,255,0.5)",
                transition: "all 0.2s ease",
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

      {/* Loading */}
      {loading && (
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", padding: "20px 0", textAlign: "center" }}>
          Loading tournaments...
        </div>
      )}

      {/* Empty */}
      {!loading && events.length === 0 && (
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", padding: "20px 0", textAlign: "center" }}>
          No {activeTab} tournaments
        </div>
      )}

      {/* Event list */}
      {!loading && events.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {events.map((event) => {
            const isCompleted = activeTab === "completed";
            const isLive = activeTab === "live";
            const isUpcoming = activeTab === "upcoming";
            const isExpanded = expandedTournId === event.tournId;
            const results = resultsData[event.tournId];
            const isLoadingResults = resultsLoading === event.tournId;

            return (
              <div key={event.tournId}>
                {/* Card */}
                <div
                  onClick={() => {
                    if (isCompleted) handleCompletedClick(event.tournId);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: isExpanded ? "5px 5px 0 0" : "5px",
                    border: isExpanded ? "1.5px solid #E8C96A" : "1.5px solid transparent",
                    borderBottom: isExpanded ? "1.5px solid rgba(232,201,106,0.3)" : undefined,
                    backgroundColor: isExpanded ? "rgba(232,201,106,0.08)" : "rgba(255,255,255,0.03)",
                    cursor: isCompleted ? "pointer" : "default",
                    textAlign: "left",
                    width: "100%",
                    fontFamily: "var(--font-poppins), sans-serif",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="flex items-center" style={{ gap: "8px", marginBottom: "2px" }}>
                      <span
                        style={{
                          color: isExpanded ? "#E8C96A" : "#FFFFFF",
                          fontWeight: 500,
                          fontSize: "clamp(13px, 1.2vw, 15px)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {event.name}
                        <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400, marginLeft: "8px", fontSize: "12px" }}>
                          {formatDate(event.startDate)}{event.endDate && `–${formatDate(event.endDate)}`}
                        </span>
                      </span>
                      {event.isMajor && (
                        <span
                          style={{
                            fontSize: "10px",
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
                      {event.status === "live" && (
                        <span
                          style={{
                            fontSize: "10px",
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
                      )}
                    </div>
                    <div
                      style={{
                        color: "rgba(255,255,255,0.45)",
                        fontSize: "12px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {event.courseName}
                      {event.city && ` · ${event.city}`}
                      {event.state && `, ${event.state}`}
                    </div>
                  </div>

                  <div className="flex items-center" style={{ gap: "8px", flexShrink: 0, marginLeft: "12px" }}>
                    {/* Pick Players / View Live button for upcoming & live */}
                    {(isUpcoming || isLive) && (() => {
                      const hasData = event.tournId === availableTournId;
                      const disabled = !hasData && !isLive;
                      return (
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
                          fontSize: "12px",
                          fontWeight: 600,
                          fontFamily: "var(--font-poppins), sans-serif",
                          backgroundColor: disabled ? "rgba(255,255,255,0.08)" : isLive ? "#4ADE80" : "#E8C96A",
                          color: disabled ? "rgba(255,255,255,0.3)" : "#060D1F",
                          whiteSpace: "nowrap",
                          transition: "all 0.2s ease",
                          opacity: disabled ? 0.6 : 1,
                        }}
                      >
                        {isLive ? "View Live" : disabled ? "Coming Soon" : "Pick Players"}
                      </button>
                      );
                    })()}

                    {/* Chevron for completed */}
                    {isCompleted && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="rgba(255,255,255,0.4)"
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
                    )}
                  </div>
                </div>

                {/* Expanded results for completed tournaments */}
                {isCompleted && isExpanded && (
                  <div
                    style={{
                      border: "1.5px solid #E8C96A",
                      borderTop: "none",
                      borderRadius: "0 0 5px 5px",
                      backgroundColor: "rgba(232,201,106,0.04)",
                      padding: "12px 14px",
                      maxHeight: "400px",
                      overflowY: "auto",
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
                      <>
                        {results.players.length > 0 && (
                          <div
                            className="flex items-center justify-between"
                            style={{
                              padding: "10px 12px",
                              backgroundColor: "rgba(232,201,106,0.1)",
                              borderRadius: "5px",
                              marginBottom: "12px",
                            }}
                          >
                            <div className="flex items-center" style={{ gap: "10px" }}>
                              <span style={{ fontSize: "18px" }}>🏆</span>
                              <div>
                                <div style={{ color: "#E8C96A", fontWeight: 600, fontSize: "14px" }}>
                                  {results.players[0].name}
                                  {getCountryFlag(results.players[0].country) && (
                                    <span style={{ marginLeft: "6px", fontSize: "13px" }}>
                                      {getCountryFlag(results.players[0].country)}
                                    </span>
                                  )}
                                </div>
                                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }}>
                                  Winner · {results.courseName}
                                </div>
                              </div>
                            </div>
                            <span
                              style={{
                                color: results.players[0].score.startsWith("-") ? "#4ADE80" : "rgba(255,255,255,0.5)",
                                fontWeight: 600,
                                fontSize: "16px",
                              }}
                            >
                              {results.players[0].score}
                            </span>
                          </div>
                        )}

                        {results.players.map((player, i) => {
                          const flag = getCountryFlag(player.country);
                          const isCut = player.status === "cut" || player.position === "CUT";
                          return (
                            <div key={player.playerId || i}>
                              <div className="flex items-center justify-between" style={{ padding: "8px 0" }}>
                                <div className="flex items-center" style={{ gap: "10px", minWidth: 0 }}>
                                  <span
                                    style={{
                                      color: i === 0 ? "#E8C96A" : "rgba(255,255,255,0.5)",
                                      width: "28px",
                                      textAlign: "right",
                                      flexShrink: 0,
                                      fontSize: "12px",
                                      fontWeight: i < 3 ? 600 : 400,
                                    }}
                                  >
                                    {isCut ? "CUT" : player.position}
                                  </span>
                                  <div style={{ minWidth: 0 }}>
                                    <div className="flex items-center" style={{ gap: "6px" }}>
                                      <span
                                        style={{
                                          color: i < 3 ? "#E8C96A" : "#FFFFFF",
                                          fontWeight: i < 3 ? 500 : 400,
                                          fontSize: "13px",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {player.name}
                                      </span>
                                      {flag && <span style={{ fontSize: "12px", flexShrink: 0 }}>{flag}</span>}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center" style={{ gap: "12px", flexShrink: 0 }}>
                                  {player.rounds.length > 0 && (
                                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>
                                      {player.rounds.join(" · ")}
                                    </span>
                                  )}
                                  <span
                                    style={{
                                      color: getScoreColor(player),
                                      fontWeight: 500,
                                      fontSize: "13px",
                                      minWidth: "32px",
                                      textAlign: "right",
                                    }}
                                  >
                                    {player.score}
                                  </span>
                                </div>
                              </div>
                              {i < results.players.length - 1 && <div style={dividerStyle} />}
                            </div>
                          );
                        })}

                        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px", textAlign: "center", marginTop: "8px" }}>
                          {results.players.length} players
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
