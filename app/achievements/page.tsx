import AchievementStatsGrid from "@/app/components/achievements/AchievementStatsGrid";
import NewlyEarned from "@/app/components/achievements/NewlyEarned";
import AllAchievements from "@/app/components/achievements/AllAchievements";

export default function AchievementsPage() {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
        <span style={{ color: "#E8C96A", fontSize: "clamp(18px, 2.5vw, 25px)", fontWeight: 400 }}>Achievements</span>
        <span style={{ color: "#E8C96A", fontSize: "clamp(13px, 1.3vw, 16px)", fontWeight: 400 }}>11/18 Earned</span>
      </div>

      {/* Stats */}
      <AchievementStatsGrid />

      {/* Newly Earned */}
      <NewlyEarned />

      {/* All Achievements */}
      <AllAchievements />
    </>
  );
}
