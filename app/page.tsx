import WelcomeSection from "@/app/components/dashboard/WelcomeSection";
import StatsGrid from "@/app/components/dashboard/StatsGrid";
import AnnouncementBanner from "@/app/components/dashboard/AnnouncementBanner";
import WeeklyChallenge from "@/app/components/dashboard/WeeklyChallenge";
import LeaderboardTable from "@/app/components/dashboard/LeaderboardTable";
import MyPicks from "@/app/components/dashboard/MyPicks";
import WeatherWidget from "@/app/components/dashboard/WeatherWidget";
import CommunityFeed from "@/app/components/dashboard/CommunityFeed";
import {
  DASHBOARD_STATS,
  LEADERBOARD_DATA,
  MY_PICKS,
  COMMUNITY_POSTS,
  WEATHER_DATA,
  ANNOUNCEMENT,
  WEEKLY_CHALLENGE,
} from "@/app/lib/constants";

export default function DashboardPage() {
  const totalPicked = MY_PICKS.filter((p) => p.status === "picked").length;
  const totalSlots = MY_PICKS.length;

  return (
    <>
      {/* Welcome */}
      <WelcomeSection
        userName="Jordan"
        countdown="2 days, 14 hrs"
        picksRemaining={2}
        currentRank={3}
      />

      {/* Stats */}
      <StatsGrid stats={DASHBOARD_STATS} />

      {/* Announcement */}
      <AnnouncementBanner announcement={ANNOUNCEMENT} />

      {/* Weekly Challenge */}
      <WeeklyChallenge challenge={WEEKLY_CHALLENGE} />

      {/* Leaderboard + Picks/Weather — 60/40 split */}
      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4 mb-4 items-start">
        <LeaderboardTable entries={LEADERBOARD_DATA} />
        <div className="flex flex-col gap-4">
          <MyPicks
            picks={MY_PICKS}
            totalPicked={totalPicked}
            totalSlots={totalSlots}
          />
          <WeatherWidget weather={WEATHER_DATA} />
        </div>
      </div>

      {/* Community Feed */}
      <CommunityFeed posts={COMMUNITY_POSTS} />
    </>
  );
}
