import Image from "next/image";

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

interface FullLeaderboardProps {
  leaderboard: any[];
  tournamentName: string;
}

function getCountryFlag(country: string) {
  if (!country || country.length !== 2) return null;
  const code = country.toUpperCase();
  const offset = 127397;
  return String.fromCodePoint(...[...code].map((c) => c.charCodeAt(0) + offset));
}

function getScoreColor(score: string) {
  if (score === "-" || score === "E") return "rgba(255,255,255,0.5)";
  if (score.startsWith("-")) return "#4ADE80";
  return "#FF6B6B";
}

export default function FullLeaderboard({ leaderboard, tournamentName }: FullLeaderboardProps) {
  return (
    <div style={{ backgroundColor: "#13192A", borderRadius: "5px", fontFamily: "var(--font-poppins), sans-serif" }}>
      {/* Section header */}
      <div className="flex items-center gap-2" style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Image src="/icons/nfc.svg" alt="live" width={20} height={20} style={{ filter: "brightness(0) saturate(100%) invert(82%) sepia(30%) saturate(800%) hue-rotate(5deg) brightness(100%)", flexShrink: 0 }} />
        <span style={{ color: "#E8C96A", fontSize: "clamp(15px, 1.5vw, 18px)", fontWeight: 400 }}>Full Leaderboard — {tournamentName}</span>
      </div>

      {/* Table — horizontally scrollable on mobile */}
      <div className="leaderboard-scroll" style={{ overflowY: "auto", maxHeight: "380px", overflowX: "auto", scrollbarWidth: "thin", scrollbarColor: "#999486 #313131" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
            <tr>
              <th style={thStyle}>Pos</th>
              <th style={thStyle}>Player</th>
              <th style={{ ...thStyle, textAlign: "center" }}>R1</th>
              <th style={{ ...thStyle, textAlign: "center" }}>R2</th>
              <th style={{ ...thStyle, textAlign: "center" }}>R3</th>
              <th style={{ ...thStyle, textAlign: "center" }}>R4</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Total</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Thru</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ ...tdStyle, textAlign: "center", color: "rgba(255,255,255,0.4)", padding: "40px 20px" }}>
                  Waiting for first tee off · leaderboard updates hourly once play begins
                </td>
              </tr>
            ) : (
              leaderboard.map((row, i) => {
                const flag = getCountryFlag(row.country);
                const isLeader = i === 0;
                const round = (n: number) => row.rounds?.[n] || "-";
                
                return (
                  <tr key={row.playerId || i} style={dividerStyle}>
                    <td style={{ ...tdStyle, color: isLeader ? "#4ADE80" : "rgba(255,255,255,0.5)", fontWeight: isLeader ? 600 : 400 }}>
                      {row.position || "-"}
                    </td>
                    <td style={tdStyle}>
                      <div className="flex items-center" style={{ gap: "6px" }}>
                        {isLeader && <span style={{ fontSize: "14px" }}>🏆</span>}
                        <span style={{ color: isLeader ? "#4ADE80" : "#FFFFFF", fontWeight: isLeader ? 600 : 400 }}>
                          {row.name}
                        </span>
                        {flag && <span style={{ fontSize: "11px" }}>{flag}</span>}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center", color: getScoreColor(round(0)) }}>{round(0)}</td>
                    <td style={{ ...tdStyle, textAlign: "center", color: getScoreColor(round(1)) }}>{round(1)}</td>
                    <td style={{ ...tdStyle, textAlign: "center", color: getScoreColor(round(2)) }}>{round(2)}</td>
                    <td style={{ ...tdStyle, textAlign: "center", color: getScoreColor(round(3)) }}>{round(3)}</td>
                    <td style={{ ...tdStyle, textAlign: "center", color: getScoreColor(row.score), fontWeight: 600 }}>
                      {row.score || "E"}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                      {row.thru || "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
