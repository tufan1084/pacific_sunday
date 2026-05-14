"use client";

import AchievementStatsGrid from "@/app/components/achievements/AchievementStatsGrid";
import NewlyEarned, { type NewlyEarnedItem } from "@/app/components/achievements/NewlyEarned";
import AllAchievements, { type AllAchievementsItem } from "@/app/components/achievements/AllAchievements";
import { api, type ApiChallengeTrigger, type ApiMyChallenge } from "@/app/services/api";
import { SkeletonGrid, SkeletonStats, shimmerCss } from "@/app/components/ui/Skeleton";
import { usePageData } from "@/app/hooks/usePageData";
import { CACHE_TTL } from "@/app/services/cache";

const TRIGGER_ICON: Record<ApiChallengeTrigger, string> = {
  bag_registered: "bag", profile_completed: "user", h2h_won: "trophy",
  reward_redeemed: "gift", nfc_tap_5x_month: "fire", referral: "users",
};
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function AchievementsSkeleton() {
  return (<><SkeletonStats cols={3} /><SkeletonGrid cols={3} count={6} /></>);
}

export default function AchievementsPage() {
  const hasToken = typeof window !== "undefined" && Boolean(localStorage.getItem("ps_token"));

  const { data, loading } = usePageData<ApiMyChallenge[]>(
    "achievements:page",
    async () => {
      const res = hasToken ? await api.challenges.listMine() : await api.challenges.list();
      if (!res.success || !res.data) return [];
      return hasToken ? res.data.challenges as ApiMyChallenge[] : res.data.challenges.map(c => ({
        id: c.id, triggerType: c.triggerType as ApiChallengeTrigger,
        title: c.title, description: c.description, points: c.points,
        unlocked: false, unlockedAt: null, progress: 0,
      }));
    },
    CACHE_TTL.MEDIUM,
  );
  const items = data ?? [];

  const total = items.length;
  const earned = items.filter(c => c.unlocked).length;
  const locked = total - earned;
  const bonusPoints = items.filter(c => c.unlocked).reduce((s, c) => s + c.points, 0);
  const sinceWeekAgo = Date.now() - ONE_WEEK_MS;

  const newlyEarned: NewlyEarnedItem[] = items
    .filter(c => c.unlocked && c.unlockedAt && new Date(c.unlockedAt).getTime() >= sinceWeekAgo)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
    .map(c => ({ id: c.id, icon: TRIGGER_ICON[c.triggerType] ?? "trophy", title: c.title, description: c.description, pts: `+${c.points} pts`, unlockedAt: c.unlockedAt! }));

  const allList: AllAchievementsItem[] = [...items]
    .sort((a, b) => {
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;
      if (a.unlocked && b.unlocked) return new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime();
      return a.id - b.id;
    })
    .map(c => ({ id: c.id, icon: TRIGGER_ICON[c.triggerType] ?? "trophy", title: c.title, description: c.description, pts: `+${c.points} pts`, locked: !c.unlocked }));

  return (
    <>
      <style>{shimmerCss}</style>
      <div className="flex items-center justify-between" style={{ fontFamily: "var(--font-poppins), sans-serif", marginBottom: 16 }}>
        <span style={{ color: "#E8C96A", fontSize: "clamp(18px,2.5vw,25px)", fontWeight: 400 }}>Achievements</span>
        {!loading && total > 0 && <span style={{ color: "#E8C96A", fontSize: "clamp(13px,1.3vw,16px)", fontWeight: 400 }}>{earned}/{total} Earned</span>}
      </div>
      {loading ? <AchievementsSkeleton /> : (
        <>
          <AchievementStatsGrid earned={earned} locked={locked} bonusPoints={bonusPoints} />
          <NewlyEarned items={newlyEarned} />
          <AllAchievements items={allList} />
        </>
      )}
    </>
  );
}
