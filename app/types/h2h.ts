export interface H2HStatCard {
  value: string;
  label: string;
}

export interface H2HPlayer {
  initials: string;
  name: string;
  club: string;
  combineScore: string;
}

export interface ActiveChallenge {
  title: string;
  you: H2HPlayer;
  opponent: H2HPlayer;
  statusMessage: string;
  wager: number;
  endDay: string;
}

export interface PastChallenge {
  initials: string;
  name: string;
  club: string;
  place: string;
  placeDetail: string;
  weather: string;
  weatherDetail: string;
  result: "Won" | "Lost";
  points: string;
}
