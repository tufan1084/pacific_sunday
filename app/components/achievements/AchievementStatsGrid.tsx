import { ACHIEVEMENT_STATS } from "@/app/lib/achievements-data";

export default function AchievementStatsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4" style={{ marginTop: "30px", fontFamily: "var(--font-poppins), sans-serif", maxWidth: "750px" }}>
      {ACHIEVEMENT_STATS.map((stat, i) => (
        <div key={i} style={{ backgroundColor: "#13192A", borderRadius: "5px", padding: "16px" }}>
          <div style={{ color: "#E8C96A", fontSize: "clamp(20px, 2.5vw, 25px)", fontWeight: 400, lineHeight: 1.1 }}>
            {stat.value}
          </div>
          <div style={{ color: "#FFFFFF", fontSize: "clamp(12px, 1.3vw, 15px)", fontWeight: 400, marginTop: "6px" }}>
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
