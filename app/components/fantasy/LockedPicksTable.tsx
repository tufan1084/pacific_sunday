"use client";

import type { ApiTier, ApiPlayer } from "@/app/types/fantasy";

interface LockedPicksTableProps {
  tiers: ApiTier[];
  picks: Record<string, string | null>;
}

export default function LockedPicksTable({ tiers, picks }: LockedPicksTableProps) {
  // Build array of selected players with tier info
  const selectedPlayers = tiers
    .map((tier) => {
      const playerId = picks[tier.name];
      if (!playerId) return null;
      const player = tier.players.find((p) => p.playerId === playerId);
      if (!player) return null;
      return {
        tierName: tier.name,
        player,
      };
    })
    .filter(Boolean) as Array<{ tierName: string; player: ApiPlayer }>;

  if (selectedPlayers.length === 0) {
    return (
      <div
        style={{
          backgroundColor: "#13192A",
          borderRadius: "8px",
          padding: "40px 20px",
          textAlign: "center",
          color: "rgba(255,255,255,0.4)",
          fontSize: "14px",
        }}
      >
        No picks selected yet.
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#13192A",
        borderRadius: "8px",
        overflow: "hidden",
        fontFamily: "var(--font-poppins), sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "clamp(16px, 3vw, 20px) clamp(16px, 3vw, 24px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "6px",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#E8C96A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <h3
            style={{
              color: "#E8C96A",
              fontSize: "clamp(16px, 2vw, 20px)",
              fontWeight: 600,
              margin: 0,
            }}
          >
            Your Locked Picks
          </h3>
        </div>
        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "clamp(12px, 1.2vw, 14px)",
            margin: 0,
          }}
        >
          Players selected for this tournament
        </p>
      </div>

      {/* Table - Desktop & Mobile */}
      <div
        style={{
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <th
                style={{
                  padding: "clamp(10px, 2vw, 14px) clamp(12px, 3vw, 24px)",
                  textAlign: "left",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "clamp(10px, 1.5vw, 12px)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  width: "20%",
                }}
              >
                Tier
              </th>
              <th
                style={{
                  padding: "clamp(10px, 2vw, 14px) clamp(12px, 3vw, 24px)",
                  textAlign: "left",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "clamp(10px, 1.5vw, 12px)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  width: "50%",
                }}
              >
                Player
              </th>
              <th
                style={{
                  padding: "clamp(10px, 2vw, 14px) clamp(12px, 3vw, 24px)",
                  textAlign: "center",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "clamp(10px, 1.5vw, 12px)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  width: "30%",
                }}
              >
                World Rank
              </th>
            </tr>
          </thead>
          <tbody>
            {selectedPlayers.map(({ tierName, player }, idx) => (
              <tr
                key={player.playerId}
                style={{
                  borderBottom:
                    idx < selectedPlayers.length - 1
                      ? "1px solid rgba(255,255,255,0.05)"
                      : "none",
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
                    padding: "clamp(12px, 2vw, 16px) clamp(12px, 3vw, 24px)",
                  }}
                >
                  <span
                    style={{
                      color: "#E8C96A",
                      fontSize: "clamp(12px, 1.5vw, 14px)",
                      fontWeight: 600,
                    }}
                  >
                    {tierName}
                  </span>
                </td>
                <td
                  style={{
                    padding: "clamp(12px, 2vw, 16px) clamp(12px, 3vw, 24px)",
                    color: "#FFFFFF",
                    fontSize: "clamp(12px, 1.5vw, 14px)",
                    fontWeight: 500,
                  }}
                >
                  {player.name}
                </td>
                <td
                  style={{
                    padding: "clamp(12px, 2vw, 16px) clamp(12px, 3vw, 24px)",
                    textAlign: "center",
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "clamp(12px, 1.5vw, 14px)",
                  }}
                >
                  {player.worldRank ? `#${player.worldRank}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
