import Link from "next/link";
import type { Pick } from "@/app/types";

interface MyPicksProps {
  picks: Pick[];
  totalPicked: number;
  totalSlots: number;
}

const cardStyle = { backgroundColor: "#13192A", borderRadius: "5px", padding: "20px 16px", fontFamily: "var(--font-poppins), sans-serif" };
const dividerStyle = { height: "1.5px", backgroundColor: "rgba(255,255,255,0.15)", marginLeft: "-16px", marginRight: "-16px" };

export default function MyPicks({ picks, totalPicked, totalSlots }: MyPicksProps) {
  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "16px" }}>
        <div style={{ fontSize: "clamp(15px, 1.8vw, 18px)", color: "#E8C96A", fontWeight: 600 }}>My Picks</div>
        <span style={{ fontSize: "clamp(12px, 1.2vw, 14px)", color: "#E8C96A", fontWeight: 400 }}>
          {totalPicked}/{totalSlots} done
        </span>
      </div>
      <div style={dividerStyle} />

      {picks.map((pick, index) => (
        <div key={pick.tier}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: "clamp(48px, 4vw, 55px)", paddingTop: "4px", paddingBottom: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <span style={{ width: "38px", height: "38px", borderRadius: "5px", backgroundColor: "#060D1F", color: pick.status === "picked" ? "#E8C96A" : "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "clamp(11px, 1.2vw, 13px)", fontWeight: 500, flexShrink: 0 }}>
                {pick.tier}
              </span>
              {pick.status === "picked" ? (
                <span style={{ color: "#E8C96A", fontSize: "clamp(13px, 1.3vw, 16px)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pick.golfer}</span>
              ) : (
                <span style={{ color: "#EF4444", fontSize: "clamp(13px, 1.3vw, 16px)" }}>Not Picked</span>
              )}
            </div>
            {pick.status === "picked" ? (
              <span style={{ color: pick.score && pick.score.startsWith("-") ? "#EF4444" : "#74FF6D", fontWeight: 500, fontSize: "clamp(12px, 1.2vw, 14px)", flexShrink: 0, marginLeft: "8px" }}>
                {pick.score}
              </span>
            ) : (
              <Link href="/fantasy-golf/picks" style={{ backgroundColor: "#E8C96A", color: "#060D1F", padding: "4px 16px", borderRadius: "5px", fontSize: "clamp(12px, 1.2vw, 14px)", fontWeight: 500, textDecoration: "none", flexShrink: 0, marginLeft: "8px" }}>
                Pick
              </Link>
            )}
          </div>
          {index < picks.length - 1 && <div style={dividerStyle} />}
        </div>
      ))}
    </div>
  );
}
