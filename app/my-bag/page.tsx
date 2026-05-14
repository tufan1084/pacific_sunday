"use client";

import { api } from "@/app/services/api";
import BagOwnerCard from "@/app/components/my-bag/BagOwnerCard";
import BagDetails from "@/app/components/my-bag/BagDetails";
import NFCScanHistory from "@/app/components/my-bag/NFCScanHistory";
import { Skeleton, SkeletonList, shimmerCss } from "@/app/components/ui/Skeleton";
import { usePageData } from "@/app/hooks/usePageData";
import { usePullToRefresh } from "@/app/hooks/usePullToRefresh";
import { CACHE_TTL } from "@/app/services/cache";

function BagSkeleton() {
  return (
    <>
      <div style={{ background: "#0f1a30", borderRadius: 8, padding: 24, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Skeleton h={64} w={64} r={8} />
          <div style={{ flex: 1 }}>
            <Skeleton h={20} w="45%" mb={10} />
            <Skeleton h={13} w="30%" />
          </div>
          <Skeleton h={32} w={100} r={6} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[5fr_2fr] gap-4">
        <div style={{ background: "#0f1a30", borderRadius: 8, padding: 24 }}>
          <Skeleton h={18} w="40%" mb={20} />
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <Skeleton h={13} w="30%" /><Skeleton h={13} w="45%" />
            </div>
          ))}
        </div>
        <SkeletonList count={5} rowHeight={48} />
      </div>
    </>
  );
}

export default function MyBagPage() {
  const { data: bagsData, loading, refresh } = usePageData(
    "mybag:page",
    async () => {
      const res = await api.profile.getBags();
      return res.success ? res.data : null;
    },
    CACHE_TTL.MEDIUM,
  );

  const { indicator } = usePullToRefresh(refresh);

  return (
    <>
      {indicator}
      <style>{shimmerCss}</style>
      <div style={{ fontFamily: "var(--font-poppins), sans-serif", marginBottom: "clamp(16px,3vw,20px)" }}>
        <span style={{ color: "#E8C96A", fontSize: "clamp(18px,2.5vw,25px)", fontWeight: 400 }}>My Bag</span>
      </div>

      {loading ? <BagSkeleton /> : (
        <>
          <BagOwnerCard bagsData={bagsData} />
          <div className="grid grid-cols-1 lg:grid-cols-[5fr_2fr] gap-4 sm:gap-5 lg:gap-6 items-stretch" style={{ marginTop: "clamp(16px,3vw,20px)" }}>
            <BagDetails bagsData={bagsData} />
            <NFCScanHistory bagsData={bagsData} />
          </div>
        </>
      )}
    </>
  );
}
