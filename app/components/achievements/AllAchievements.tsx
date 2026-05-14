import AchievementIcon from "@/app/components/achievements/AchievementIcon";

export interface AllAchievementsItem {
  id: number;
  icon: string;
  title: string;
  description: string;
  pts: string;
  locked: boolean;
}

interface AllAchievementsProps {
  items: AllAchievementsItem[];
}

export default function AllAchievements({ items }: AllAchievementsProps) {
  return (
    <div
      style={{
        borderRadius: "5px",
        padding: "20px 16px",
        marginTop: "24px",
        border: "1px solid #132D3A",
        fontFamily: "var(--font-poppins), sans-serif",
      }}
    >
      <div style={{ color: "#E8C96A", fontSize: "clamp(15px, 1.5vw, 18px)", fontWeight: 400, marginBottom: "20px" }}>
        All Achievements
      </div>
      {items.length === 0 ? (
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>No achievements available.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: "#13192A",
                borderRadius: "5px",
                padding: "16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                opacity: item.locked ? 0.5 : 1,
                border: item.locked
                  ? "1px solid rgba(255,255,255,0.04)"
                  : "1px solid rgba(232,201,106,0.2)",
              }}
            >
              <AchievementIcon type={item.icon} locked={item.locked} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    color: item.locked ? "rgba(255,255,255,0.5)" : "#FFFFFF",
                    fontSize: "clamp(12px, 1.2vw, 14px)",
                    fontWeight: 500,
                    marginBottom: "4px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    color: item.locked ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.7)",
                    fontSize: "clamp(12px, 1.2vw, 14px)",
                    fontWeight: 400,
                    marginBottom: "8px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.description}
                </div>
                <div
                  style={{
                    color: item.locked ? "rgba(232,201,106,0.4)" : "#E8C96A",
                    fontSize: "clamp(13px, 1.3vw, 16px)",
                    fontWeight: 500,
                  }}
                >
                  {item.pts}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
