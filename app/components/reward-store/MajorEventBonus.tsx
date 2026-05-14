import { MAJOR_TAGS } from "@/app/lib/reward-store-data";

export default function MajorEventBonus() {
  return (
    <div style={{ backgroundColor: "#13192A", borderRadius: "5px", padding: "20px clamp(16px, 3vw, 32px)", fontFamily: "var(--font-poppins), sans-serif", marginBottom: "16px", marginTop: "30px" }}>
      {/* Header */}
      <div className="flex items-center gap-2" style={{ marginBottom: "12px" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#E8C96A" stroke="#E8C96A" strokeWidth="1">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span style={{ color: "#E8C96A", fontSize: "clamp(15px, 1.5vw, 18px)", fontWeight: 500 }}>Major Event Bonus</span>
      </div>

      {/* Description */}
      <p style={{ color: "#FFFFFF", fontSize: "clamp(12px, 1.2vw, 14px)", fontWeight: 400, lineHeight: 1.6, marginBottom: "16px" }}>
        All 4 Majors — Masters, US Open, The Open, PGA Championship — automatically earn double points on every pick.
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {MAJOR_TAGS.map((tag) => (
          <span
            key={tag}
            style={{
              border: "none",
              borderRadius: "4px",
              padding: "5px clamp(14px, 2vw, 24px)",
              color: "#E8C96A",
              fontSize: "clamp(12px, 1.2vw, 16px)",
              fontWeight: 400,
              backgroundColor: "#212B45",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
