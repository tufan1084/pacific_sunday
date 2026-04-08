// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
}

// User
export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

// Bag
export interface Bag {
  id: number;
  serial: string;
  model: string;
  createdAt: string;
  scans: Scan[];
}

// Scan
export interface Scan {
  id: number;
  uid: string;
  scanTime: string;
}

// Dashboard
export interface DashboardSummary {
  totalBags: number;
  totalScans: number;
}

export interface DashboardData {
  user: User;
  summary: DashboardSummary;
  bags: Bag[];
}

// Stats Card
export interface StatCard {
  value: string;
  label: string;
  change: string;
  changeType: "positive" | "neutral" | "gold";
}

// Leaderboard Entry
export interface LeaderboardEntry {
  rank: number;
  initials: string;
  name: string;
  club: string;
  score: number;
}

// Pick
export interface Pick {
  tier: string;
  golfer: string | null;
  score: string | null;
  status: "picked" | "not_picked";
}

// Community Post
export interface CommunityPost {
  id: number;
  author: string;
  badge: string;
  isPinned: boolean;
  timeAgo: string;
  content: string;
  likes: number;
  replies: number;
}

// Weather
export interface WeatherData {
  location: string;
  event: string;
  tempF: number;
  tempC: number;
  condition: string;
  wind: string;
  playingCondition: string;
}

// Golf Passport
export interface GolfPassport {
  id: number;
  profileId: number;
  fullName: string | null;
  nickname: string | null;
  handicap: string | null;
  bestScore: string | null;
  yearsPlaying: string | null;
  homeCourse: string | null;
  golfCountry: string | null;
  bio: string | null;
  photoUrl: string | null;
  updatedAt: string;
}

// Sidebar Nav Item
export interface NavItem {
  icon: string;
  label: string;
  href: string;
  badge?: number;
  isActive?: boolean;
}

// Challenge
export interface Challenge {
  title: string;
  description: string;
  progress: string;
  status: "active" | "completed" | "expired";
}

// Announcement
export interface Announcement {
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
}
