import AchievementIcon from "@/app/components/achievements/AchievementIcon";

export interface NewlyEarnedItem {
  id: number;
  icon: string;
  title: string;
  description: string;
  pts: string;
  unlockedAt: string;
}

interface NewlyEarnedProps {
  items: NewlyEarnedItem[];
}

function formatRelativeUnlock(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffHours = (now.getTime() - d.getTime()) / 36e5;
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function NewlyEarned({ items }: NewlyEarnedProps) {
  if (items.length === 0) return null;

  return (
    <div style={{ marginTop: "24px", fontFamily: "var(--font-poppins), sans-serif" }}>
      <div style={{ color: "#E8C96A", fontSize: "clamp(15px, 1.5vw, 18px)", fontWeight: 400, marginBottom: "16px" }}>
        Newly Earned This Week
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4" style={{ maxWidth: "670px" }}>
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
              border: "1px solid rgba(232,201,106,0.18)",
            }}
          >
            <AchievementIcon type={item.icon} locked={false} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ color: "#FFFFFF", fontSize: "clamp(12px, 1.2vw, 14px)", fontWeight: 500, marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.title}
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "clamp(12px, 1.2vw, 14px)", fontWeight: 400, marginBottom: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.description}
              </div>
              <div className="flex items-center justify-between" style={{ gap: "8px" }}>
                <div style={{ color: "#E8C96A", fontSize: "clamp(13px, 1.3vw, 16px)", fontWeight: 500 }}>
                  {item.pts}
                </div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "clamp(11px, 1.1vw, 12px)" }}>
                  {formatRelativeUnlock(item.unlockedAt)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
