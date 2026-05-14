const dividerStyle = { height: "1px", backgroundColor: "rgba(255,255,255,0.08)", marginLeft: "-24px", marginRight: "-24px" };

interface NFCScanHistoryProps {
  bagsData?: any;
}

export default function NFCScanHistory({ bagsData }: NFCScanHistoryProps) {
  const firstBag = bagsData?.bags?.[0];
  const scans = firstBag?.scans || [];

  // Backend already returns scans ordered by scanTime DESC (latest first) —
  // see profileController.js. No client-side reversal needed.
  const scanHistory = scans.map((scan: any) => {
    const scanDate = new Date(scan.scanTime);

    return {
      date: scanDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      // deviceLabel is derived server-side at scan time. Older scans
      // recorded before the column existed will have null here.
      device: scan.deviceLabel || 'Unknown device',
    };
  });

  return (
    <div style={{ backgroundColor: "#13192A", borderRadius: "5px", fontFamily: "var(--font-poppins), sans-serif", fontWeight: 400, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "clamp(16px, 3vw, 24px) clamp(16px, 3vw, 24px) 0 clamp(16px, 3vw, 24px)" }}>
        <div style={{ color: "#E8C96A", fontSize: "clamp(16px, 1.8vw, 20px)", fontWeight: 400, marginBottom: "16px" }}>
          NFC Scan History
        </div>
      </div>
      <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.08)" }} />

      {scanHistory.length === 0 ? (
        <div style={{ padding: "clamp(24px, 4vw, 32px) clamp(16px, 3vw, 24px)", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "clamp(13px, 1.3vw, 14px)" }}>
          No scans recorded yet
        </div>
      ) : (
        // Container height is locked to ~5 rows (5 × 56px row min-height).
        // Anything beyond is reachable by scrolling within the panel — keeps
        // the my-bag layout from stretching off-screen when a user has dozens
        // of scans.
        <div style={{ overflowY: "auto", overflowX: "hidden", maxHeight: "280px", scrollbarWidth: "thin", scrollbarColor: "#999486 #313131", WebkitOverflowScrolling: "touch", touchAction: "pan-y", overscrollBehavior: "contain" }}>
          {scanHistory.map((scan: { date: string; device: string }, i: number) => (
            <div key={i}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ minHeight: "56px", paddingTop: "clamp(12px, 2vw, 16px)", paddingBottom: "clamp(12px, 2vw, 16px)", paddingLeft: "clamp(16px, 3vw, 24px)", paddingRight: "clamp(16px, 3vw, 24px)", gap: "clamp(4px, 1vw, 12px)", boxSizing: "border-box" }}>
                <div style={{ color: "#FFFFFF", fontSize: "clamp(12px, 1.3vw, 14px)", fontWeight: 400 }}>{scan.date}</div>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "clamp(11px, 1.2vw, 13px)", fontWeight: 400, textAlign: "right" }}>{scan.device}</span>
              </div>
              {i < scanHistory.length - 1 && <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.08)", marginLeft: "clamp(-16px, -3vw, -24px)", marginRight: "clamp(-16px, -3vw, -24px)" }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
