"use client";

import { useState } from "react";
import { api } from "@/app/services/api";
import type { ApiH2HChallenge } from "@/app/services/api";
import { useToast } from "@/app/context/ToastContext";

interface Props {
  challenges: ApiH2HChallenge[];
  onAction: () => void;
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "#13192A",
  borderRadius: "5px",
  padding: "clamp(16px, 2vw, 20px)",
  fontFamily: "var(--font-poppins), sans-serif",
  marginBottom: "24px",
};

const initialsFromName = (n?: string | null) =>
  (n || "?").trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");

const isChallengeClosed = (challenge: ApiH2HChallenge) => {
  const status = challenge.tournament?.status;
  if (status === "live" || status === "completed") return true;

  const startDate = challenge.tournament?.startDate;
  if (!startDate) return false;

  const startTs = new Date(startDate).getTime();
  return Number.isFinite(startTs) && Date.now() >= startTs;
};

export default function IncomingRequests({ challenges, onAction }: Props) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const toast = useToast();

  const respond = async (id: number, action: "accept" | "decline") => {
    setBusyId(id);
    try {
      const res = action === "accept" ? await api.h2h.accept(id) : await api.h2h.decline(id);
      if (!res.success) throw new Error(res.message || `${action} failed`);
      toast.success(action === "accept" ? "Challenge accepted!" : "Challenge declined");
      onAction();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `Failed to ${action} challenge`);
      if (action === "accept") onAction();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={cardStyle}>
      <div className="flex items-center gap-3" style={{ paddingBottom: "16px" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
        <div style={{ fontSize: "clamp(16px, 3vw, 18px)", color: "#E8C96A", fontWeight: 600 }}>
          Incoming Challenges ({challenges.length})
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <th style={{ textAlign: "left", padding: "6px 0", fontSize: 12, fontWeight: 600, color: "#E8C96A" }}>Challenger</th>
              <th style={{ textAlign: "left", padding: "6px 0", fontSize: 12, fontWeight: 600, color: "#E8C96A" }}>Tournament</th>
              <th style={{ textAlign: "left", padding: "6px 0", fontSize: 12, fontWeight: 600, color: "#E8C96A" }}>Comment</th>
              <th style={{ textAlign: "right", padding: "6px 0", fontSize: 12, fontWeight: 600, color: "#E8C96A" }}>Points</th>
              <th style={{ textAlign: "right", padding: "6px 0", fontSize: 12, fontWeight: 600, color: "#E8C96A" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {challenges.map((c) => {
              const acceptClosed = isChallengeClosed(c);

              return (
              <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <td style={{ padding: "8px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 36, height: 36, borderRadius: 5, background: "#060D1F",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        overflow: "hidden", flexShrink: 0,
                      }}
                    >
                      {c.challenger?.photoUrl ? (
                        <img src={c.challenger.photoUrl} alt={c.challenger.name || "Challenger"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#E8C96A" }}>
                          {initialsFromName(c.challenger?.name)}
                        </span>
                      )}
                    </div>
                    <div>
                      <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{c.challenger?.name}</div>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>@{c.challenger?.username}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "8px 0", color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
                  {c.tournament?.name}
                  {acceptClosed && (
                    <div style={{ color: "#F87171", fontSize: 11, marginTop: 2 }}>
                      Accept window closed
                    </div>
                  )}
                  {c.multiplier !== 1 && <span style={{ color: "#E8C96A", marginLeft: 6 }}>· {c.multiplier}x</span>}
                </td>
                <td style={{ padding: "8px 0", color: "rgba(255,255,255,0.6)", fontSize: 12, fontStyle: "italic" }}>
                  {c.trashTalk ? `"${c.trashTalk}"` : "—"}
                </td>
                <td style={{ padding: "8px 0", textAlign: "right", color: "#E8C96A", fontWeight: 600, fontSize: 13 }}>
                  {c.effectiveWager}
                </td>
                <td style={{ padding: "8px 0", textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button
                      onClick={() => respond(c.id, "accept")}
                      disabled={busyId === c.id || acceptClosed}
                      title={acceptClosed ? "This challenge can no longer be accepted because the tournament is live." : undefined}
                      style={{
                        padding: "5px 12px", border: "none", borderRadius: 4,
                        background: acceptClosed ? "rgba(255,255,255,0.12)" : "#E8C96A",
                        color: acceptClosed ? "rgba(255,255,255,0.45)" : "#060D1F",
                        fontWeight: 600, fontSize: 11,
                        cursor: busyId === c.id || acceptClosed ? "not-allowed" : "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {acceptClosed ? "Closed" : busyId === c.id ? "…" : "Accept"}
                    </button>
                    <button
                      onClick={() => respond(c.id, "decline")}
                      disabled={busyId === c.id}
                      style={{
                        padding: "5px 12px", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4,
                        background: "transparent", color: "#fff", fontWeight: 500, fontSize: 11,
                        cursor: busyId === c.id ? "not-allowed" : "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Decline
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {challenges.map((c) => {
          const acceptClosed = isChallengeClosed(c);

          return (
          <div
            key={c.id}
            style={{
              backgroundColor: "#0A1020",
              borderRadius: "8px",
              padding: "14px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "12px" }}>
              <div
                style={{
                  width: 44, height: 44, borderRadius: 5, background: "#060D1F",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", flexShrink: 0,
                }}
              >
                {c.challenger?.photoUrl ? (
                  <img src={c.challenger.photoUrl} alt={c.challenger.name || "Challenger"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#E8C96A" }}>
                    {initialsFromName(c.challenger?.name)}
                  </span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{c.challenger?.name}</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>@{c.challenger?.username}</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>Tournament:</span>
                <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 500, textAlign: "right" }}>
                  {c.tournament?.name}
                  {acceptClosed && (
                    <div style={{ color: "#F87171", fontSize: 11, marginTop: 2 }}>
                      Accept window closed
                    </div>
                  )}
                  {c.multiplier !== 1 && <span style={{ color: "#E8C96A", marginLeft: 6 }}>· {c.multiplier}x</span>}
                </span>
              </div>
              
              {c.trashTalk && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>Comment:</span>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontStyle: "italic" }}>&quot;{c.trashTalk}&quot;</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>Points at stake:</span>
                <span style={{ color: "#E8C96A", fontSize: 15, fontWeight: 600 }}>{c.effectiveWager}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => respond(c.id, "accept")}
                disabled={busyId === c.id || acceptClosed}
                title={acceptClosed ? "This challenge can no longer be accepted because the tournament is live." : undefined}
                style={{
                  flex: 1,
                  padding: "10px 16px", border: "none", borderRadius: 5,
                  background: acceptClosed ? "rgba(255,255,255,0.12)" : "#E8C96A",
                  color: acceptClosed ? "rgba(255,255,255,0.45)" : "#060D1F",
                  fontWeight: 600, fontSize: 13,
                  cursor: busyId === c.id || acceptClosed ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {acceptClosed ? "Closed" : busyId === c.id ? "…" : "Accept"}
              </button>
              <button
                onClick={() => respond(c.id, "decline")}
                disabled={busyId === c.id}
                style={{
                  flex: 1,
                  padding: "10px 16px", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 5,
                  background: "transparent", color: "#fff", fontWeight: 500, fontSize: 13,
                  cursor: busyId === c.id ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                Decline
              </button>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
