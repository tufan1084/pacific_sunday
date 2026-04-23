import type { CommunityStats } from "@/app/types/community";

// Community Status widget — kept static per product decision
export const COMMUNITY_STATS: CommunityStats[] = [
  { label: "Posts this week", value: 98 },
  { label: "Active owners", value: 56 },
  { label: "NFC scans today", value: 167 },
];

// Shape of a tag option as returned by GET /api/tags.
export interface TagOption {
  id: number;
  slug: string;
  label: string;
  description: string | null;
}
