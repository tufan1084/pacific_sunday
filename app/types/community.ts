export interface Team {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  privacy: "public" | "private";
  creatorId: number;
  memberCount: number;
  isMember: boolean;
  role: "admin" | "member" | null;
  createdAt: string;
}

export interface TeamMember {
  id: number;
  username: string;
  name: string;
  avatarUrl: string | null;
  role: "admin" | "member";
  joinedAt: string;
}
