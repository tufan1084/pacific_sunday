export interface CommunityPost {
  id: number;
  initials: string;
  author: string;
  team?: string;
  badge?: string;
  rank?: string;
  timeAgo: string;
  isPinned?: boolean;
  content: string;
  image?: string;
  hasVideo?: boolean;
  likes: number;
  replies: number;
  shares?: number;
}

export interface TeamMember {
  initials: string;
  name: string;
  preview: string;
  timeAgo: string;
}

export interface CommunityStats {
  label: string;
  value: number;
}
