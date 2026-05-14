"use client";

import { useEffect, useState } from "react";
import WelcomeSection from "@/app/components/dashboard/WelcomeSection";
import StatsGrid from "@/app/components/dashboard/StatsGrid";
import AnnouncementBanner from "@/app/components/dashboard/AnnouncementBanner";
import WeeklyChallenge from "@/app/components/dashboard/WeeklyChallenge";
import LeaderboardTable from "@/app/components/dashboard/LeaderboardTable";
import MyPicks from "@/app/components/dashboard/MyPicks";
import TournamentSelector from "@/app/components/dashboard/TournamentSelector";
import WeatherWidget from "@/app/components/dashboard/WeatherWidget";
import CommunityFeed from "@/app/components/dashboard/CommunityFeed";
import { api } from "@/app/services/api";
import { resolveMediaUrl } from "@/app/lib/constants";
import { usePageData } from "@/app/hooks/usePageData";
import { CACHE_TTL } from "@/app/services/cache";

function PulseSkeleton({ height, width = "100%", radius = 6, style = {} }: {
  height: number | string; width?: number | string; radius?: number; style?: React.CSSProperties;
}) {
  return <div style={{ height, width, borderRadius: radius, background: "linear-gradient(90deg,#0f1a30 25%,#1a2540 50%,#0f1a30 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", ...style }} />;
}

function WelcomeSkeleton() {
  return <div style={{ marginBottom: 16 }}><PulseSkeleton height={28} width="40%" style={{ marginBottom: 10 }} /><PulseSkeleton height={16} width="60%" /></div>;
}
function StatsSkeleton() {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>{[...Array(4)].map((_, i) => <div key={i} style={{ background: "#0f1a30", borderRadius: 8, padding: 16 }}><PulseSkeleton height={28} width="60%" style={{ marginBottom: 8 }} /><PulseSkeleton height={14} width="80%" /></div>)}</div>;
}
function ChallengeSkeleton() {
  return <div style={{ background: "#0f1a30", borderRadius: 8, padding: 20, marginBottom: 16 }}><PulseSkeleton height={18} width="50%" style={{ marginBottom: 12 }} /><PulseSkeleton height={14} width="80%" style={{ marginBottom: 8 }} /><PulseSkeleton height={8} width="100%" radius={4} /></div>;
}
function LeaderboardSkeleton() {
  return <div style={{ background: "#0f1a30", borderRadius: 8, padding: 20 }}><PulseSkeleton height={20} width="40%" style={{ marginBottom: 16 }} />{[...Array(5)].map((_, i) => <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}><PulseSkeleton height={16} width={24} /><PulseSkeleton height={32} width={32} radius={5} /><PulseSkeleton height={16} width="50%" /><PulseSkeleton height={16} width={60} style={{ marginLeft: "auto" }} /></div>)}</div>;
}
function PicksSkeleton() {
  return <div style={{ background: "#0f1a30", borderRadius: 8, padding: 20 }}><PulseSkeleton height={18} width="50%" style={{ marginBottom: 14 }} />{[...Array(5)].map((_, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}><PulseSkeleton height={14} width={40} /><PulseSkeleton height={14} width="55%" /><PulseSkeleton height={14} width={40} /></div>)}</div>;
}
function FeedSkeleton() {
  return <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{[...Array(3)].map((_, i) => <div key={i} style={{ background: "#0f1a30", borderRadius: 8, padding: 20 }}><div style={{ display: "flex", gap: 10, marginBottom: 12 }}><PulseSkeleton height={40} width={40} radius={20} /><div style={{ flex: 1 }}><PulseSkeleton height={14} width="40%" style={{ marginBottom: 6 }} /><PulseSkeleton height={12} width="25%" /></div></div><PulseSkeleton height={14} width="90%" style={{ marginBottom: 6 }} /><PulseSkeleton height={14} width="70%" /></div>)}</div>;
}

