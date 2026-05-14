import StatsCards from "@/app/components/ui/StatsCards";

interface AchievementStatsGridProps {
  earned: number;
  locked: number;
  bonusPoints: number;
}

export default function AchievementStatsGrid({ earned, locked, bonusPoints }: AchievementStatsGridProps) {
  const stats = [
    { value: String(earned), label: "Badges Earned" },
    { value: String(locked), label: "Still Locked" },
    { value: `+${bonusPoints}`, label: "Bonus PTS from Badges" },
  ];
  return <StatsCards stats={stats} maxWidth="750px" />;
}
