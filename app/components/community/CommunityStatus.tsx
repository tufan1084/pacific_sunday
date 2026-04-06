import type { CommunityStats } from "@/app/types/community";

interface CommunityStatusProps {
  stats: CommunityStats[];
}

const dividerStyle = {
  height: "1.5px",
  backgroundColor: "rgba(255,255,255,0.15)",
  marginLeft: "-16px",
  marginRight: "-16px",
};

export default function CommunityStatus({ stats }: CommunityStatusProps) {
  return (
    <div
      style={{
        backgroundColor: "#13192A",
        borderRadius: "5px",
        padding: "20px 16px",
        fontFamily: "var(--font-poppins), sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ paddingBottom: "20px", paddingTop: "8px" }}>
        <span style={{ fontSize: "18px", color: "#E8C96A", fontWeight: 600 }}>Community Status</span>
      </div>
      <div style={dividerStyle} />

      {/* Stats */}
      {stats.map((stat, i) => (
        <div key={i}>
          <div className="flex items-center justify-between" style={{ paddingTop: "14px", paddingBottom: "14px" }}>
            <span style={{ color: "#E8C96A", fontSize: "clamp(13px, 1.3vw, 16px)", fontWeight: 400 }}>{stat.label}</span>
            <span style={{ color: "#E8C96A", fontSize: "clamp(13px, 1.3vw, 16px)", fontWeight: 400 }}>{stat.value}</span>
          </div>
          {i < stats.length - 1 && <div style={dividerStyle} />}
        </div>
      ))}
    </div>
  );
}
