"use client";

import ChallengeCard from "@/app/components/challenges/ChallengeCard";
import { api, type ApiChallengeTrigger, type ApiMyChallenge } from "@/app/services/api";
import { SkeletonGrid, shimmerCss } from "@/app/components/ui/Skeleton";
import { usePageData } from "@/app/hooks/usePageData";
import { CACHE_TTL } from "@/app/services/cache";

const TRIGGER_ICON: Record<ApiChallengeTrigger, string> = {
  bag_registered: "bag", profile_completed: "user", h2h_won: "trophy",
  reward_redeemed: "gift", nfc_tap_5x_month: "fire", referral: "users",
};

function formatUnlockedDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ChallengesPage() {
  const hasToken = typeof window !== "undefined" && Boolean(localStorage.getItem("ps_token"));

  const { data, loading } = usePageData<ApiMyChallenge[]>(
    "challenges:page",
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
  const challenges = data ?? [];

  const unlockedCount = challenges.filter(c => c.unlocked).length;

  return (
    <>
      <style>{shimmerCss}</style>
      <div className="flex items-center justify-between" style={{ fontFamily: "var(--font-poppins), sans-serif", marginBottom: 32 }}>
        <div>
          <div style={{ color: "#E8C96A", fontSize: "clamp(18px,2.5vw,25px)", fontWeight: 400 }}>Challenges</div>
          <div style={{ color: "#FFFFFF", fontSize: "clamp(13px,1.3vw,16px)", fontWeight: 400, marginTop: 6 }}>
            Complete challenges to earn bonus points and unlock achievements
          </div>
        </div>
        {!loading && challenges.length > 0 && (
          <span style={{ color: "#E8C96A", fontSize: "clamp(13px,1.3vw,16px)", fontWeight: 400 }}>{unlockedCount}/{challenges.length} Completed</span>
        )}
      </div>

      {loading && <SkeletonGrid cols={3} count={6} />}
      {!loading && challenges.length === 0 && <div style={{ color: "#8F8F8F", fontFamily: "var(--font-poppins), sans-serif", fontSize: 14 }}>No challenges available right now.</div>}
      {!loading && challenges.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {challenges.map(c => (
            <ChallengeCard key={c.id} icon={TRIGGER_ICON[c.triggerType] ?? "target"} pts={`+${c.points} pts`}
              title={c.title} description={c.description} progress={c.progress}
              status={c.unlocked ? `Completed ${formatUnlockedDate(c.unlockedAt)}`.trim() : `${c.progress}% complete`}
              locked={false}
            />
          ))}
        </div>
      )}
    </>
  );
}
