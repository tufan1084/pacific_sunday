import AchievementIcon from "@/app/components/achievements/AchievementIcon";
import { NEWLY_EARNED } from "@/app/lib/achievements-data";

export default function NewlyEarned() {
  return (
    <div style={{ marginTop: "24px", fontFamily: "var(--font-poppins), sans-serif" }}>
      <div style={{ color: "#E8C96A", fontSize: "clamp(15px, 1.5vw, 18px)", fontWeight: 400, marginBottom: "16px" }}>
        Newly Earned This Week
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4" style={{ maxWidth: "670px" }}>
        {NEWLY_EARNED.map((item, i) => (
          <div
            key={i}
            style={{ backgroundColor: "#13192A", borderRadius: "5px", padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}
          >
            <AchievementIcon type={item.icon} locked={false} />
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "#FFFFFF", fontSize: "clamp(12px, 1.2vw, 14px)", fontWeight: 400, marginBottom: "4px" }}>{item.title}</div>
              <div style={{ color: "#FFFFFF", fontSize: "clamp(12px, 1.2vw, 14px)", fontWeight: 400, marginBottom: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</div>
              <div style={{ color: "#E8C96A", fontSize: "clamp(13px, 1.3vw, 16px)", fontWeight: 400 }}>{item.pts}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
