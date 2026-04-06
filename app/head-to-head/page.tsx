import H2HHeader from "@/app/components/h2h/H2HHeader";
import H2HStats from "@/app/components/h2h/H2HStats";
import ActiveChallengeCard from "@/app/components/h2h/ActiveChallengeCard";
import PastChallenges from "@/app/components/h2h/PastChallenges";
import { H2H_STATS, ACTIVE_CHALLENGE, PAST_CHALLENGES } from "@/app/lib/h2h-data";

export default function HeadToHeadPage() {
  return (
    <>
      {/* Header: Title + New Challenge */}
      <H2HHeader />

      {/* 3 Stats cards */}
      <H2HStats stats={H2H_STATS} />

      {/* Active Challenge Matchup */}
      <ActiveChallengeCard challenge={ACTIVE_CHALLENGE} />

      {/* Past Challenges Table */}
      <PastChallenges challenges={PAST_CHALLENGES} />
    </>
  );
}
