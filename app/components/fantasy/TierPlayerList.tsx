"use client";

import { useState } from "react";
import Image from "next/image";
import type { ApiTier, ApiPlayer } from "@/app/types/fantasy";

interface TierPlayerListProps {
  tiers: ApiTier[];
  selectedPicks?: Record<string, string | null>;
  onPlayerSelect?: (tier: string, player: ApiPlayer) => void;
}

const dividerStyle = {
  height: "1.5px",
  backgroundColor: "rgba(255,255,255,0.15)",
  margin: "0 calc(-1 * clamp(16px, 2vw, 20px))",
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getCountryFlag(country: string | null | undefined) {
  if (!country || country.length !== 2) return null;
  const code = country.toUpperCase();
  const offset = 127397;
  return String.fromCodePoint(...[...code].map((c) => c.charCodeAt(0) + offset));
}

export default function TierPlayerList({ tiers, selectedPicks, onPlayerSelect }: TierPlayerListProps) {
  // If `selectedPicks` is provided, component is controlled by parent; else use internal state
  const isControlled = selectedPicks !== undefined;
  const [internalSelected, setInternalSelected] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(tiers.map((t) => [t.name, null]))
  );
  const selected = isControlled ? selectedPicks! : internalSelected;

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(tiers.map((t) => [t.name, false]))
  );

  const handleSelect = (tier: ApiTier, player: ApiPlayer) => {
    if (!isControlled) {
      setInternalSelected((prev) => ({ ...prev, [tier.name]: player.playerId }));
    }
    onPlayerSelect?.(tier.name, player);
  };

  const toggleCollapse = (tierName: string) => {
    setCollapsed((prev) => ({ ...prev, [tierName]: !prev[tierName] }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tiers.map((tier) => {
        const isCollapsed = collapsed[tier.name];
        const playerCount = tier.players.length;

        return (
          <div
            key={tier.name}
            style={{
              backgroundColor: "#13192A",
              borderRadius: "5px",
              padding: "clamp(16px, 2vw, 20px)",
              fontFamily: "var(--font-poppins), sans-serif",
            }}
          >
            {/* Section header */}
            <div
              className="flex items-center justify-between"
              style={{ paddingBottom: "20px", paddingTop: "8px", cursor: "pointer" }}
              onClick={() => toggleCollapse(tier.name)}
            >
              <div className="flex items-center gap-3">
                <Image
                  src="/icons/tire-logo.svg"
                  alt={tier.name}
                  width={32}
                  height={32}
                  style={{ flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontSize: "clamp(14px, 1.4vw, 18px)", color: "#E8C96A", fontWeight: 600 }}>
                    {tier.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                    {tier.rankRange} · {playerCount} player{playerCount !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transition: "transform 0.2s ease",
                  transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            <div style={dividerStyle} />

            {/* Player rows — show 10, scroll the rest */}
            {!isCollapsed && (
              <div
                className={playerCount > 10 ? "tier-scroll" : undefined}
                style={
                  playerCount > 10
                    ? {
                        maxHeight: "calc(10 * clamp(56px, 5vw, 68px) + 9 * 1.5px)",
                        overflowY: "auto",
                        overflowX: "hidden",
                        marginLeft: "calc(-1 * clamp(16px, 2vw, 20px))",
                        marginRight: "calc(-1 * clamp(16px, 2vw, 20px))",
                        paddingLeft: "clamp(16px, 2vw, 20px)",
                        paddingRight: "clamp(16px, 2vw, 20px)",
                      }
                    : undefined
                }
              >
                {tier.players.map((player, i) => {
                const isSelected = selected[tier.name] === player.playerId;
                const flag = getCountryFlag(player.country);
                const isCut = player.status === "cut" || player.position === "CUT";
                const hasScore = typeof player.score === "string" && player.score.length > 0;
                const scoreColor =
                  isCut ? "#FF6B6B" :
                  hasScore && player.score!.startsWith("-") ? "#4ADE80" :
                  player.score === "E" ? "rgba(255,255,255,0.5)" :
                  "#FF6B6B";

                return (
                  <div key={player.playerId || i}>
                    <div
                      className="flex items-center justify-between"
                      style={{ height: "clamp(56px, 5vw, 68px)" }}
                    >
                      {/* Left: serial number + avatar + info */}
                      <div className="flex items-center" style={{ gap: "10px", minWidth: 0 }}>
                        <span
                          style={{
                            color: "#E8C96A",
                            width: "16px",
                            textAlign: "right",
                            flexShrink: 0,
                            fontSize: "clamp(11px, 1.1vw, 16px)",
                          }}
                        >
                          {i + 1}.
                        </span>

                        <div
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "5px",
                            backgroundColor: "#060D1F",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "#E8C96A",
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(player.name)}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div
                            className="flex items-center"
                            style={{ gap: "6px" }}
                          >
                            <span
                              style={{
                                color: "#E8C96A",
                                fontWeight: 500,
                                fontSize: "clamp(12px, 1.1vw, 16px)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {player.name}
                            </span>
                            {flag && (
                              <span style={{ fontSize: "14px", flexShrink: 0 }}>{flag}</span>
                            )}
                            {(player.status === "cut" || player.position === "CUT") && (
                              <span style={{ fontSize: "10px", color: "#FF6B6B", fontWeight: 600, flexShrink: 0 }}>
                                CUT
                              </span>
                            )}
                            {player.status === "wd" && (
                              <span style={{ fontSize: "10px", color: "#FF6B6B", fontWeight: 600, flexShrink: 0 }}>
                                WD
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              color: "#FFFFFF",
                              fontSize: "clamp(11px, 1vw, 15px)",
                              fontWeight: 400,
                            }}
                          >
                            {player.worldRank ? `World #${player.worldRank}` : player.tier}
                          </div>
                        </div>
                      </div>

                      {/* Right: score + checkbox */}
                      <div className="flex items-center" style={{ gap: "12px", flexShrink: 0 }}>
                        {hasScore && (
                          <span
                            style={{
                              color: scoreColor,
                              fontWeight: 500,
                              fontSize: "clamp(12px, 1.1vw, 16px)",
                            }}
                          >
                            {player.score}
                          </span>
                        )}

                        <div
                          onClick={() => handleSelect(tier, player)}
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "4px",
                            border: "1.5px solid #E8C96A",
                            backgroundColor: isSelected ? "#E8C96A" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                        >
                          {isSelected && (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#060D1F"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>

                    {i < tier.players.length - 1 && <div style={dividerStyle} />}
                  </div>
                );
              })}
              </div>
            )}

            {/* Collapsed summary */}
            {isCollapsed && (
              <div
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: "12px",
                  padding: "12px 0 4px",
                  textAlign: "center",
                }}
              >
                {selected[tier.name]
                  ? `1 player selected · tap to expand`
                  : `${playerCount} players · tap to expand`}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
