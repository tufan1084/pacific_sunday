import { HOW_TO_EARN } from "@/app/lib/reward-store-data";

export default function HowToEarnPoints() {
  return (
    <div style={{ backgroundColor: "#13192A", borderRadius: "5px", padding: "20px clamp(16px, 3vw, 32px)", fontFamily: "var(--font-poppins), sans-serif" }}>
      {/* Header */}
      <div className="flex items-center gap-2" style={{ marginBottom: "16px" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#E8C96A" stroke="#E8C96A" strokeWidth="1">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span style={{ color: "#E8C96A", fontSize: "clamp(15px, 1.5vw, 18px)", fontWeight: 400 }}>How to Earn Points</span>
      </div>

      {/* Rows */}
      {HOW_TO_EARN.map((row, i) => (
        <div key={i} className="flex items-center justify-between" style={{ paddingTop: "14px", paddingBottom: "14px" }}>
          <span style={{ color: "#FFFFFF", fontSize: "clamp(13px, 1.3vw, 16px)", fontWeight: 400 }}>{row.label}</span>
          <span style={{ color: "#4ADE80", fontSize: "clamp(12px, 1.2vw, 16px)", fontWeight: 400, textAlign: "right", maxWidth: "60%" }}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}
