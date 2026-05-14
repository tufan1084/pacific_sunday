import { REWARD_STATS } from "@/app/lib/reward-store-data";

export default function PointsSummary() {
  return (
    <div
      style={{
        backgroundColor: "#13192A",
        borderRadius: "5px",
        padding: "0",
        marginBottom: "16px",
        marginTop: "30px",
        fontFamily: "var(--font-poppins), sans-serif",
        display: "flex",
        alignItems: "stretch",
        flexWrap: "wrap",
      }}
    >
      {/* Points Available — 40% on large, full width on mobile */}
      <div style={{ flex: "1 1 40%", minWidth: "160px", padding: "24px 24px 24px 20px", borderRight: "1px solid rgba(255,255,255,0.12)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ color: "#E8C96A", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 600, lineHeight: 1.1 }}>
          {REWARD_STATS.pointsAvailable}
        </div>
        <div style={{ color: "#FFFFFF", fontSize: "clamp(14px, 1.5vw, 18px)", fontWeight: 400, marginTop: "6px" }}>
          Points Available
        </div>
      </div>

      {/* Redeemed Point + Active Day — 60% on large, full width on mobile */}
      <div style={{ flex: "1 1 60%", minWidth: "200px", padding: "24px 20px 24px clamp(24px, 6vw, 80px)", display: "flex", flexDirection: "column", gap: "6px", justifyContent: "center" }}>
        <div className="flex items-center justify-between">
          <span style={{ color: "#FFFFFF", fontSize: "clamp(14px, 1.5vw, 18px)", fontWeight: 400 }}>Redeemed Point</span>
          <span style={{ color: "#E8C96A", fontSize: "clamp(14px, 1.5vw, 18px)", fontWeight: 400 }}>{REWARD_STATS.redeemedPoint}</span>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ color: "#FFFFFF", fontSize: "clamp(14px, 1.5vw, 18px)", fontWeight: 400 }}>Active Day</span>
          <span style={{ color: "#E8C96A", fontSize: "clamp(14px, 1.5vw, 18px)", fontWeight: 400 }}>{REWARD_STATS.activeDay}</span>
        </div>
      </div>
    </div>
  );
}
