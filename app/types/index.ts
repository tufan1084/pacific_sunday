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
  username?: string;
  email: string;
  country?: string | null;
  photoUrl?: string | null;
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
  photoUrl?: string | null;
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
  authorPhotoUrl?: string | null;
  badge: string;
  isPinned: boolean;
  timeAgo: string;
  content: string;
  postType?: string;
  mediaUrls?: any;
  isReshare?: boolean;
  reshareComment?: string | null;
  originalPost?: {
    id: number;
    author: string;
    content: string;
    postType: string;
    mediaUrls: any;
  } | null;
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
  progress: string | number;
  status: "active" | "completed" | "expired";
  points?: number;
  triggerType?: string;
}

// Announcement
export interface Announcement {
  id: number;
  title: string;
  description: string;
  ctaText: string | null;
  ctaHref: string | null;
}
