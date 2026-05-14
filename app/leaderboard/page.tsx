"use client";

import LeaderboardStatsGrid from "@/app/components/leaderboard/LeaderboardStatsGrid";
import FullRankingsTable from "@/app/components/leaderboard/FullRankingsTable";
import { api } from "@/app/services/api";
import { Skeleton, SkeletonStats, SkeletonList, shimmerCss } from "@/app/components/ui/Skeleton";
import { usePageData } from "@/app/hooks/usePageData";
import { CACHE_TTL } from "@/app/services/cache";

function LeaderboardSkeleton() {
  return (
    <>
      <SkeletonStats cols={3} />
      <div style={{ background: "#0f1a30", borderRadius: 8, padding: 20 }}>
        <Skeleton h={18} w="35%" mb={16} />
        <SkeletonList count={8} rowHeight={52} />
      </div>
    </>
  );
}

export default function LeaderboardPage() {
  const { data, loading } = usePageData(
    "leaderboard:page",
    async () => {
      const res = await api.leaderboard.getAll();
      return res.success ? res.data : null;
    },
    CACHE_TTL.SHORT,
  );

  const pointsBehind = data ? (data.userRank === 1 ? 0 : Math.max(0, data.rank1Points - data.userPoints)) : 0;

  return (
    <>
      <style>{shimmerCss}</style>
      <div className="flex flex-wrap items-start justify-between gap-2" style={{ fontFamily: "var(--font-poppins), sans-serif", marginBottom: 16 }}>
        <div>
          <div style={{ color: "#E8C96A", fontSize: "clamp(18px,2.5vw,25px)", fontWeight: 400 }}>Club Leaderboard</div>
          <div style={{ color: "#FFFFFF", fontSize: 16, fontWeight: 400, marginTop: 4 }}>
            All-time standings · {loading ? "—" : (data?.totalOwners || 0).toLocaleString()} owners
          </div>
        </div>
      </div>

      {loading ? <LeaderboardSkeleton /> : (
        <>
          <LeaderboardStatsGrid
            userRank={data?.userRank ?? null}
            pointsBehind={pointsBehind}
            totalOwners={data?.totalOwners ?? 0}
            userPoints={data?.userPoints ?? 0}
            isRank1={data?.userRank === 1}
          />
          <FullRankingsTable />
        </>
      )}
    </>
  );
}
