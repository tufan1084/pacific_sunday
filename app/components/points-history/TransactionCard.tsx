"use client";

import { useState } from "react";
import { getTransactionMeta } from "./transactionMeta";

interface TransactionCardProps {
  transaction: any;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

const formatAmount = (n: number) => (n > 0 ? `+${n.toLocaleString()}` : n.toLocaleString());

function IconBubble({
  meta,
  size = 40,
}: {
  meta: ReturnType<typeof getTransactionMeta>;
  size?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: meta.tint,
        color: meta.stroke,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: `inset 0 0 0 1px ${meta.tint}`,
      }}
    >
      {meta.icon}
    </div>
  );
}

function TypePill({ meta }: { meta: ReturnType<typeof getTransactionMeta> }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "999px",
        backgroundColor: meta.tint,
        color: meta.stroke,
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {meta.label}
    </span>
  );
}

export default function TransactionCard({ transaction }: TransactionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = getTransactionMeta(transaction.type);
  const isTournament = transaction.type === "tournament_reward";
  const metadata = transaction.metadata || {};
  const tournament = metadata.tournament;
  const pickDetails = metadata.pickDetails;

  const positive = transaction.amount > 0;
  const amountColor = positive ? "#4ADE80" : "#EF4444";

  // ── Tournament card (expandable) ─────────────────────────────────────────
  if (isTournament && tournament) {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #13192A 0%, #161D32 100%)",
          borderRadius: "10px",
          padding: "clamp(14px, 3vw, 20px)",
          fontFamily: "var(--font-poppins), sans-serif",
          border: "1px solid rgba(232,201,106,0.08)",
        }}
      >
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
          style={{ marginBottom: expanded ? "16px" : "0", gap: "12px" }}
        >
          <div className="flex items-center gap-3" style={{ flex: 1, minWidth: 0 }}>
            <IconBubble meta={meta} size={44} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="flex items-center gap-2" style={{ flexWrap: "wrap", marginBottom: "3px" }}>
                <TypePill meta={meta} />
              </div>
              <div
                style={{
                  color: "#E8C96A",
                  fontSize: "clamp(14px, 3.5vw, 16px)",
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {tournament.name}
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "clamp(11px, 2.8vw, 12px)",
                  marginTop: "2px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {formatDate(tournament.startDate)} — {formatDate(tournament.endDate)}
                {tournament.courseName && ` · ${tournament.courseName}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
            <div
              style={{
                color: amountColor,
                fontSize: "clamp(15px, 3.6vw, 18px)",
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
              }}
            >
              {formatAmount(transaction.amount)} <span style={{ fontWeight: 400, fontSize: "0.7em", opacity: 0.8 }}>pts</span>
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#E8C96A"
              strokeWidth="2"
              style={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
                flexShrink: 0,
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {expanded && pickDetails?.playerScores && (
          <div style={{ marginTop: "16px" }}>
            <div
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "clamp(12px, 3vw, 14px)",
                fontWeight: 500,
                marginBottom: "12px",
                letterSpacing: "0.02em",
              }}
            >
              Your Picks &amp; Performance
            </div>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "320px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#060D1F" }}>
                    <th style={{ padding: "clamp(8px, 2vw, 12px) clamp(8px, 3vw, 16px)", textAlign: "left", color: "rgba(255,255,255,0.7)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", borderTopLeftRadius: "8px", whiteSpace: "nowrap" }}>
                      Tier
                    </th>
                    <th style={{ padding: "clamp(8px, 2vw, 12px) clamp(8px, 3vw, 16px)", textAlign: "left", color: "rgba(255,255,255,0.7)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                      Player
                    </th>
                    <th style={{ padding: "clamp(8px, 2vw, 12px) clamp(8px, 3vw, 16px)", textAlign: "center", color: "rgba(255,255,255,0.7)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      Score
                    </th>
                    <th style={{ padding: "clamp(8px, 2vw, 12px) clamp(8px, 3vw, 16px)", textAlign: "right", color: "rgba(255,255,255,0.7)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", borderTopRightRadius: "8px", whiteSpace: "nowrap" }}>
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pickDetails.playerScores.map((pick: any, i: number) => (
                    <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "clamp(8px, 2vw, 12px) clamp(8px, 3vw, 16px)", color: "#E8C96A", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: 600, whiteSpace: "nowrap" }}>
                        T{i + 1}
                      </td>
                      <td style={{ padding: "clamp(8px, 2vw, 12px) clamp(8px, 3vw, 16px)", color: "#FFFFFF", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: 500 }}>
                        {pick.playerName}
                      </td>
                      <td style={{ padding: "clamp(8px, 2vw, 12px) clamp(8px, 3vw, 16px)", textAlign: "center", color: "rgba(255,255,255,0.7)", fontSize: "clamp(12px, 3vw, 14px)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                        {pick.score}
                      </td>
                      <td style={{ padding: "clamp(8px, 2vw, 12px) clamp(8px, 3vw, 16px)", textAlign: "right", color: pick.points > 0 ? "#4ADE80" : "rgba(255,255,255,0.4)", fontSize: "clamp(13px, 3.2vw, 15px)", fontWeight: 600, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                        +{pick.points}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: "rgba(232,201,106,0.1)", borderTop: "2px solid rgba(232,201,106,0.3)" }}>
                    <td colSpan={3} style={{ padding: "clamp(8px, 2vw, 12px) clamp(8px, 3vw, 16px)", color: "#E8C96A", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: 600 }}>
                      Total Points Earned
                    </td>
                    <td style={{ padding: "clamp(8px, 2vw, 12px) clamp(8px, 3vw, 16px)", textAlign: "right", color: "#E8C96A", fontSize: "clamp(14px, 3.5vw, 16px)", fontWeight: 700, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                      {pickDetails.totalPoints} pts
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Generic transaction row ─────────────────────────────────────────────
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #13192A 0%, #161D32 100%)",
        borderRadius: "10px",
        padding: "clamp(12px, 3vw, 16px) clamp(14px, 3.5vw, 20px)",
        fontFamily: "var(--font-poppins), sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        border: `1px solid ${meta.tint}`,
      }}
    >
      <div className="flex items-center gap-3" style={{ flex: 1, minWidth: 0 }}>
        <IconBubble meta={meta} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-2" style={{ flexWrap: "wrap", marginBottom: "3px" }}>
            <TypePill meta={meta} />
          </div>
          <div
            style={{
              color: "#FFFFFF",
              fontSize: "clamp(13px, 3.2vw, 15px)",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {transaction.description || meta.label}
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: "clamp(11px, 2.8vw, 12px)",
              marginTop: "2px",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatDate(transaction.createdAt)} · {formatTime(transaction.createdAt)}
          </div>
        </div>
      </div>
      <div
        style={{
          color: amountColor,
          fontSize: "clamp(14px, 3.5vw, 16px)",
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        {formatAmount(transaction.amount)} <span style={{ fontWeight: 400, fontSize: "0.7em", opacity: 0.8 }}>pts</span>
      </div>
    </div>
  );
}
