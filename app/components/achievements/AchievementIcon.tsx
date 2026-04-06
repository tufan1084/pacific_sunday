export default function AchievementIcon({ type, locked }: { type: string; locked: boolean }) {
  const color = locked ? "rgba(255,255,255,0.2)" : "#E8C96A";
  if (type === "trophy") {
    return (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M6 9H4a2 2 0 0 1-2-2V5h4" />
        <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
        <path d="M12 17v4" />
        <path d="M8 21h8" />
        <path d="M6 5h12v6a6 6 0 0 1-12 0V5z" />
      </svg>
    );
  }
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
