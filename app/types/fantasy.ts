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

// ─── SlashGolf API Types ─────────────────────────────────────────────────────

export interface Tournament {
  tournId: string;
  name: string;
  courseName: string;
  city: string;
  state: string;
  country: string;
  startDate: string;
  endDate: string;
  purse: string;
  isMajor: boolean;
  status: "completed" | "live" | "upcoming";
  fieldAvailable?: boolean;
}

export interface TournamentList {
  completed: Tournament[];
  live: Tournament[];
  upcoming: Tournament[];
}

export interface ApiPlayer {
  playerId: string;
  name: string;
  firstName: string;
  lastName: string;
  country: string | null;
  worldRank: number | null;
  isAmateur?: boolean;
  status?: string;
  tier?: string;
  position?: string;
  score?: string;
  thru?: string;
}

export interface ApiTier {
  name: string;
  rankRange: string;
  players: ApiPlayer[];
}

export interface TournamentPlayersData {
  tournament: {
    tournId: string;
    name: string;
    courseName: string;
    startDate: string;
    endDate: string;
  };
  tiers: ApiTier[];
}

export interface TournamentResultPlayer {
  position: string;
  playerId: string;
  name: string;
  firstName: string;
  lastName: string;
  country: string;
  score: string;
  totalStrokes: string;
  status: string;
  thru: string;
  rounds: string[];
}

export interface TournamentResults {
  tournId: string;
  year: string;
  name: string;
  courseName: string;
  status: string;
  players: TournamentResultPlayer[];
  savedAt: string;
}
