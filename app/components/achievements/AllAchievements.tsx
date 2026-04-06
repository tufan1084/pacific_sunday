import AchievementIcon from "@/app/components/achievements/AchievementIcon";
import { ALL_ACHIEVEMENTS } from "@/app/lib/achievements-data";

export default function AllAchievements() {
  return (
    <div style={{ borderRadius: "5px", padding: "20px 16px", marginTop: "24px", border: "1px solid #132D3A", fontFamily: "var(--font-poppins), sans-serif" }}>
      <div style={{ color: "#E8C96A", fontSize: "clamp(15px, 1.5vw, 18px)", fontWeight: 400, marginBottom: "20px" }}>
        All Achievements
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {ALL_ACHIEVEMENTS.map((item, i) => (
          <div
            key={i}
            style={{
              backgroundColor: "#13192A",
              borderRadius: "5px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              opacity: item.locked ? 0.45 : 1,
            }}
          >
            <AchievementIcon type={item.icon} locked={item.locked} />
            <div style={{ minWidth: 0 }}>
              <div style={{ color: item.locked ? "rgba(255,255,255,0.4)" : "#FFFFFF", fontSize: "clamp(12px, 1.2vw, 14px)", fontWeight: 400, marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.title}
              </div>
              <div style={{ color: item.locked ? "rgba(255,255,255,0.3)" : "#FFFFFF", fontSize: "clamp(12px, 1.2vw, 14px)", fontWeight: 400, marginBottom: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.description}
              </div>
              <div style={{ color: item.locked ? "rgba(232,201,106,0.3)" : "#E8C96A", fontSize: "clamp(13px, 1.3vw, 16px)", fontWeight: 400 }}>
                {item.pts}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
