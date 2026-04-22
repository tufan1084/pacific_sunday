import type { NavItem, StatCard, LeaderboardEntry, Pick, CommunityPost, WeatherData, Announcement, Challenge } from "@/app/types";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Socket.IO connects to the server origin (no /api suffix) — otherwise
// socket.io-client treats the path segment as a namespace and errors with
// "Invalid namespace".
export const SOCKET_URL = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "http://localhost:5000";
  }
})();

export const NAV_ITEMS: NavItem[] = [
  { icon: "dashboard", label: "Dashboard", href: "/", isActive: true },
  { icon: "fantasy", label: "Fantasy Golf", href: "/fantasy-golf" },
  { icon: "h2h", label: "Head to Head", href: "/head-to-head", badge: 2 },
  { icon: "community", label: "Community", href: "/community" },
  { icon: "live", label: "Live Scores", href: "/live-scores" },
  { icon: "store", label: "Reward Store", href: "/reward-store" },
  { icon: "achievements", label: "Achievements", href: "/achievements", badge: 10 },
  { icon: "leaderboard", label: "Leaderboard", href: "/leaderboard" },
  { icon: "challenges", label: "Challenges", href: "/challenges" },
  { icon: "bag", label: "My Bag", href: "/my-bag" },
  { icon: "profile", label: "Profile", href: "/profile" },
  { icon: "notification", label: "Notification", href: "/notifications", badge: 80 },
  { icon: "settings", label: "Settings", href: "/settings" },
];

export const DASHBOARD_STATS: StatCard[] = [
  { value: "2,540", label: "Owner Points", change: "+500 this week", changeType: "positive" },
  { value: "#3", label: "Club Rank", change: "Up +1 Position", changeType: "positive" },
  { value: "7", label: "Weeks Played", change: "Since March 2, 2026", changeType: "neutral" },
  { value: "08/18", label: "Achievements", change: "4 New this week", changeType: "gold" },
];

export const LEADERBOARD_DATA: LeaderboardEntry[] = [
  { rank: 1, initials: "MK", name: "Mike Hanza", club: "Augusta Green #012", score: 3178 },
  { rank: 2, initials: "MK", name: "Mike Hanza", club: "Augusta Green #012", score: 3178 },
  { rank: 3, initials: "MK", name: "Mike Hanza", club: "Augusta Green #012", score: 3178 },
  { rank: 4, initials: "MK", name: "Mike Hanza", club: "Augusta Green #012", score: 3178 },
  { rank: 5, initials: "MK", name: "Mike Hanza", club: "Augusta Green #012", score: 3178 },
  { rank: 6, initials: "MK", name: "Mike Hanza", club: "Augusta Green #012", score: 3178 },
];

export const MY_PICKS: Pick[] = [
  { tier: "T1", golfer: "Scottie Scheffler", score: "-12", status: "picked" },
  { tier: "T2", golfer: null, score: null, status: "not_picked" },
  { tier: "T3", golfer: null, score: null, status: "not_picked" },
  { tier: "T4", golfer: null, score: null, status: "not_picked" },
  { tier: "T5", golfer: "Jordan D.", score: "+05", status: "picked" },
];

export const COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 1,
    author: "Pacific Sunday",
    badge: "Official",
    isPinned: true,
    timeAgo: "1h ago",
    content: "Masters week is here! Submit 5-tier picks before Thursday 8 AM ET. Remember — all Majors earn double points. Top 10 also earn +500 bonus pts. Who's your dark horse?",
    likes: 197,
    replies: 88,
  },
  {
    id: 2,
    author: "Pacific Sunday",
    badge: "Official",
    isPinned: true,
    timeAgo: "1h ago",
    content: "Masters week is here! Submit 5-tier picks before Thursday 8 AM ET. Remember — all Majors earn double points. Top 10 also earn +500 bonus pts. Who's your dark horse?",
    likes: 197,
    replies: 88,
  },
  {
    id: 3,
    author: "Pacific Sunday",
    badge: "Official",
    isPinned: true,
    timeAgo: "1h ago",
    content: "Masters week is here! Submit 5-tier picks before Thursday 8 AM ET. Remember — all Majors earn double points. Top 10 also earn +500 bonus pts. Who's your dark horse?",
    likes: 197,
    replies: 88,
  },
];

export const WEATHER_DATA: WeatherData = {
  location: "Augusta, GA",
  event: "Round Day",
  tempF: 68,
  tempC: 20,
  condition: "Partly cloudy",
  wind: "Wind 8mph SW",
  playingCondition: "Good",
};

export const ANNOUNCEMENT: Announcement = {
  title: "Masters 2026 — Double Points Weekend!",
  description: "All 4 Majors earn 2× points automatically. Submit your 5-tier picks before Thursday 8:00 AM ET. Your 3 current picks project +680 pts with the Major multiplier.",
  ctaText: "Pick Now",
  ctaHref: "/fantasy-golf/picks",
};

export const WEEKLY_CHALLENGE: Challenge = {
  title: "Weekly Challenge: Dark Horse Wins",
  description: "Your Tier-5 pick finishes Top 20 → +300 bonus pts",
  progress: "Ancer currently T28 · needs Top 20 by Sunday",
  status: "active",
};
