import StatsCards from "@/app/components/ui/StatsCards";

interface LeaderboardStatsGridProps {
  userRank: number | null;
  pointsBehind: number;
  totalOwners: number;
  userPoints: number;
  isRank1: boolean;
}

export default function LeaderboardStatsGrid({ userRank, pointsBehind, totalOwners, userPoints, isRank1 }: LeaderboardStatsGridProps) {
  const stats = [
    {
      label: "Your Rank",
      value: userRank ? `#${userRank.toLocaleString()}` : "—",
      icon: "/icons/trophy.svg",
    },
    {
      label: isRank1 ? "Your Points" : "Points Behind #1",
      value: isRank1 ? userPoints.toLocaleString() : pointsBehind.toLocaleString(),
      icon: "/icons/points.svg",
    },
    {
      label: "Total Owners",
      value: totalOwners.toLocaleString(),
      icon: "/icons/users.svg",
    },
  ];

  return <StatsCards stats={stats} maxWidth="750px" />;
}
