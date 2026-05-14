"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/app/services/api";
import type { ApiH2HChallenge } from "@/app/services/api";
import { useToast } from "@/app/context/ToastContext";
import { useConfirm } from "@/app/context/ConfirmContext";

type Variant = "active" | "past" | "outgoing";

interface Props {
  title: string;
  icon: "trophy" | "history" | "hourglass";
  challenges: ApiH2HChallenge[];
  viewerId: number | null;
  variant: Variant;
  emptyMessage?: string;
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

const StatusPill = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <span
    style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 500,
      background: `${color}20`,
      color,
      border: `1px solid ${color}40`,
    }}
  >
    {children}
  </span>
);

const Icon = ({ name }: { name: Props["icon"] }) => {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "#E8C96A", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "trophy") {
    return (
      <svg {...common}>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    );
  }
  if (name === "hourglass") {
    return (
      <svg {...common}>
        <path d="M5 22h14" />
        <path d="M5 2h14" />
        <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
        <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 8v4l3 3" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
};

export default function ChallengeList({ title, icon, challenges, viewerId, variant, emptyMessage, onAction }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  const cancel = async (id: number) => {
    const ok = await confirm({
      title: "Cancel challenge?",
      message: "Your held points will be released back to your available balance.",
      confirmText: "Cancel challenge",
      cancelText: "Keep it",
      confirmColor: "#EF4444",
    });
    if (!ok) return;
    setBusyId(id);
    try {
      const res = await api.h2h.cancel(id);
      if (!res.success) throw new Error(res.message);
      toast.success("Challenge cancelled successfully");
      onAction();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel challenge");
    } finally {
      setBusyId(null);
    }
  };

  if (challenges.length === 0 && emptyMessage) {
    return (
      <div style={cardStyle}>
        <div className="flex items-center gap-3" style={{ paddingBottom: 12 }}>
          <Icon name={icon} />
          <div style={{ fontSize: 18, color: "#E8C96A", fontWeight: 600 }}>{title}</div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div className="flex items-center gap-3" style={{ paddingBottom: 16 }}>
        <Icon name={icon} />
        <div style={{ fontSize: "clamp(16px, 3vw, 18px)", color: "#E8C96A", fontWeight: 600 }}>
          {title} ({challenges.length})
        </div>
      </div>

      {variant === "outgoing" ? (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <th style={{ textAlign: "left", padding: "6px 0", fontSize: 12, fontWeight: 600, color: "#E8C96A" }}>Opponent</th>
                  <th style={{ textAlign: "left", padding: "6px 0", fontSize: 12, fontWeight: 600, color: "#E8C96A" }}>Tournament</th>
                  <th style={{ textAlign: "right", padding: "6px 0", fontSize: 12, fontWeight: 600, color: "#E8C96A" }}>Points</th>
                  <th style={{ textAlign: "center", padding: "6px 0", fontSize: 12, fontWeight: 600, color: "#E8C96A" }}>Status</th>
                  <th style={{ textAlign: "right", padding: "6px 0", fontSize: 12, fontWeight: 600, color: "#E8C96A" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {challenges.map((c) => {
                  const youAreChallenger = c.challenger?.id === viewerId;
                  const them = youAreChallenger ? c.opponent : c.challenger;

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
                            {them?.photoUrl ? (
                              <img src={them.photoUrl} alt={them.name || "Opponent"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#E8C96A" }}>
                                {initialsFromName(them?.name)}
                              </span>
                            )}
                          </div>
                          <div>
                            <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{them?.name}</div>
                            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>@{them?.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "8px 0", color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
                        {c.tournament?.name}
                        {c.multiplier !== 1 && <span style={{ color: "#E8C96A", marginLeft: 6 }}>· {c.multiplier}x</span>}
                      </td>
                      <td style={{ padding: "8px 0", textAlign: "right", color: "#E8C96A", fontWeight: 600, fontSize: 13 }}>
                        {c.effectiveWager}
                      </td>
                      <td style={{ padding: "8px 0", textAlign: "center" }}>
                        <span style={{ color: "#F59E0B", fontSize: 11, fontWeight: 500 }}>Pending</span>
                      </td>
                      <td style={{ padding: "8px 0", textAlign: "right" }}>
                        <button
                          onClick={() => cancel(c.id)}
                          disabled={busyId === c.id}
                          style={{
                            padding: "5px 10px", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 4,
                            background: "transparent", color: "#F87171", fontWeight: 500, fontSize: 11,
                            cursor: busyId === c.id ? "not-allowed" : "pointer", fontFamily: "inherit",
                          }}
                        >
                          {busyId === c.id ? "Cancelling..." : "Cancel"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {challenges.map((c) => {
              const youAreChallenger = c.challenger?.id === viewerId;
              const them = youAreChallenger ? c.opponent : c.challenger;

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
                      {them?.photoUrl ? (
                        <img src={them.photoUrl} alt={them.name || "Opponent"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#E8C96A" }}>
                          {initialsFromName(them?.name)}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{them?.name}</div>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>@{them?.username}</div>
                    </div>
                    <span style={{ color: "#F59E0B", fontSize: 11, fontWeight: 500, padding: "4px 8px", backgroundColor: "rgba(245,158,11,0.1)", borderRadius: "4px" }}>Pending</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>Tournament:</span>
                      <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 500, textAlign: "right" }}>
                        {c.tournament?.name}
                        {c.multiplier !== 1 && <span style={{ color: "#E8C96A", marginLeft: 6 }}>· {c.multiplier}x</span>}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>Points at stake:</span>
                      <span style={{ color: "#E8C96A", fontSize: 15, fontWeight: 600 }}>{c.effectiveWager}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => cancel(c.id)}
                    disabled={busyId === c.id}
                    style={{
                      width: "100%",
                      padding: "10px 16px", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 5,
                      background: "transparent", color: "#F87171", fontWeight: 500, fontSize: 13,
                      cursor: busyId === c.id ? "not-allowed" : "pointer", fontFamily: "inherit",
                    }}
                  >
                    {busyId === c.id ? "Cancelling..." : "Cancel Challenge"}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : variant === "active" ? (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <th style={{ textAlign: "left", padding: "6px 0", fontSize: 12, fontWeight: 600, color: "#E8C96A" }}>Matchup</th>
                  <th style={{ textAlign: "left", padding: "6px 0", fontSize: 12, fontWeight: 600, color: "#E8C96A" }}>Tournament</th>
                  <th style={{ textAlign: "center", padding: "6px 0", fontSize: 12, fontWeight: 600, color: "#E8C96A" }}>Status</th>
                  <th style={{ textAlign: "right", padding: "6px 0", fontSize: 12, fontWeight: 600, color: "#E8C96A" }}>Points</th>
                  <th style={{ textAlign: "right", padding: "6px 0", fontSize: 12, fontWeight: 600, color: "#E8C96A" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {challenges.map((c) => {
                  const youAreChallenger = c.challenger?.id === viewerId;
                  const them = youAreChallenger ? c.opponent : c.challenger;
                  const fieldReady = c.tournament?.fieldAvailable;

                  let statusText = "";
                  let statusColor = "#fff";
                  let cta: React.ReactNode = null;

                  if (c.status === "ACCEPTED") {
                    statusText = "Awaiting picks";
                    statusColor = "#60A5FA";
                    if (!fieldReady) {
                      cta = <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Field opens Monday</span>;
                    } else {
                      cta = (
                        <button
                          onClick={() => router.push(`/head-to-head/${c.id}/select-team`)}
                          style={{
                            padding: "5px 12px", border: "none", borderRadius: 4,
                            background: "#E8C96A", color: "#060D1F", fontWeight: 600, fontSize: 11,
                            cursor: "pointer", fontFamily: "inherit",
                          }}
                        >
                          Pick team
                        </button>
                      );
                    }
                  } else if (c.status === "LOCKED") {
                    statusText = "Both locked";
                    statusColor = "#A78BFA";
                    cta = (
                      <button
                        onClick={() => router.push(`/head-to-head/${c.id}/select-team`)}
                        style={{
                          padding: "5px 12px", border: "1px solid rgba(232,201,106,0.4)", borderRadius: 4,
                          background: "transparent", color: "#E8C96A", fontWeight: 500, fontSize: 11,
                          cursor: "pointer", fontFamily: "inherit",
                        }}
                      >
                        View teams
                      </button>
                    );
                  } else if (c.status === "LIVE" || c.tournament?.status === "live") {
                    statusText = "Live";
                    statusColor = "#4ADE80";
                    cta = (
                      <button
                        onClick={() => router.push(`/head-to-head/${c.id}/select-team`)}
                        style={{
                          padding: "5px 12px", border: "none", borderRadius: 4,
                          background: "#E8C96A", color: "#060D1F", fontWeight: 600, fontSize: 11,
                          cursor: "pointer", fontFamily: "inherit",
                        }}
                      >
                        Watch live
                      </button>
                    );
                  }

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
                            {them?.photoUrl ? (
                              <img src={them.photoUrl} alt={them.name || "Opponent"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#E8C96A" }}>
                                {initialsFromName(them?.name)}
                              </span>
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: 13 }}>
                              <span style={{ color: "#fff", fontWeight: 500 }}>{c.challenger?.name}</span>
                              <span style={{ color: "rgba(255,255,255,0.5)", margin: "0 4px" }}>vs</span>
                              <span style={{ color: "#E8C96A", fontWeight: 600 }}>You</span>
                            </div>
                            {(c.status === "LIVE" || c.tournament?.status === "live") && c.yourScore !== undefined && c.opponentScore !== undefined && (
                              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                                You: <strong style={{ color: c.yourScore.total < c.opponentScore.total ? "#4ADE80" : "#fff" }}>{c.yourScore.total}</strong>
                                {" "} · Them: <strong style={{ color: c.opponentScore.total < c.yourScore.total ? "#4ADE80" : "#fff" }}>{c.opponentScore.total}</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "8px 0", color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
                        {c.tournament?.name}
                        {c.multiplier !== 1 && <span style={{ color: "#E8C96A", marginLeft: 6 }}>· {c.multiplier}x</span>}
                      </td>
                      <td style={{ padding: "8px 0", textAlign: "center" }}>
                        <span style={{ color: statusColor, fontSize: 11, fontWeight: 500 }}>{statusText}</span>
                      </td>
                      <td style={{ padding: "8px 0", textAlign: "right", color: "#E8C96A", fontWeight: 600, fontSize: 13 }}>
                        {c.effectiveWager}
                      </td>
                      <td style={{ padding: "8px 0", textAlign: "right" }}>
                        {cta}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards - Active Challenges */}
          <div className="md:hidden" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {challenges.map((c) => {
              const youAreChallenger = c.challenger?.id === viewerId;
              const them = youAreChallenger ? c.opponent : c.challenger;
              const fieldReady = c.tournament?.fieldAvailable;

              let statusText = "";
              let statusColor = "#fff";
              let statusBg = "rgba(255,255,255,0.1)";
              let cta: React.ReactNode = null;

              if (c.status === "ACCEPTED") {
                statusText = "Awaiting picks";
                statusColor = "#60A5FA";
                statusBg = "rgba(96,165,250,0.1)";
                if (!fieldReady) {
                  cta = <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>Field opens Monday</span>;
                } else {
                  cta = (
                    <button
                      onClick={() => router.push(`/head-to-head/${c.id}/select-team`)}
                      style={{
                        width: "100%",
                        padding: "10px 16px", border: "none", borderRadius: 5,
                        background: "#E8C96A", color: "#060D1F", fontWeight: 600, fontSize: 13,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      Pick Your Team
                    </button>
                  );
                }
              } else if (c.status === "LOCKED") {
                statusText = "Both locked";
                statusColor = "#A78BFA";
                statusBg = "rgba(167,139,250,0.1)";
                cta = (
                  <button
                    onClick={() => router.push(`/head-to-head/${c.id}/select-team`)}
                    style={{
                      width: "100%",
                      padding: "10px 16px", border: "1px solid rgba(232,201,106,0.4)", borderRadius: 5,
                      background: "transparent", color: "#E8C96A", fontWeight: 500, fontSize: 13,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    View Teams
                  </button>
                );
              } else if (c.status === "LIVE" || c.tournament?.status === "live") {
                statusText = "Live";
                statusColor = "#4ADE80";
                statusBg = "rgba(74,222,128,0.1)";
                cta = (
                  <button
                    onClick={() => router.push(`/head-to-head/${c.id}/select-team`)}
                    style={{
                      width: "100%",
                      padding: "10px 16px", border: "none", borderRadius: 5,
                      background: "#E8C96A", color: "#060D1F", fontWeight: 600, fontSize: 13,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Watch Live
                  </button>
                );
              }

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
                      {them?.photoUrl ? (
                        <img src={them.photoUrl} alt={them.name || "Opponent"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#E8C96A" }}>
                          {initialsFromName(them?.name)}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, marginBottom: "2px" }}>
                        <span style={{ color: "#fff", fontWeight: 500 }}>{c.challenger?.name}</span>
                        <span style={{ color: "rgba(255,255,255,0.5)", margin: "0 4px" }}>vs</span>
                        <span style={{ color: "#E8C96A", fontWeight: 600 }}>You</span>
                      </div>
                      {(c.status === "LIVE" || c.tournament?.status === "live") && c.yourScore !== undefined && c.opponentScore !== undefined && (
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
                          You: <strong style={{ color: c.yourScore.total < c.opponentScore.total ? "#4ADE80" : "#fff" }}>{c.yourScore.total}</strong>
                          {" "} · Them: <strong style={{ color: c.opponentScore.total < c.yourScore.total ? "#4ADE80" : "#fff" }}>{c.opponentScore.total}</strong>
                        </div>
                      )}
                    </div>
                    <span style={{ color: statusColor, fontSize: 11, fontWeight: 500, padding: "4px 8px", backgroundColor: statusBg, borderRadius: "4px", whiteSpace: "nowrap" }}>{statusText}</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>Tournament:</span>
                      <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 500, textAlign: "right" }}>
                        {c.tournament?.name}
                        {c.multiplier !== 1 && <span style={{ color: "#E8C96A", marginLeft: 6 }}>· {c.multiplier}x</span>}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>Points at stake:</span>
                      <span style={{ color: "#E8C96A", fontSize: 15, fontWeight: 600 }}>{c.effectiveWager}</span>
                    </div>
                  </div>

                  {cta}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {challenges.map((c) => {
            const youAreChallenger = c.challenger?.id === viewerId;
            const them = youAreChallenger ? c.opponent : c.challenger;
            const yourLocked = !!(c.role === "challenger" ? c.acceptedAt && c.status !== "ACCEPTED" : null);
            const youLocked = c.status === "LOCKED" || c.status === "LIVE" || c.status === "COMPLETED";
            const fieldReady = c.tournament?.fieldAvailable;

            let resultLabel = "";
            let resultColor = "#fff";
            if (variant === "past") {
              if (c.status === "COMPLETED" && c.winnerId === viewerId) {
                resultLabel = `Won +${c.effectiveWager}`;
                resultColor = "#E8C96A";
              } else if (c.status === "COMPLETED" && c.winnerId && c.winnerId !== viewerId) {
                resultLabel = `Lost -${c.effectiveWager}`;
                resultColor = "#EF4444";
              } else if (c.status === "REFUNDED") {
                resultLabel = c.winnerId === null && c.challengerStrokes !== null ? "Tied — Refunded" : "Refunded";
                resultColor = "rgba(255,255,255,0.7)";
              } else if (c.status === "DECLINED") {
                resultLabel = "Declined";
                resultColor = "rgba(255,255,255,0.5)";
              } else if (c.status === "CANCELLED") {
                resultLabel = "Cancelled";
                resultColor = "rgba(255,255,255,0.5)";
              }
            }

            let cta: React.ReactNode = null;
            let statusPill: React.ReactNode = null;

            if ((variant as string) === "active") {
              if (c.status === "ACCEPTED") {
                statusPill = <StatusPill color="#60A5FA">Awaiting picks</StatusPill>;
                if (!fieldReady) {
                  cta = (
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                      Field not yet available — picks open Monday
                    </span>
                  );
                } else {
                  cta = (
                    <button
                      onClick={() => router.push(`/head-to-head/${c.id}/select-team`)}
                      style={{
                        padding: "8px 16px", border: "none", borderRadius: 5,
                        background: "#E8C96A", color: "#060D1F", fontWeight: 600, fontSize: 13,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      Pick your team
                    </button>
                  );
                }
              } else if (c.status === "LOCKED") {
                statusPill = <StatusPill color="#A78BFA">Both locked</StatusPill>;
                cta = (
                  <button
                    onClick={() => router.push(`/head-to-head/${c.id}/select-team`)}
                    style={{
                      padding: "8px 16px", border: "1px solid rgba(232,201,106,0.4)", borderRadius: 5,
                      background: "transparent", color: "#E8C96A", fontWeight: 500, fontSize: 13,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    View teams
                  </button>
                );
              } else if (c.status === "LIVE" || c.tournament?.status === "live") {
                statusPill = <StatusPill color="#4ADE80">Live</StatusPill>;
                cta = (
                  <button
                    onClick={() => router.push(`/head-to-head/${c.id}/select-team`)}
                    style={{
                      padding: "8px 16px", border: "none", borderRadius: 5,
                      background: "#E8C96A", color: "#060D1F", fontWeight: 600, fontSize: 13,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Watch live
                  </button>
                );
              }
            }

            void yourLocked; void youLocked;

            return (
              <div
                key={c.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto auto",
                  alignItems: "center",
                  gap: 16,
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    width: 44, height: 44, borderRadius: 5, background: "#060D1F",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden", flexShrink: 0,
                  }}
                >
                  {them?.photoUrl ? (
                    <img src={them.photoUrl} alt={them.name || "Opponent"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#E8C96A" }}>
                      {initialsFromName(them?.name)}
                    </span>
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ marginBottom: 2 }}>
                    <span style={{ color: "#fff", fontWeight: 500, fontSize: 15 }}>{c.challenger?.name}</span>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: "0 6px" }}>vs</span>
                    <span style={{ color: "#E8C96A", fontWeight: 600, fontSize: 15 }}>You</span>
                    {statusPill && <span style={{ marginLeft: 8 }}>{statusPill}</span>}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                    {c.tournament?.name}
                    {c.multiplier !== 1 && <span style={{ color: "#E8C96A", marginLeft: 6 }}>· {c.multiplier}x</span>}
                  </div>
                  {(variant as string) === "active" && (c.status === "LIVE" || c.tournament?.status === "live") &&
                    c.yourScore !== undefined && c.opponentScore !== undefined && (
                      <div style={{ marginTop: 4, fontSize: 13, color: "#fff" }}>
                        You: <strong style={{ color: c.yourScore.total < c.opponentScore.total ? "#4ADE80" : "#fff" }}>{c.yourScore.total}</strong>
                        {" "} · Them: <strong style={{ color: c.opponentScore.total < c.yourScore.total ? "#4ADE80" : "#fff" }}>{c.opponentScore.total}</strong>
                        <span style={{ color: "rgba(255,255,255,0.5)", marginLeft: 6 }}>(lower wins)</span>
                      </div>
                    )}
                </div>
                <div style={{ textAlign: "right" }}>
                  {variant === "past" ? (
                    <div style={{ color: resultColor, fontWeight: 600, fontSize: 14 }}>{resultLabel}</div>
                  ) : (
                    <>
                      <div style={{ color: "#E8C96A", fontWeight: 600, fontSize: 16 }}>{c.effectiveWager} pts</div>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>at stake</div>
                    </>
                  )}
                </div>
                {cta && <div style={{ flexShrink: 0 }}>{cta}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
