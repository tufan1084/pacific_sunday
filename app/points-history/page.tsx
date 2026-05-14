"use client";

import { useState } from "react";
import { api } from "@/app/services/api";
import PointsSummaryCard from "@/app/components/points-history/PointsSummaryCard";
import TransactionCard from "@/app/components/points-history/TransactionCard";
import FilterDropdown from "@/app/components/points-history/FilterDropdown";
import { Skeleton, shimmerCss } from "@/app/components/ui/Skeleton";
import { usePageData } from "@/app/hooks/usePageData";
import { CACHE_TTL } from "@/app/services/cache";

function PointsHistorySkeleton() {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ background: "#0f1a30", borderRadius: 8, padding: 20 }}>
            <Skeleton h={13} w="60%" mb={10} /><Skeleton h={28} w="50%" />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ background: "#0f1a30", borderRadius: 8, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <Skeleton h={40} w={40} r={8} />
            <div style={{ flex: 1 }}><Skeleton h={13} w="55%" mb={8} /><Skeleton h={11} w="35%" /></div>
            <Skeleton h={18} w={60} />
          </div>
        ))}
      </div>
    </>
  );
}

export default function PointsHistoryPage() {
  const [filter, setFilter] = useState<{ year?: number; month?: number; type?: string }>({});

  const { data, loading, refresh } = usePageData(
    `points:history:${JSON.stringify(filter)}`,
    async () => {
      const res = await api.points.getHistory(filter);
      return res.success ? res.data : null;
    },
    CACHE_TTL.SHORT,
  );

  const summary = data?.summary ?? { currentBalance: 0, totalEarned: 0, totalSpent: 0 };
  const transactions = data?.transactions ?? [];

  return (
    <>
      <style>{shimmerCss}</style>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
        <div style={{ flex: "1 1 auto", minWidth: 200 }}>
          <div style={{ color: "#E8C96A", fontSize: "clamp(20px,4vw,25px)", fontWeight: 400 }}>Points History</div>
          <div style={{ color: "#FFFFFF", fontSize: "clamp(13px,3vw,16px)", fontWeight: 400, marginTop: 4 }}>Track your earnings and spending</div>
        </div>
        <FilterDropdown currentFilter={filter} onFilterChange={f => { setFilter(f); }} />
      </div>

      {loading ? <PointsHistorySkeleton /> : (
        <>
          <PointsSummaryCard summary={summary} />
          {transactions.length === 0 ? (
            <div style={{ backgroundColor: "#13192A", borderRadius: 5, padding: "40px 20px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-poppins), sans-serif", fontSize: 14 }}>No transactions found</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px,2vw,12px)" }}>
              {transactions.map((t: any) => <TransactionCard key={t.id} transaction={t} />)}
            </div>
          )}
        </>
      )}
    </>
  );
}
