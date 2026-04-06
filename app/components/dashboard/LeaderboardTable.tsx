import Link from "next/link";
import Image from "next/image";
import type { LeaderboardEntry } from "@/app/types";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

const cardStyle = { backgroundColor: "#13192A", borderRadius: "5px", padding: "20px 16px", fontFamily: "var(--font-poppins), sans-serif" };
const dividerStyle = { height: "1.5px", backgroundColor: "rgba(255,255,255,0.15)", marginLeft: "-16px", marginRight: "-16px" };

export default function LeaderboardTable({ entries }: LeaderboardTableProps) {
  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "20px", paddingTop: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Image src="/icons/dashboard_leaderboard.svg" alt="Leaderboard" width={24} height={24} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: "clamp(15px, 1.8vw, 18px)", color: "#E8C96A", fontWeight: 600 }}>
            This Week&apos;s Leaderboard
          </div>
        </div>
        <Link href="/leaderboard" style={{ border: "1px solid #E8C96A", color: "#E8C96A", padding: "6px 16px", borderRadius: "5px", fontSize: "clamp(12px, 1.2vw, 13px)", fontWeight: 400, textDecoration: "none", whiteSpace: "nowrap" }}>
          View All
        </Link>
      </div>
      <div style={dividerStyle} />

      {entries.map((entry, index) => (
        <div key={entry.rank}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: "clamp(56px, 5vw, 68px)", paddingTop: "4px", paddingBottom: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <span style={{ color: "#E8C96A", width: "16px", textAlign: "right", flexShrink: 0, fontSize: "clamp(12px, 1.3vw, 16px)" }}>
                {entry.rank}.
              </span>
              <div style={{ width: "38px", height: "38px", borderRadius: "5px", backgroundColor: "#060D1F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#E8C96A", flexShrink: 0 }}>
                {entry.initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "#E8C96A", fontWeight: 500, fontSize: "clamp(13px, 1.3vw, 16px)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.name}</div>
                <div style={{ color: "#FFFFFF", fontSize: "clamp(12px, 1.2vw, 15px)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.club}</div>
              </div>
            </div>
            <span style={{ color: "#E8C96A", fontWeight: 500, fontSize: "clamp(13px, 1.3vw, 16px)", flexShrink: 0, marginLeft: "8px" }}>
              {entry.score.toLocaleString()}
            </span>
          </div>
          {index < entries.length - 1 && <div style={dividerStyle} />}
        </div>
      ))}
    </div>
  );
}
