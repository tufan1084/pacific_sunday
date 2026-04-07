import Image from "next/image";

interface ChallengeCardProps {
  icon: string;
  pts: string;
  title: string;
  description: string;
  progress: number;
  status: string;
  locked: boolean;
}

function ChallengeIcon({ type, locked }: { type: string; locked: boolean }) {
  const color = locked ? "rgba(255,255,255,0.25)" : "#E8C96A";
  if (type === "target") {
    return (
      <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
        <line x1="12" y1="2" x2="12" y2="4" />
        <line x1="20" y1="12" x2="22" y2="12" />
      </svg>
    );
  }
  if (type === "fire") {
    return (
      <Image src="/icons/streak.svg" alt="streak" width={46} height={46} style={{ flexShrink: 0, filter: "brightness(0) saturate(100%) invert(82%) sepia(30%) saturate(800%) hue-rotate(5deg) brightness(100%)" }} />
    );
  }
  return (
    <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export default function ChallengeCard({ icon, pts, title, description, progress, status, locked }: ChallengeCardProps) {
  const textColor = locked ? "rgba(255,255,255,0.35)" : "#FFFFFF";
  const goldColor = locked ? "rgba(232,201,106,0.35)" : "#E8C96A";
  const progressBg = locked ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.1)";
  const progressFill = locked ? "rgba(232,201,106,0.3)" : "#E8C96A";

  return (
    <div style={{ backgroundColor: "#13192A", borderRadius: "5px", padding: "clamp(14px, 2vw, 20px)", fontFamily: "var(--font-poppins), sans-serif", display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Top row: icon + pts */}
      <div className="flex items-center justify-between">
        <ChallengeIcon type={icon} locked={locked} />
        <span style={{ color: goldColor, fontSize: "clamp(14px, 1.5vw, 18px)", fontWeight: 500 }}>{pts}</span>
      </div>

      {/* Title + description */}
      <div>
        <div style={{ color: textColor, fontSize: "clamp(13px, 1.4vw, 16px)", fontWeight: 500, marginBottom: "4px" }}>{title}</div>
        <div style={{ color: locked ? "rgba(255,255,255,0.25)" : "#8F8F8F", fontSize: "clamp(13px, 1.3vw, 16px)", fontWeight: 400 }}>{description}</div>
      </div>

      {/* Progress bar */}
      <div style={{ height: "4px", backgroundColor: "#FFFFFF", borderRadius: "999px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress}%`, backgroundColor: progressFill, borderRadius: "999px" }} />
      </div>

      {/* Status */}
      <div style={{ color: locked ? "rgba(255,255,255,0.25)" : "#8F8F8F", fontSize: "clamp(11px, 1.1vw, 14px)", fontWeight: 400 }}>{status}</div>
    </div>
  );
}
