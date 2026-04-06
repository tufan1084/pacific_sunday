export interface FantasyStatCard {
  value: string;
  label: string;
}

export interface ProjectedPick {
  tier: string;
  golfer: string;
  score: string;
  points: number;
  maxPoints: number;
}

export interface TierGolfer {
  rank: number;
  initials: string;
  name: string;
  club: string;
  score: string;
  isSelected: boolean;
}

export interface TierSection {
  name: string;
  golfers: TierGolfer[];
}

export interface ClubBoardEntry {
  rank: number;
  initials: string;
  name: string;
  club: string;
  score: number;
}
