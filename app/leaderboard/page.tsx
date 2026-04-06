import LeaderboardStatsGrid from "@/app/components/leaderboard/LeaderboardStatsGrid";
import FullRankingsTable from "@/app/components/leaderboard/FullRankingsTable";

export default function LeaderboardPage() {
  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
        <div>
          <div style={{ color: "#E8C96A", fontSize: "clamp(18px, 2.5vw, 25px)", fontWeight: 400 }}>Club Leaderboard</div>
          <div style={{ color: "#FFFFFF", fontSize: "16px", fontWeight: 400, marginTop: "4px" }}>
            All-time standings · 847 owners
          </div>
        </div>
        <span style={{ color: "#E8C96A", fontSize: "clamp(13px, 1.3vw, 16px)", fontWeight: 400 }}>11/18 Earned</span>
      </div>

      {/* Stats */}
      <LeaderboardStatsGrid />

      {/* Full Rankings Table */}
      <FullRankingsTable />
    </>
  );
}
