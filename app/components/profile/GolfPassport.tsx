"use client";

import { useState, useRef } from "react";

const inputStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#182037",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "5px",
  color: "#FFFFFF",
  fontFamily: "var(--font-poppins), sans-serif",
  fontSize: "14px",
  fontWeight: 400,
  outline: "none",
  padding: "10px 14px",
};

const labelStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.6)",
  fontSize: "14px",
  fontWeight: 400,
  fontFamily: "var(--font-poppins), sans-serif",
  marginBottom: "6px",
  display: "block",
};

export default function GolfPassport() {
  const [form, setForm] = useState({
    fullName: "Jordan Davidson",
    nickname: "J-Dav",
    handicap: "8.4",
    bestScore: "72(-2)",
    yearsPlaying: "14",
    homeCourse: "Royal Colwood GC, Victoria BC",
    country: "Canada",
    bio: "Golf obsessed 🏌️ Team Canada bag owner · Always chasing the big drive · Pebble is my happy place 🌊",
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const update = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div style={{ backgroundColor: "#13192A", borderRadius: "5px", padding: "20px", fontFamily: "var(--font-poppins), sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: "16px" }}>
        <span style={{ color: "#E8C96A", fontSize: "clamp(16px, 1.8vw, 20px)", fontWeight: 400 }}>Golf Passport</span>
        <button className="hidden sm:block" style={{ backgroundColor: "#E8C96A", color: "#060D1F", border: "none", borderRadius: "5px", padding: "8px 20px", fontSize: "14px", fontWeight: 500, fontFamily: "var(--font-poppins), sans-serif", cursor: "pointer", whiteSpace: "nowrap" }}>
          Save
        </button>
      </div>
      <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.08)", marginLeft: "-20px", marginRight: "-20px", marginBottom: "16px" }} />

      {/* Full Name + Nickname */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginBottom: "12px" }}>
        <div><label style={labelStyle}>Full Name</label><input style={inputStyle} value={form.fullName} onChange={e => update("fullName", e.target.value)} /></div>
        <div><label style={labelStyle}>Nickname</label><input style={inputStyle} value={form.nickname} onChange={e => update("nickname", e.target.value)} /></div>
      </div>

      {/* Handicap + Best Score + Years Playing */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ marginBottom: "12px" }}>
        <div><label style={labelStyle}>Handicap</label><input style={inputStyle} value={form.handicap} onChange={e => update("handicap", e.target.value)} /></div>
        <div><label style={labelStyle}>Best Score Ever</label><input style={inputStyle} value={form.bestScore} onChange={e => update("bestScore", e.target.value)} /></div>
        <div><label style={labelStyle}>Years Playing</label><input style={inputStyle} value={form.yearsPlaying} onChange={e => update("yearsPlaying", e.target.value)} /></div>
      </div>

      {/* Home Golf Course + Country */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginBottom: "12px" }}>
        <div><label style={labelStyle}>Home Golf Course</label><input style={inputStyle} value={form.homeCourse} onChange={e => update("homeCourse", e.target.value)} /></div>
        <div><label style={labelStyle}>Country</label><input style={inputStyle} value={form.country} onChange={e => update("country", e.target.value)} /></div>
      </div>

      {/* Bio */}
      <div style={{ marginBottom: "12px" }}>
        <label style={labelStyle}>Bio — Show off!</label>
        <textarea style={{ ...inputStyle, resize: "none", lineHeight: "1.6" }} rows={3} value={form.bio} onChange={e => update("bio", e.target.value)} />
      </div>

      {/* Profile Photo */}
      <div>
        <label style={labelStyle}>Profile Photo</label>
        <div
          onClick={() => fileRef.current?.click()}
          style={{ ...inputStyle, padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer", textAlign: "center" }}
        >
          {photo ? (
            <img src={photo} alt="preview" style={{ maxHeight: "80px", borderRadius: "4px", objectFit: "contain" }} />
          ) : (
            <>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span style={{ color: "#FFFFFF", fontSize: "14px" }}>Click to upload profile photo</span>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>JPG, PNG up to 10MB</span>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) setPhoto(URL.createObjectURL(f)); }} />
      </div>

      {/* Save button — after form on mobile */}
      <div className="flex sm:hidden" style={{ marginTop: "16px" }}>
        <button style={{ backgroundColor: "#E8C96A", color: "#060D1F", border: "none", borderRadius: "5px", padding: "10px 32px", fontSize: "14px", fontWeight: 500, fontFamily: "var(--font-poppins), sans-serif", cursor: "pointer", width: "100%" }}>
          Save
        </button>
      </div>
    </div>
  );
}
