interface LockPicksFooterProps {
  locked: boolean;
  lockDate: string;
  tournamentName: string;
}

// Picks lock at midnight PT of the tournament start day (see backend picksLocked).
// Format the displayed lock time in PT to match.
function formatLockDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  }) + ", 12:00 AM PT";
}

export default function LockPicksFooter({ locked, lockDate, tournamentName }: LockPicksFooterProps) {
  return (
    <div style={{ marginTop: "16px" }}>
      <button
        disabled={locked}
        style={{
          width: "100%",
          height: "clamp(44px, 4.5vw, 56px)",
          backgroundColor: locked ? "rgba(255,255,255,0.1)" : "#E8C96A",
          color: locked ? "rgba(255,255,255,0.35)" : "#060D1F",
          fontSize: "16px",
          fontWeight: 600,
          fontFamily: "var(--font-poppins), sans-serif",
          border: "none",
          borderRadius: "5px",
          cursor: locked ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
        }}
      >
        {locked ? "Picks Locked" : "Lock in my picks"}
      </button>
      <div
        style={{
          fontSize: "clamp(11px, 1vw, 14px)",
          color: locked ? "rgba(255,255,255,0.3)" : "#FFFFFF",
          fontWeight: 400,
          fontFamily: "var(--font-poppins), sans-serif",
          marginTop: "12px",
          textAlign: "center",
        }}
      >
        {locked
          ? `${tournamentName} is live · Picks are locked`
          : `Locks ${formatLockDate(lockDate)} · Cannot change after`}
      </div>
    </div>
  );
}
