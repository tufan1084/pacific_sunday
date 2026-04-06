import Image from "next/image";
import YourPicksLive from "@/app/components/live-scores/YourPicksLive";
import FullLeaderboard from "@/app/components/live-scores/FullLeaderboard";

export default function LiveScoresPage() {
  return (
    <>
      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: "clamp(18px, 2.5vw, 25px)", color: "#E8C96A", fontWeight: 400 }}>
              Live Scores
            </span>
          <div className="flex items-center gap-1">
              <Image src="/icons/nfc.svg" alt="live" width={24} height={24} />
              <span style={{ color: "#74FF6D", fontSize: "16px", fontWeight: 400 }}>R2 Live</span>
            </div>
          </div>
          <div style={{ color: "#FFFFFF", fontSize: "16px", fontWeight: 400, marginTop: "4px" }}>
            The Masters 2026 · Round 2 Underway
          </div>
        </div>

        {/* Refresh button */}
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

      {/* Your Picks Live */}
      <YourPicksLive />

      {/* Full Leaderboard */}
      <FullLeaderboard />
    </>
  );
}
