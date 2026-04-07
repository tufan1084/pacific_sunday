import { NFC_SCAN_HISTORY } from "@/app/lib/my-bag-data";

const dividerStyle = { height: "1px", backgroundColor: "rgba(255,255,255,0.08)", marginLeft: "-24px", marginRight: "-24px" };

export default function NFCScanHistory() {
  return (
    <div style={{ backgroundColor: "#13192A", borderRadius: "5px", padding: "24px", fontFamily: "var(--font-poppins), sans-serif", fontWeight: 400, height: "100%" }}>
      <div style={{ color: "#E8C96A", fontSize: "clamp(16px, 1.8vw, 20px)", fontWeight: 400, marginBottom: "16px" }}>
        NFC Scan History
      </div>
      <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.08)", marginLeft: "-24px", marginRight: "-24px" }} />

      {NFC_SCAN_HISTORY.map((scan, i) => (
        <div key={i}>
          <div className="flex items-center justify-between" style={{ paddingTop: "14px", paddingBottom: "14px", gap: "8px" }}>
            <span style={{ color: "#FFFFFF", fontSize: "clamp(12px, 1.2vw, 14px)", fontWeight: 400 }}>{scan.date}</span>
            <span style={{ color: "#FFFFFF", fontSize: "clamp(12px, 1.2vw, 14px)", fontWeight: 400, textAlign: "right" }}>{scan.device}</span>
          </div>
          {i < NFC_SCAN_HISTORY.length - 1 && <div style={dividerStyle} />}
        </div>
      ))}
    </div>
  );
}
