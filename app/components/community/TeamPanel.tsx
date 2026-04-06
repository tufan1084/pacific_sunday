import Image from "next/image";
import Link from "next/link";
import type { TeamMember } from "@/app/types/community";

interface TeamPanelProps {
  members: TeamMember[];
}

const dividerStyle = {
  height: "1.5px",
  backgroundColor: "rgba(255,255,255,0.15)",
  marginLeft: "-16px",
  marginRight: "-16px",
};

export default function TeamPanel({ members }: TeamPanelProps) {
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
      <div className="flex items-center justify-between" style={{ paddingBottom: "20px", paddingTop: "8px" }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: "18px" }}><Image src="/icons/team-ryon.svg" alt="Team Ryan" width={20} height={20} style={{ filter: "brightness(0) saturate(100%) invert(82%) sepia(30%) saturate(800%) hue-rotate(5deg) brightness(100%)" }} /></span>
          <span style={{ fontSize: "16px", color: "#E8C96A", fontWeight: 400 }}>Team Ryan</span>
        </div>
        <span style={{ fontSize: "16px", color: "#888888", fontWeight: 400 }}>Your Team</span>
      </div>
      <div style={dividerStyle} />

      {/* Members */}
      {members.map((member, i) => (
        <div key={i}>
          <div className="flex items-center gap-3" style={{ paddingTop: "12px", paddingBottom: "12px" }}>
            <div
              style={{
                width: "38px", height: "38px", borderRadius: "5px",
                backgroundColor: "#060D1F", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "10px", fontWeight: 700,
                color: "#E8C96A", flexShrink: 0,
              }}
            >
              {member.initials}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ color: "#E8C96A", fontWeight: 500, fontSize: "clamp(13px, 1.3vw, 16px)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {member.name}
              </div>
              <div style={{ color: "#888888", fontSize: "clamp(12px, 1.1vw, 14px)", fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {member.preview} · {member.timeAgo}
              </div>
            </div>
          </div>
          {i < members.length - 1 && <div style={dividerStyle} />}
        </div>
      ))}

      {/* View All — matches LeaderboardTable style */}
      <div style={{ marginTop: "16px" }}>
        <Link
          href="/community/team"
          style={{
            display: "block", textAlign: "center",
            border: "1px solid #E8C96A", color: "#060D1F",
            backgroundColor: "#E8C96A",
            padding: "12px 24px", borderRadius: "5px",
            fontSize: "clamp(12px, 1.1vw, 14px)", fontWeight: 400,
            textDecoration: "none", fontFamily: "var(--font-poppins), sans-serif",
          }}
        >
          View All Team Ryan Members
        </Link>
      </div>
    </div>
  );
}
