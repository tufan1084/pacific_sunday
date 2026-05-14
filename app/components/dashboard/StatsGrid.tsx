import StatsCards from "@/app/components/ui/StatsCards";
import type { StatCard } from "@/app/types";

interface StatsGridProps {
  stats: StatCard[];
}

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <StatsCards
      stats={stats}
      cols={4}
      maxWidth="100%"
      marginBottom="10px"
    />
  );
}
