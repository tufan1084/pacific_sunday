import { LEADERBOARD_ROWS } from "@/app/lib/leaderboard-data";
import Image from "next/image";

const thStyle: React.CSSProperties = {
  color: "#FFFFFF",
  fontSize: "16px",
  fontWeight: 400,
  padding: "8px 16px",
  textAlign: "left",
  backgroundColor: "#1D2640",
  fontFamily: "var(--font-poppins), sans-serif",
  whiteSpace: "nowrap",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

export default function FullRankingsTable() {
  return (
    <div style={{ backgroundColor: "#13192A", borderRadius: "5px", marginTop: "24px", fontFamily: "var(--font-poppins), sans-serif" }}>

      {/* Header */}
      <div className="flex items-center justify-between" style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2">
          <Image src="/icons/bar-chat.svg" alt="rankings" width={32} height={32} />
          <span style={{ color: "#E8C96A", fontSize: "18px", fontWeight: 400 }}>Full Rankings</span>
        </div>
        <div className="flex items-center gap-2">
          <Image src="/icons/nfc.svg" alt="live" width={18} height={18} />
          <span style={{ color: "#74FF6D", fontSize: "clamp(13px, 1.3vw, 15px)", fontWeight: 400 }}>R2 Live</span>
        </div>
      </div>

      {/* Table */}
      <div className="leaderboard-scroll" style={{ overflowX: "auto", overflowY: "auto", maxHeight: "420px", scrollbarWidth: "thin", scrollbarColor: "#999486 #313131" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "560px" }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
            <tr>
              <th style={thStyle}>Rank</th>
              <th style={thStyle}>Owner</th>
              <th style={thStyle}>Country</th>
              <th style={thStyle}>Bag</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Points</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Weeks</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Streak</th>
            </tr>
          </thead>
          <tbody>
            {LEADERBOARD_ROWS.map((row, i) => {
              const gold = row.isYou ? "#E8C96A" : "#FFFFFF";
              const rowBg = "transparent";
              const tdStyle: React.CSSProperties = {
                fontSize: "16px",
                fontWeight: 400,
                padding: "14px 16px",
                color: gold,
                fontFamily: "var(--font-poppins), sans-serif",
                whiteSpace: "nowrap",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                backgroundColor: rowBg,
              };
              return (
                <tr key={i}>
                  <td style={tdStyle}>{row.rank}.</td>
                  <td style={tdStyle}>{row.name}</td>
                  <td style={tdStyle}>{row.country}</td>
                  <td style={tdStyle}>{row.bag}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{row.points}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{row.weeks}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <span className="flex items-center justify-center gap-1">
                      {row.streak}
                      <Image src="/icons/streak.svg" alt="streak" width={24} height={24} style={{ filter: row.isYou ? "brightness(0) saturate(100%) invert(82%) sepia(30%) saturate(800%) hue-rotate(5deg) brightness(100%)" : undefined }} />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
