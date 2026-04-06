import FantasyHeader from "@/app/components/fantasy/FantasyHeader";
import FantasyStats from "@/app/components/fantasy/FantasyStats";
import ProjectedScore from "@/app/components/fantasy/ProjectedScore";
import TierPickList from "@/app/components/fantasy/TierPickList";
import LiveClubBoard from "@/app/components/fantasy/LiveClubBoard";
import LockPicksFooter from "@/app/components/fantasy/LockPicksFooter";
import {
  FANTASY_STATS,
  PROJECTED_PICKS,
  PROJECTED_TOTAL,
  TIER_SECTIONS,
  CLUB_BOARD,
} from "@/app/lib/fantasy-data";

export default function FantasyGolfPage() {
  return (
    <>
      {/* Header: Title + Lock Picks */}
      <FantasyHeader picksCount={3} totalPicks={5} />

      {/* 3 Stats cards */}
      <FantasyStats stats={FANTASY_STATS} />

      {/* Projected Score with progress bars */}
      <ProjectedScore picks={PROJECTED_PICKS} totalPoints={PROJECTED_TOTAL} />

      {/* Lower grid: Tier Lists (left) + Live Club Board (right) */}
      <div
        className="grid grid-cols-1 md:grid-cols-[3fr_2fr] items-start gap-4"
      >
        {/* Left — Tier pick lists + Lock button */}
        <div>
          <TierPickList sections={TIER_SECTIONS} />
          <LockPicksFooter />
        </div>

        {/* Right — Live Club Board */}
        <LiveClubBoard entries={CLUB_BOARD} />
      </div>
    </>
  );
}
