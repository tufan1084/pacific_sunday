import StatsCards from "@/app/components/ui/StatsCards";
import type { FantasyStatCard } from "@/app/types/fantasy";

interface FantasyStatsProps {
  stats: FantasyStatCard[];
}

export default function FantasyStats({ stats }: FantasyStatsProps) {
  return <StatsCards stats={stats} cols={3} maxWidth="75%" marginBottom="24px" />;
}
