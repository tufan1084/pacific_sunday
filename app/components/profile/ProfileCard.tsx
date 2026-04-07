import { PROFILE_USER } from "@/app/lib/profile-data";

export default function ProfileCard() {
  const badges = [
    PROFILE_USER.rank,
    PROFILE_USER.pts,
    PROFILE_USER.weeks,
    PROFILE_USER.badges,
  ];

  return (
    <div style={{ backgroundColor: "#13192A", borderRadius: "5px", padding: "20px", fontFamily: "var(--font-poppins), sans-serif" }}>
      {/* Avatar + name */}
      <div className="flex items-center gap-3" style={{ marginBottom: "16px" }}>
        <div style={{ width: "50px", height: "50px", borderRadius: "3px", border: "1.5px solid #E8C96A", backgroundColor: "#060D1F", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "#E8C96A", fontSize: "18px", fontWeight: 600 }}>{PROFILE_USER.initials}</span>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ color: "#E8C96A", fontSize: "clamp(15px, 1.8vw, 20px)", fontWeight: 500 }}>{PROFILE_USER.name}</div>
          <div style={{ color: "#FFFFFF", fontSize: "clamp(11px, 1.2vw, 14px)", fontWeight: 400, marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {PROFILE_USER.username} · {PROFILE_USER.country} · {PROFILE_USER.member}
          </div>
        </div>
      </div>

      {/* Stat badges */}
      <div className="flex flex-wrap gap-2">
        {badges.map((badge, i) => (
          <div key={i} style={{ border: "1px solid #E8C96A", borderRadius: "999px", padding: "6px clamp(12px, 2vw, 24px)", display: "flex", alignItems: "center", justifyContent: "center", color: "#E8C96A", fontSize: "clamp(11px, 1.1vw, 13px)", fontWeight: 400, whiteSpace: "nowrap" }}>
            {badge}
          </div>
        ))}
      </div>
    </div>
  );
}