export default function DashboardPage() {
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);

  // Backend's dashboard/overview response carries additional fields beyond
  // ApiDashboardOverview (tournaments[], picks[], etc.); typed as any here
  // until the interface catches up with the API.
  const { data: aboveFold, loading: aboveLoading } = usePageData<any>(
    "dashboard:overview",
    async () => { const res = await api.dashboard.getOverview(); return res.success ? res.data : null; },
    CACHE_TTL.SHORT,
  );

  const { data: leaderboardData, loading: leaderboardLoading } = usePageData(
    "leaderboard:page",
    async () => { const res = await api.leaderboard.getAll(); return res.success ? res.data : null; },
    CACHE_TTL.SHORT,
  );

  const { data: challengesRes, loading: challengesLoading } = usePageData(
    "challenges:mine",
    async () => { const res = await api.challenges.listMine(); return res.success ? res.data : null; },
    CACHE_TTL.MEDIUM,
  );

  const { data: postsRes, loading: postsLoading } = usePageData(
    "dashboard:posts",
    async () => { const res = await api.posts.getAll(5, 0); return res.success ? res.data : null; },
    CACHE_TTL.SHORT,
  );

  useEffect(() => {
    if (aboveFold?.tournaments?.length > 0 && !selectedTournamentId)
      setSelectedTournamentId(aboveFold.tournaments[0].id);
  }, [aboveFold, selectedTournamentId]);

  const challengesData = (challengesRes as any)?.challenges || [];

  useEffect(() => {
    if (challengesData.length <= 1) return;
    const interval = setInterval(() => setCurrentChallengeIndex(p => (p + 1) % challengesData.length), 10000);
    return () => clearInterval(interval);
  }, [challengesData.length]);

  const goNext = () => setCurrentChallengeIndex(p => Math.min(p + 1, challengesData.length - 1));
  const goPrev = () => setCurrentChallengeIndex(p => Math.max(p - 1, 0));
  const goTo   = (i: number) => setCurrentChallengeIndex(i);

  const getGreeting = () => { const h = new Date().getHours(); if (h < 12) return "Morning"; if (h < 18) return "Afternoon"; return "Evening"; };

  if (aboveLoading) {
    return (
      <>
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <WelcomeSkeleton /><StatsSkeleton /><ChallengeSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4 mb-2 items-start">
          <LeaderboardSkeleton /><PicksSkeleton />
        </div>
        <FeedSkeleton />
      </>
    );
  }

  if (!aboveFold) return <div style={{ color: "#fff", padding: 20 }}>Failed to load dashboard</div>;

  const stats = [
    { label: "Owner Points", value: aboveFold.user.points.toLocaleString(), change: `+${aboveFold.weeklyDelta.points} this week`, changeType: "positive" as const },
    { label: "Club Rank", value: aboveFold.user.rank ? `#${aboveFold.user.rank}` : "—", change: aboveFold.weeklyDelta.rank ? `${aboveFold.weeklyDelta.rank > 0 ? "Down" : "Up"} ${Math.abs(aboveFold.weeklyDelta.rank)} Position` : "—", changeType: aboveFold.weeklyDelta.rank && aboveFold.weeklyDelta.rank < 0 ? "positive" as const : "neutral" as const },
    { label: "Weeks Played", value: aboveFold.user.weeksRegistered.toString(), change: aboveFold.user.memberSince ? `Since ${new Date(aboveFold.user.memberSince).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : "—", changeType: "neutral" as const },
    { label: "Achievements", value: `${aboveFold.achievements.earned.toString().padStart(2, "0")}/${aboveFold.achievements.total.toString().padStart(2, "0")}`, change: aboveFold.achievements.newThisWeek > 0 ? `${aboveFold.achievements.newThisWeek} New this week` : "No new achievements", changeType: aboveFold.achievements.newThisWeek > 0 ? "positive" as const : "neutral" as const },
  ];

  const tournamentOptions = aboveFold.tournaments?.map((t: any) => ({ id: t.id, name: t.name })) || [];
  const selectedTournament = aboveFold.tournaments?.find((t: any) => t.id === selectedTournamentId);
  const picksForSelected = selectedTournament?.picks || aboveFold.picks || [];
  const selectedTournamentIdStr = selectedTournament?.tournId || null;
  const selectedWeather = selectedTournament?.weather || null;
  const totalPicked = picksForSelected.filter((p: any) => p.status === "picked").length;
  const totalSlots = picksForSelected.length;
  const welcomeTournaments = aboveFold.tournaments?.map((t: any) => ({ name: t.name, countdown: t.countdown || "Starting soon", picksRemaining: t.picksRemaining ?? 0 })) || [];

  const leaderboardTop = ((leaderboardData as any)?.leaderboard || []).slice(0, 6).map((r: any) => ({
    rank: r.rank, initials: (r.name || "?").split(/\s+/).map((p: string) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase(),
    name: r.name, club: r.bagName || "—", score: r.points, photoUrl: r.photoUrl || null,
  }));

  const mappedPosts = ((postsRes as any)?.posts || []).map((p: any) => ({
    id: p.id, author: p.user?.profile?.name || p.user?.username || "Anonymous",
    authorPhotoUrl: resolveMediaUrl(p.user?.profile?.golfPassport?.photoUrl || null),
    badge: "Owner", isPinned: false,
    timeAgo: (() => { const ms = Date.now() - new Date(p.createdAt).getTime(); const m = Math.floor(ms / 60000); if (m < 1) return "Just now"; if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; return `${Math.floor(h / 24)}d ago`; })(),
    content: p.content, postType: p.postType, mediaUrls: p.mediaUrls,
    isReshare: !!p.originalPostId, reshareComment: p.reshareComment || null, originalPost: p.originalPost || null,
    likes: p._count?.likes ?? 0, replies: p._count?.comments ?? 0,
  }));

  const feedPosts = mappedPosts.length > 0 ? mappedPosts : (aboveFold.posts || []).map((p: any) => ({ ...p, authorPhotoUrl: resolveMediaUrl(p.authorPhotoUrl) }));

  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      <WelcomeSection userName={aboveFold.user.name} greeting={getGreeting()} currentRank={aboveFold.user.rank ?? 0} tournaments={welcomeTournaments} />
      <StatsGrid stats={stats} />
      {aboveFold.announcement && <AnnouncementBanner announcement={aboveFold.announcement} />}

      {challengesLoading ? <ChallengeSkeleton /> : challengesData.length > 0 && (
        <WeeklyChallenge
          challenge={{ title: challengesData[currentChallengeIndex].title, description: challengesData[currentChallengeIndex].description, progress: challengesData[currentChallengeIndex].progress, status: challengesData[currentChallengeIndex].unlocked ? "completed" : "active", points: challengesData[currentChallengeIndex].points, triggerType: challengesData[currentChallengeIndex].triggerType }}
          currentIndex={currentChallengeIndex} totalChallenges={challengesData.length}
          onNext={goNext} onPrev={goPrev} onGoTo={goTo}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4 mb-2 items-start">
        {leaderboardLoading ? <LeaderboardSkeleton /> : <LeaderboardTable entries={leaderboardTop} />}
        <div className="flex flex-col gap-2">
          <TournamentSelector tournaments={tournamentOptions} selectedTournamentId={selectedTournamentId} onSelect={setSelectedTournamentId} />
          <MyPicks picks={picksForSelected} totalPicked={totalPicked} totalSlots={totalSlots} tournamentId={selectedTournamentIdStr} />
          {selectedWeather && <WeatherWidget weather={selectedWeather} />}
        </div>
      </div>

      {postsLoading ? <FeedSkeleton /> : <CommunityFeed posts={feedPosts} />}
    </>
  );
}
