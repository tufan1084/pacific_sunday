"use client";

import { useState, useEffect } from "react";

interface NewChallengeModalProps {
  onClose: () => void;
}

export default function NewChallengeModal({ onClose }: NewChallengeModalProps) {
  const [opponent, setOpponent] = useState("Jordan Davidson");
  const [tournament, setTournament] = useState("The Master 2026- 2X");
  const [wager, setWager] = useState("70 pts");
  const [trashTalk, setTrashTalk] = useState("The Master 2026- 2X");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

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

          {/* Opponent */}
          <div>
            <label style={labelStyle}>Opponent</label>
            <input
              type="text"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Tournament + Wager */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Tournament</label>
              <div style={{ position: "relative" }}>
                <select
                  value={tournament}
                  onChange={(e) => setTournament(e.target.value)}
                  style={{ ...inputStyle, appearance: "none", cursor: "pointer", paddingRight: "36px" }}
                >
                  <option>The Master 2026- 2X</option>
                  <option>US Open 2026</option>
                  <option>The Open 2026</option>
                </select>
                <div style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#FFFFFF" }}>▾</div>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Wager</label>
              <div style={{ position: "relative" }}>
                <select
                  value={wager}
                  onChange={(e) => setWager(e.target.value)}
                  style={{ ...inputStyle, appearance: "none", cursor: "pointer", paddingRight: "36px" }}
                >
                  <option>70 pts</option>
                  <option>50 pts</option>
                  <option>100 pts</option>
                  <option>150 pts</option>
                </select>
                <div style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#FFFFFF" }}>▾</div>
              </div>
            </div>
          </div>

          {/* Trash Talk */}
          <div>
            <label style={labelStyle}>Trash Talk!</label>
            <input
              type="text"
              value={trashTalk}
              onChange={(e) => setTrashTalk(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Major event notice */}
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span style={{ color: "#4ADE80", fontSize: "14px", fontFamily: "var(--font-poppins), sans-serif" }}>
              This is a major event - all point are doubleed.
            </span>
          </div>

          {/* Send Challenge */}
          <button
            style={{
              width: "100%",
              backgroundColor: "#E8C96A",
              color: "#060D1F",
              border: "none",
              borderRadius: "5px",
              padding: "14px",
              fontSize: "16px",
              fontWeight: 500,
              fontFamily: "var(--font-poppins), sans-serif",
              cursor: "pointer",
            }}
          >
            Send Challenge
          </button>

        </div>
      </div>
    </div>
  );
}
