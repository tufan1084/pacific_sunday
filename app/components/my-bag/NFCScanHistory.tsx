const dividerStyle = { height: "1px", backgroundColor: "rgba(255,255,255,0.08)", marginLeft: "-24px", marginRight: "-24px" };

interface NFCScanHistoryProps {
  bagsData?: any;
}

export default function NFCScanHistory({ bagsData }: NFCScanHistoryProps) {
  const firstBag = bagsData?.bags?.[0];
  const scans = firstBag?.scans || [];

  const scanHistory = scans.map((scan: any) => ({
    date: new Date(scan.scanTime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
    label: `Scan #${scan.id}`,
  }));

  return (
    <div style={{ backgroundColor: "#13192A", borderRadius: "5px", padding: "24px", fontFamily: "var(--font-poppins), sans-serif", fontWeight: 400, height: "100%" }}>
      <div style={{ color: "#E8C96A", fontSize: "clamp(16px, 1.8vw, 20px)", fontWeight: 400, marginBottom: "16px" }}>
        NFC Scan History
      </div>
      <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.08)", marginLeft: "-24px", marginRight: "-24px" }} />

      {scanHistory.length === 0 ? (
        <div style={{ paddingTop: "24px", textAlign: "center", color: "#94A3B8", fontSize: "clamp(12px, 1.2vw, 14px)" }}>
          No scans yet. Tap your bag to record a scan.
        </div>
      ) : (
        scanHistory.map((scan: { date: string; label: string }, i: number) => (
          <div key={i}>
            <div className="flex items-center justify-between" style={{ paddingTop: "14px", paddingBottom: "14px", gap: "8px" }}>
              <span style={{ color: "#FFFFFF", fontSize: "clamp(12px, 1.2vw, 14px)", fontWeight: 400 }}>{scan.date}</span>
              <span style={{ color: "#FFFFFF", fontSize: "clamp(12px, 1.2vw, 14px)", fontWeight: 400, textAlign: "right" }}>{scan.label}</span>
            </div>
            {i < scanHistory.length - 1 && <div style={dividerStyle} />}
          </div>
        ))
      )}
    </div>
  );
}
