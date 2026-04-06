import StatsCards from "@/app/components/ui/StatsCards";
import { ACHIEVEMENT_STATS } from "@/app/lib/achievements-data";

export default function AchievementStatsGrid() {
  return <StatsCards stats={ACHIEVEMENT_STATS} maxWidth="750px" />;
}
