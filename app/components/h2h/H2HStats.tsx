import StatsCards from "@/app/components/ui/StatsCards";
import type { H2HStatCard } from "@/app/types/h2h";

interface H2HStatsProps {
  stats: H2HStatCard[];
}

export default function H2HStats({ stats }: H2HStatsProps) {
  return <StatsCards stats={stats} cols={3} maxWidth="75%" marginBottom="24px" />;
}
