interface PointsSummaryCardProps {
  summary: {
    currentBalance: number;
    totalEarned: number;
    totalSpent: number;
    // Points reserved against open H2H challenges. Not deducted from the
    // wallet — restored when the challenge resolves (win/cancel) or moved to
    // the opponent if the user loses. Optional for backwards compatibility
    // with older API responses that didn't include it.
    heldBalance?: number;
  };
}

function StatIcon({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div
      style={{
        width: "32px",
        height: "32px",
        borderRadius: "8px",
        backgroundColor: `${color}26`,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto",
        marginBottom: "10px",
      }}
    >
      {children}
    </div>
  );
}

const wallet = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
  </svg>
);
const trendUp = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);
const trendDown = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

export default function PointsSummaryCard({ summary }: PointsSummaryCardProps) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #131A2E 0%, #171F36 50%, #1A2240 100%)",
        borderRadius: "12px",
        padding: "clamp(18px, 4vw, 26px) clamp(16px, 4vw, 28px)",
        marginBottom: "clamp(16px, 4vw, 20px)",
        fontFamily: "var(--font-poppins), sans-serif",
        border: "1px solid rgba(232,201,106,0.12)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr auto 1fr",
          gap: "clamp(8px, 2vw, 24px)",
          alignItems: "stretch",
        }}
      >
        {/* Current Balance */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <StatIcon color="#E8C96A">{wallet}</StatIcon>
          <div
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: "clamp(10px, 2.4vw, 11px)",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "clamp(4px, 1vw, 8px)",
            }}
          >
            Current Balance
          </div>
          <div
            style={{
              color: "#E8C96A",
              fontSize: "clamp(20px, 5vw, 30px)",
              fontWeight: 700,
              lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {summary.currentBalance.toLocaleString()}
            <span style={{ fontSize: "0.45em", fontWeight: 400, marginLeft: "4px", opacity: 0.7 }}>pts</span>
          </div>
          {summary.heldBalance && summary.heldBalance > 0 ? (
            <div
              style={{
                color: "rgba(232,201,106,0.75)",
                fontSize: "clamp(10px, 2.2vw, 11px)",
                fontWeight: 500,
                marginTop: "4px",
                lineHeight: 1.2,
              }}
              title="Reserved against your open H2H challenges. Returned if you win or cancel."
            >
              {summary.heldBalance.toLocaleString()} pts on hold
            </div>
          ) : null}
        </div>

        <div style={{ width: "1px", background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.12), transparent)", alignSelf: "stretch" }} />

        {/* Total Earned */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <StatIcon color="#4ADE80">{trendUp}</StatIcon>
          <div
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: "clamp(10px, 2.4vw, 11px)",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "clamp(4px, 1vw, 8px)",
            }}
          >
            Total Earned
          </div>
          <div
            style={{
              color: "#4ADE80",
              fontSize: "clamp(20px, 5vw, 30px)",
              fontWeight: 700,
              lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            +{summary.totalEarned.toLocaleString()}
            <span style={{ fontSize: "0.45em", fontWeight: 400, marginLeft: "4px", opacity: 0.7 }}>pts</span>
          </div>
        </div>

        <div style={{ width: "1px", background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.12), transparent)", alignSelf: "stretch" }} />

        {/* Total Spent */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <StatIcon color="#EF4444">{trendDown}</StatIcon>
          <div
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: "clamp(10px, 2.4vw, 11px)",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "clamp(4px, 1vw, 8px)",
            }}
          >
            Total Spent
          </div>
          <div
            style={{
              color: "#EF4444",
              fontSize: "clamp(20px, 5vw, 30px)",
              fontWeight: 700,
              lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            -{summary.totalSpent.toLocaleString()}
            <span style={{ fontSize: "0.45em", fontWeight: 400, marginLeft: "4px", opacity: 0.7 }}>pts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
