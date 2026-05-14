"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/app/services/api";
import type { ApiSearchUser, ApiH2HTournament } from "@/app/services/api";
import { useToast } from "@/app/context/ToastContext";

interface NewChallengeModalProps {
  onClose: () => void;
  onCreated?: () => void;
}

interface UpcomingTournament {
  id: number;
  tournId: string;
  year: number;
  name: string;
  startDate: string | null;
  isMajor: boolean;
  h2hMultiplier: number | null;
  h2hBonusDescription: string | null;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#182037",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "5px",
  color: "#FFFFFF",
  fontFamily: "var(--font-poppins), sans-serif",
  fontSize: "15px",
  fontWeight: 400,
  outline: "none",
  padding: "12px 16px",
};

const labelStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.6)",
  fontSize: "14px",
  fontWeight: 400,
  fontFamily: "var(--font-poppins), sans-serif",
  marginBottom: "8px",
  display: "block",
};

export default function NewChallengeModal({ onClose, onCreated }: NewChallengeModalProps) {
  // ── Opponent search ──
  const [opponentQuery, setOpponentQuery] = useState("");
  const [opponentResults, setOpponentResults] = useState<ApiSearchUser[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<ApiSearchUser | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  // ── Tournament + wager ──
  const [tournaments, setTournaments] = useState<UpcomingTournament[]>([]);
  const [tournamentId, setTournamentId] = useState<string>("");
  const [wagerStr, setWagerStr] = useState("");
  const [trashTalk, setTrashTalk] = useState("");

  // ── Wallet ──
  const [available, setAvailable] = useState<number | null>(null);

  // ── Submit ──
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Initial loads: upcoming tournaments + wallet balance
  useEffect(() => {
    (async () => {
      try {
        const [tRes, wRes] = await Promise.all([
          api.golf.getTournaments(),
          api.points.getWallet(),
        ]);
        if (tRes.success && tRes.data) {
          const list = (tRes.data as { upcoming?: UpcomingTournament[] }).upcoming || [];
          setTournaments(list.slice(0, 4));
        }
        if (wRes.success && wRes.data) {
          const w = wRes.data.wallet;
          setAvailable(Math.max(0, w.balance - (w.heldBalance ?? 0)));
        }
      } catch (e) {
        // Silent — modal still usable, just without wallet hint
        console.warn("Failed to load modal data", e);
      }
    })();
  }, []);

  // Debounced opponent search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (selectedOpponent && opponentQuery === selectedOpponent.name) return;
    if (!opponentQuery.trim() || opponentQuery.trim().length < 2) {
      setOpponentResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await api.search.users(opponentQuery.trim());
        if (r.success && r.data) setOpponentResults(r.data.users.slice(0, 8));
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opponentQuery]);

  const tournament = tournaments.find((t) => t.id === Number(tournamentId)) || null;
  const multiplier = tournament?.h2hMultiplier && tournament.h2hMultiplier > 0 ? tournament.h2hMultiplier : 1;
  const wagerInt = parseInt(wagerStr, 10);
  const validWager = Number.isInteger(wagerInt) && wagerInt > 0;
  const effectiveWager = wagerInt; // Both players hold the base wager amount

  const insufficientFunds = validWager && available !== null && effectiveWager > available;

  const canSubmit =
    !!selectedOpponent &&
    tournamentId !== "" &&
    validWager &&
    !insufficientFunds &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !selectedOpponent || !tournamentId) return;
    
    const tournamentIdNum = Number(tournamentId);
    if (isNaN(tournamentIdNum)) {
      toast.error("Please select a valid tournament");
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await api.h2h.createChallenge({
        opponentId: selectedOpponent.id,
        tournamentId: tournamentIdNum,
        wager: wagerInt,
        trashTalk: trashTalk.trim() || undefined,
      });
      if (!res.success) throw new Error(res.message || "Failed to send challenge");
      toast.success("Challenge sent successfully!");
      onCreated?.();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send challenge");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#13192A",
          borderRadius: "8px",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "calc(100vh - 32px)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "var(--font-poppins), sans-serif",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}
        >
          <div className="flex items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span style={{ color: "#E8C96A", fontSize: "20px", fontWeight: 500 }}>New H2H Challenge</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#FFFFFF", fontSize: "20px", lineHeight: 1, padding: 0 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Opponent search */}
          <div style={{ position: "relative" }}>
            <label style={labelStyle}>Opponent</label>
            <input
              type="text"
              value={opponentQuery}
              onChange={(e) => {
                setOpponentQuery(e.target.value);
                setSelectedOpponent(null);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search by name or username"
              style={inputStyle}
              autoComplete="off"
            />
            {selectedOpponent && (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 5 }}>
                <div style={{ width: 40, height: 40, borderRadius: 5, overflow: "hidden", flexShrink: 0, background: "#182037", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {selectedOpponent.photoUrl ? (
                    <img src={selectedOpponent.photoUrl} alt={selectedOpponent.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ color: "#E8C96A", fontSize: 18, fontWeight: 600 }}>{selectedOpponent.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "#4ADE80", fontSize: 14, fontWeight: 500 }}>{selectedOpponent.name}</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>@{selectedOpponent.username}</div>
                </div>
              </div>
            )}
            {searchOpen && opponentResults.length > 0 && !selectedOpponent && (
              <div style={{
                position: "absolute", left: 0, right: 0, top: "100%", marginTop: 4, zIndex: 10,
                background: "#0E1426", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 5,
                maxHeight: 200, overflowY: "auto",
              }}>
                {opponentResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setSelectedOpponent(u);
                      setOpponentQuery(u.name);
                      setSearchOpen(false);
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 14px",
                      background: "transparent", border: "none", color: "#fff",
                      cursor: "pointer", fontFamily: "inherit", fontSize: 14,
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 5, overflow: "hidden", flexShrink: 0, background: "#182037", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {u.photoUrl ? (
                        <img src={u.photoUrl} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ color: "#E8C96A", fontSize: 16, fontWeight: 600 }}>{u.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 500 }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>@{u.username}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searchOpen && !searching && opponentQuery.trim().length >= 2 && opponentResults.length === 0 && !selectedOpponent && (
              <div style={{
                position: "absolute", left: 0, right: 0, top: "100%", marginTop: 4, zIndex: 10,
                background: "#0E1426", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 5,
                padding: "10px 14px", color: "rgba(255,255,255,0.5)", fontSize: 13,
              }}>
                No users found
              </div>
            )}
          </div>

          {/* Tournament + Wager */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Tournament</label>
              <div style={{ position: "relative" }}>
                <select
                  value={tournamentId}
                  onChange={(e) => setTournamentId(e.target.value)}
                  style={{ ...inputStyle, appearance: "none", cursor: "pointer", paddingRight: "36px" }}
                >
                  <option value="">Select…</option>
                  {tournaments.map((t) => (
                    <option key={`tourn-${t.id}`} value={t.id}>
                      {t.name}{t.h2hMultiplier && t.h2hMultiplier !== 1 ? ` (${t.h2hMultiplier}x)` : ""}
                    </option>
                  ))}
                </select>
                <div style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#FFFFFF" }}>▾</div>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Wager (pts)</label>
              <input
                type="number"
                min={1}
                value={wagerStr}
                onChange={(e) => setWagerStr(e.target.value)}
                placeholder="Enter points"
                style={inputStyle}
              />
              {available !== null && (
                <div style={{ marginTop: 6, fontSize: 12, color: insufficientFunds ? "#F87171" : "rgba(255,255,255,0.5)" }}>
                  {insufficientFunds
                    ? `Insufficient balance (need ${wagerInt}, have ${available})`
                    : `Available: ${available} pts`}
                </div>
              )}
            </div>
          </div>

          {/* Effective stake notice */}
          {tournament && validWager && (
            <div style={{
              padding: "10px 14px", borderRadius: 5,
              background: "rgba(232,201,106,0.08)", border: "1px solid rgba(232,201,106,0.3)",
              color: "#E8C96A", fontSize: 13,
            }}>
              {multiplier !== 1 ? (
                <>
                  {multiplier}x bonus → each side holds <strong>{wagerInt} pts</strong>; winner gets {wagerInt} (own) + {wagerInt} (opponent) + {Math.round(wagerInt * (multiplier - 1))} (bonus) = <strong>{Math.round(wagerInt * (multiplier + 1))} pts total</strong>.
                  {tournament.h2hBonusDescription && <div style={{ marginTop: 4, fontSize: 12, opacity: 0.85 }}>{tournament.h2hBonusDescription}</div>}
                </>
              ) : (
                <>Each side holds <strong>{wagerInt} pts</strong>; winner gets {wagerInt} (own) + {wagerInt} (opponent) = <strong>{wagerInt * 2} pts total</strong>.</>
              )}
            </div>
          )}

          {/* Trash Talk */}
          <div>
            <label style={labelStyle}>Trash Talk (optional)</label>
            <input
              type="text"
              value={trashTalk}
              onChange={(e) => setTrashTalk(e.target.value)}
              placeholder="Bring it on…"
              style={inputStyle}
              maxLength={200}
            />
          </div>

          {/* Send Challenge */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              width: "100%",
              backgroundColor: canSubmit ? "#E8C96A" : "rgba(232,201,106,0.4)",
              color: "#060D1F",
              border: "none",
              borderRadius: "5px",
              padding: "14px",
              fontSize: "16px",
              fontWeight: 500,
              fontFamily: "var(--font-poppins), sans-serif",
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            {submitting ? "Sending…" : "Send Challenge"}
          </button>

          {/* Bonus Description Below Button */}
          {tournament?.h2hBonusDescription && (
            <div style={{
              padding: "8px 12px",
              color: "#4ADE80",
              fontSize: "13px",
              textAlign: "left",
              fontWeight: 400,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>{tournament.h2hBonusDescription}</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
