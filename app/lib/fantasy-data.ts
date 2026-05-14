import type { FantasyStatCard, ProjectedPick, TierSection, ClubBoardEntry } from "@/app/types/fantasy";

export const FANTASY_STATS: FantasyStatCard[] = [
  { value: "2,540", label: "Your Points" },
  { value: "#3", label: "Club Rank" },
  { value: "2d 14hr", label: "Until Lock" },
];

export const PROJECTED_PICKS: ProjectedPick[] = [
  { tier: "T1", golfer: "Scheffler", score: "-12", points: 260, maxPoints: 300 },
  { tier: "T3", golfer: "Kim", score: "-4", points: 160, maxPoints: 300 },
  { tier: "T5", golfer: "Ancer", score: "+1", points: 89, maxPoints: 300 },
];

export const PROJECTED_TOTAL = 680;

export const TIER_SECTIONS: TierSection[] = [
  {
    name: "T1 Elite",
    golfers: [
      { rank: 1, initials: "MK", name: "Mike Hanza", club: "Augusta Green #012", score: "-12", isSelected: false },
      { rank: 2, initials: "MK", name: "Mike Hanza", club: "Augusta Green #012", score: "-29", isSelected: false },
      { rank: 3, initials: "MK", name: "Mike Hanza", club: "Augusta Green #012", score: "-7", isSelected: false },
      { rank: 4, initials: "MK", name: "Mike Hanza", club: "Augusta Green #012", score: "-4", isSelected: true },
    ],
  },
  {
    name: "T2 Contender",
    golfers: [
      { rank: 5, initials: "XS", name: "Xander Schauffele", club: "World #6 · Defending", score: "-12", isSelected: true },
      { rank: 6, initials: "MK", name: "Mike Hanza", club: "Augusta Green #012", score: "-29", isSelected: false },
      { rank: 7, initials: "MK", name: "Mike Hanza", club: "Augusta Green #012", score: "-7", isSelected: false },
    ],
  },
  {
    name: "T4 Sleeper",
    golfers: [
      { rank: 8, initials: "XS", name: "Xander Schauffele", club: "World #6 · Defending", score: "-12", isSelected: true },
      { rank: 9, initials: "MK", name: "Mike Hanza", club: "Augusta Green #012", score: "-29", isSelected: false },
      { rank: 10, initials: "MK", name: "Mike Hanza", club: "Augusta Green #012", score: "-7", isSelected: false },
    ],
  },
];

export const CLUB_BOARD: ClubBoardEntry[] = [
  { rank: 1, initials: "MK", name: "Mike Hanza", club: "Augusta Green #012", score: 3167 },
  { rank: 2, initials: "MK", name: "Mike Hanza", club: "Augusta Green #012", score: 3167 },
  { rank: 3, initials: "MK", name: "Mike Hanza", club: "Augusta Green #012", score: 3167 },
  { rank: 4, initials: "MK", name: "Mike Hanza", club: "Augusta Green #012", score: 3167 },
  { rank: 5, initials: "MK", name: "Mike Hanza", club: "Augusta Green #012", score: 3167 },
  { rank: 6, initials: "MK", name: "Mike Hanza", club: "Augusta Green #012", score: 3167 },
  { rank: 7, initials: "MK", name: "Mike Hanza", club: "Augusta Green #012", score: 3167 },
  { rank: 8, initials: "MK", name: "Mike Hanza", club: "Augusta Green #012", score: 3167 },
];

