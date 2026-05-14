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
  if (type === "bag") {
    return (
      <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2h12l1 6v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8z" />
        <path d="M9 2v6M15 2v6M5 8h14" />
      </svg>
    );
  }
  if (type === "user") {
    return (
      <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  }
  if (type === "trophy") {
    return (
      <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22M18 2H6v7a6 6 0 0 0 12 0V2z" />
      </svg>
    );
  }
  if (type === "gift") {
    return (
      <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 12 20 22 4 22 4 12" />
        <rect x="2" y="7" width="20" height="5" />
        <line x1="12" y1="22" x2="12" y2="7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </svg>
    );
  }
  if (type === "users") {
    return (
      <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
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
