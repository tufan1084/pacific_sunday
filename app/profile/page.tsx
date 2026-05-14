"use client";

import { api } from "@/app/services/api";
import ProfileCard from "@/app/components/profile/ProfileCard";
import GolfPassport from "@/app/components/profile/GolfPassport";
import YourGolfStats from "@/app/components/profile/YourGolfStats";
import PointsHistory from "@/app/components/profile/PointsHistory";
import ProfileActions from "@/app/components/profile/ProfileActions";
import { Skeleton, SkeletonCard, shimmerCss } from "@/app/components/ui/Skeleton";
import { usePageData } from "@/app/hooks/usePageData";
import { CACHE_TTL } from "@/app/services/cache";

function ProfileSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
      <div className="flex flex-col gap-4">
        <div style={{ background: "#0f1a30", borderRadius: 8, padding: 24 }}>
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <Skeleton h={80} w={80} r={8} />
            <div style={{ flex: 1 }}>
              <Skeleton h={20} w="50%" mb={10} />
              <Skeleton h={14} w="35%" mb={8} />
              <Skeleton h={12} w="60%" />
            </div>
          </div>
          {[...Array(4)].map((_, i) => <Skeleton key={i} h={14} w={i % 2 === 0 ? "80%" : "60%"} mb={10} />)}
        </div>
        <SkeletonCard rows={6} />
      </div>
      <div className="flex flex-col gap-4">
        <SkeletonCard rows={5} />
        <SkeletonCard rows={4} />
        <SkeletonCard rows={2} />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data: profileData, loading, refresh } = usePageData<any>(
    "profile:page",
    async () => {
      const res = await api.profile.get();
      return res.success ? res.data : null;
    },
    CACHE_TTL.MEDIUM,
  );

  return (
    <>
      <style>{shimmerCss}</style>
      <div style={{ fontFamily: "var(--font-poppins), sans-serif", marginBottom: 24 }}>
        <span style={{ color: "#E8C96A", fontSize: "clamp(18px,2.5vw,25px)", fontWeight: 400 }}>My Profile</span>
      </div>

      {loading ? <ProfileSkeleton /> : (
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 items-stretch">
          <div className="flex flex-col gap-4">
            <ProfileCard profileData={profileData} />
            <GolfPassport profileData={profileData} onUpdate={refresh} />
          </div>
          <div className="flex flex-col gap-4">
            <YourGolfStats golfPassport={profileData?.golfPassport} />
            <div style={{ flex: 1 }}><PointsHistory transactions={profileData?.transactions} /></div>
            <ProfileActions />
          </div>
        </div>
      )}
    </>
  );
}
