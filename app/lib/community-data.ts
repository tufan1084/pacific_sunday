import type { CommunityStats } from "@/app/types/community";

// Hybrid tagging per PRD section 9.1 — keyword-based auto-detection on post content
export const TAG_KEYWORDS: Record<string, string[]> = {
  fantasy_talk: ["fantasy", "picks", "leaderboard", "tier", "pick", "ranking", "tournament", "draft"],
  bag_flex: ["bag", "gear", "driver", "iron", "putter", "club", "wedge", "shaft", "grip", "ball"],
};

// Community Status widget — kept static per product decision
export const COMMUNITY_STATS: CommunityStats[] = [
  { label: "Posts this week", value: 98 },
  { label: "Active owners", value: 56 },
  { label: "NFC scans today", value: 167 },
];
