import { REWARD_STATS } from "@/app/lib/reward-store-data";

export default function RewardStoreHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-8" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
      <span style={{ fontSize: "clamp(18px, 2.5vw, 25px)", color: "#E8C96A", fontWeight: 400 }}>
        Rewards Store
      </span>
      <button
        style={{
          display: "flex", alignItems: "center", gap: "8px",
          backgroundColor: "transparent",
          border: "1px solid #E8C96A",
          borderRadius: "5px",
          color: "#E8C96A",
          fontSize: "14px",
          fontWeight: 400,
          padding: "8px 20px",
          cursor: "pointer",
          fontFamily: "var(--font-poppins), sans-serif",
          flexShrink: 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        Refresh
      </button>
    </div>
  );
}
