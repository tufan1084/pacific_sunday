import { POINTS_HISTORY } from "@/app/lib/profile-data";

const dividerStyle = { height: "1px", backgroundColor: "rgba(255,255,255,0.08)" };

export default function PointsHistory() {
  return (
    <div style={{ backgroundColor: "#13192A", borderRadius: "5px", padding: "20px", fontFamily: "var(--font-poppins), sans-serif", height: "100%" }}>
      <div style={{ color: "#E8C96A", fontSize: "clamp(16px, 1.8vw, 20px)", fontWeight: 400, marginBottom: "16px" }}>Points History</div>

      {POINTS_HISTORY.map((item, i) => (
        <div key={i}>
          <div className="flex items-center justify-between gap-2" style={{ paddingTop: "12px", paddingBottom: "12px" }}>
            <div className="flex items-center gap-2" style={{ minWidth: 0, flex: 1 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "#E8C96A", fontSize: "clamp(12px, 1.3vw, 15px)", fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                <div style={{ color: "#FFFFFF", fontSize: "clamp(11px, 1.1vw, 13px)", fontWeight: 400, marginTop: "2px" }}>{item.date}</div>
              </div>
            </div>
            <span style={{ color: "#E8C96A", fontSize: "clamp(13px, 1.3vw, 15px)", fontWeight: 500, flexShrink: 0 }}>{item.value}</span>
          </div>
          {i < POINTS_HISTORY.length - 1 && <div style={dividerStyle} />}
        </div>
      ))}
    </div>
  );
}
