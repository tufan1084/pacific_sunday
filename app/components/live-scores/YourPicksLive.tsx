import Image from "next/image";
import { YOUR_PICKS_LIVE } from "@/app/lib/live-scores-data";

const dividerStyle = {
  height: "1px",
  backgroundColor: "rgba(255,255,255,0.08)",
};

export default function YourPicksLive() {
  return (
    <div style={{ backgroundColor: "#13192A", borderRadius: "5px", marginBottom: "16px", marginTop: "24px", fontFamily: "var(--font-poppins), sans-serif" }}>
      {/* Section header */}
      <div className="flex items-center gap-2" style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Image src="/icons/nfc.svg" alt="live" width={20} height={20} style={{ filter: "brightness(0) saturate(100%) invert(82%) sepia(30%) saturate(800%) hue-rotate(5deg) brightness(100%)", flexShrink: 0 }} />
        <span style={{ color: "#E8C96A", fontSize: "clamp(14px, 1.5vw, 16px)", fontWeight: 500 }}>Your Picks — Live</span>
      </div>

      {/* Rows */}
      {YOUR_PICKS_LIVE.map((pick, i) => (
        <div key={i}>
          <div className="flex items-center" style={{ padding: "12px 16px", gap: "12px" }}>
            <div
              style={{
                width: "34px", height: "34px", borderRadius: "5px",
                backgroundColor: "#060D1F", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "10px", fontWeight: 700,
                color: "#E8C96A", flexShrink: 0,
              }}
            >
              {pick.tier}
            </div>
            <span style={{ color: "#E8C96A", fontSize: "clamp(13px, 1.5vw, 16px)", fontWeight: 400, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pick.name}</span>
            <span style={{ fontSize: "clamp(13px, 1.5vw, 16px)", fontWeight: 500, color: pick.scoreType === "negative" ? "#EF4444" : "#4ADE80", flexShrink: 0 }}>
              {pick.score}
            </span>
            <span style={{ color: "#FFFFFF", fontSize: "clamp(13px, 1.5vw, 16px)", flexShrink: 0, minWidth: "16px", textAlign: "right" }}>{pick.thru}</span>
          </div>
          {i < YOUR_PICKS_LIVE.length - 1 && <div style={dividerStyle} />}
        </div>
      ))}
    </div>
  );
}
