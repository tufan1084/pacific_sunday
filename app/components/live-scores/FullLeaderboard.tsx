import Image from "next/image";
import { FULL_LEADERBOARD } from "@/app/lib/live-scores-data";

const thStyle: React.CSSProperties = {
  color: "#FFFFFF",
  fontSize: "clamp(12px, 1.2vw, 14px)",
  fontWeight: 400,
  padding: "10px 12px",
  textAlign: "left",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  backgroundColor: "#1D2640",
  fontFamily: "var(--font-poppins), sans-serif",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  fontSize: "clamp(12px, 1.2vw, 15px)",
  fontWeight: 400,
  padding: "12px 12px",
  color: "#FFFFFF",
  fontFamily: "var(--font-poppins), sans-serif",
  whiteSpace: "nowrap",
};

const dividerStyle = {
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

export default function FullLeaderboard() {
  return (
    <div style={{ backgroundColor: "#13192A", borderRadius: "5px", fontFamily: "var(--font-poppins), sans-serif" }}>
      {/* Section header */}
      <div className="flex items-center gap-2" style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Image src="/icons/nfc.svg" alt="live" width={20} height={20} style={{ filter: "brightness(0) saturate(100%) invert(82%) sepia(30%) saturate(800%) hue-rotate(5deg) brightness(100%)", flexShrink: 0 }} />
        <span style={{ color: "#E8C96A", fontSize: "clamp(15px, 1.5vw, 18px)", fontWeight: 400 }}>Full Leaderboard — Masters 2026</span>
      </div>

      {/* Table — horizontally scrollable on mobile */}
      <div className="leaderboard-scroll" style={{ overflowY: "auto", maxHeight: "380px", overflowX: "auto", scrollbarWidth: "thin", scrollbarColor: "#999486 #313131" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "480px" }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
            <tr>
              <th style={thStyle}>Pos</th>
              <th style={thStyle}>Player</th>
              <th style={thStyle}>Country</th>
              <th style={{ ...thStyle, textAlign: "center" }}>R1</th>
              <th style={{ ...thStyle, textAlign: "center" }}>R2</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Total</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Thru</th>
            </tr>
          </thead>
          <tbody>
            {FULL_LEADERBOARD.map((row, i) => (
              <tr key={i} style={dividerStyle}>
                <td style={tdStyle}>{row.pos}.</td>
                <td style={tdStyle}>{row.name}</td>
                <td style={tdStyle}>{row.country}</td>
                <td style={{ ...tdStyle, textAlign: "center", color: row.r1.startsWith("-") ? "#EF4444" : "#4ADE80" }}>{row.r1}</td>
                <td style={{ ...tdStyle, textAlign: "center", color: row.r2.startsWith("-") ? "#EF4444" : "#4ADE80" }}>{row.r2}</td>
                <td style={{ ...tdStyle, textAlign: "center", color: row.totalType === "negative" ? "#EF4444" : "#4ADE80", fontWeight: 500 }}>{row.total}</td>
                <td style={{ ...tdStyle, textAlign: "center", color: row.thru === "F" ? "#EF4444" : "#E8C96A" }}>{row.thru}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
