import StatsCards from "@/app/components/ui/StatsCards";
import { LEADERBOARD_STATS } from "@/app/lib/leaderboard-data";

export default function LeaderboardStatsGrid() {
  return <StatsCards stats={LEADERBOARD_STATS} maxWidth="750px" />;
}
