import type { FantasyStatCard, ProjectedPick, TierSection, ClubBoardEntry, Tournament, ApiTier } from "@/app/types/fantasy";

// Static tier JSON files per tournament (add entries as data becomes available)
export const STATIC_TIER_FILES: Record<string, string> = {
  "014": "/data/tiers-masters-2026.json",
};

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

// ─── Mock Tournaments (fallback when API key not configured) ─────────────────

export const MOCK_TOURNAMENTS: { completed: Tournament[]; live: Tournament[]; upcoming: Tournament[] } = {
  completed: [
    { tournId: "401", name: "Arnold Palmer Invitational", courseName: "Bay Hill Club & Lodge", city: "Orlando", state: "FL", country: "US", startDate: "2026-03-05", endDate: "2026-03-08", purse: "$20,000,000", isMajor: false, status: "completed" },
    { tournId: "400", name: "The Genesis Invitational", courseName: "Riviera Country Club", city: "Pacific Palisades", state: "CA", country: "US", startDate: "2026-02-12", endDate: "2026-02-15", purse: "$20,000,000", isMajor: false, status: "completed" },
    { tournId: "399", name: "AT&T Pebble Beach Pro-Am", courseName: "Pebble Beach Golf Links", city: "Pebble Beach", state: "CA", country: "US", startDate: "2026-01-29", endDate: "2026-02-01", purse: "$20,000,000", isMajor: false, status: "completed" },
  ],
  live: [
    { tournId: "402", name: "The Masters", courseName: "Augusta National Golf Club", city: "Augusta", state: "GA", country: "US", startDate: "2026-04-09", endDate: "2026-04-12", purse: "$20,000,000", isMajor: true, status: "live" },
  ],
  upcoming: [
    { tournId: "403", name: "RBC Heritage", courseName: "Harbour Town Golf Links", city: "Hilton Head", state: "SC", country: "US", startDate: "2026-04-16", endDate: "2026-04-19", purse: "$20,000,000", isMajor: false, status: "upcoming" },
    { tournId: "404", name: "PGA Championship", courseName: "Quail Hollow Club", city: "Charlotte", state: "NC", country: "US", startDate: "2026-05-14", endDate: "2026-05-17", purse: "$17,500,000", isMajor: true, status: "upcoming" },
    { tournId: "405", name: "The Memorial Tournament", courseName: "Muirfield Village Golf Club", city: "Dublin", state: "OH", country: "US", startDate: "2026-06-04", endDate: "2026-06-07", purse: "$20,000,000", isMajor: false, status: "upcoming" },
    { tournId: "406", name: "U.S. Open", courseName: "Shinnecock Hills Golf Club", city: "Southampton", state: "NY", country: "US", startDate: "2026-06-18", endDate: "2026-06-21", purse: "$21,500,000", isMajor: true, status: "upcoming" },
    { tournId: "407", name: "The Open Championship", courseName: "Royal Portrush Golf Club", city: "Portrush", state: "", country: "GB", startDate: "2026-07-16", endDate: "2026-07-19", purse: "$17,000,000", isMajor: true, status: "upcoming" },
  ],
};

// ─── Mock Tier Players (fallback when API key not configured) ────────────────

export const MOCK_TIERS: ApiTier[] = [
  {
    name: "T1 Elite",
    rankRange: "World Rank 1–10",
    players: [
      { playerId: "p1", name: "Scottie Scheffler", firstName: "Scottie", lastName: "Scheffler", country: "US", worldRank: 1, status: "active", tier: "T1 Elite", position: "1", score: "-14", thru: "F" },
      { playerId: "p2", name: "Xander Schauffele", firstName: "Xander", lastName: "Schauffele", country: "US", worldRank: 2, status: "active", tier: "T1 Elite", position: "T3", score: "-10", thru: "F" },
      { playerId: "p3", name: "Rory McIlroy", firstName: "Rory", lastName: "McIlroy", country: "GB", worldRank: 3, status: "active", tier: "T1 Elite", position: "T5", score: "-8", thru: "14" },
      { playerId: "p4", name: "Collin Morikawa", firstName: "Collin", lastName: "Morikawa", country: "US", worldRank: 4, status: "active", tier: "T1 Elite", position: "2", score: "-12", thru: "F" },
      { playerId: "p5", name: "Ludvig Åberg", firstName: "Ludvig", lastName: "Åberg", country: "SE", worldRank: 5, status: "active", tier: "T1 Elite", position: "T8", score: "-7", thru: "16" },
      { playerId: "p6", name: "Jon Rahm", firstName: "Jon", lastName: "Rahm", country: "ES", worldRank: 6, status: "active", tier: "T1 Elite", position: "T10", score: "-6", thru: "F" },
      { playerId: "p7", name: "Wyndham Clark", firstName: "Wyndham", lastName: "Clark", country: "US", worldRank: 7, status: "active", tier: "T1 Elite", position: "T15", score: "-4", thru: "F" },
      { playerId: "p8", name: "Viktor Hovland", firstName: "Viktor", lastName: "Hovland", country: "NO", worldRank: 8, status: "active", tier: "T1 Elite", position: "T20", score: "-3", thru: "13" },
      { playerId: "p9", name: "Matt Fitzpatrick", firstName: "Matt", lastName: "Fitzpatrick", country: "GB", worldRank: 9, status: "active", tier: "T1 Elite", position: "T12", score: "-5", thru: "F" },
      { playerId: "p10", name: "Brooks Koepka", firstName: "Brooks", lastName: "Koepka", country: "US", worldRank: 10, status: "active", tier: "T1 Elite", position: "T18", score: "-3", thru: "F" },
    ],
  },
  {
    name: "T2 Contender",
    rankRange: "World Rank 11–25",
    players: [
      { playerId: "p11", name: "Tommy Fleetwood", firstName: "Tommy", lastName: "Fleetwood", country: "GB", worldRank: 11, status: "active", tier: "T2 Contender", position: "T5", score: "-8", thru: "F" },
      { playerId: "p12", name: "Patrick Cantlay", firstName: "Patrick", lastName: "Cantlay", country: "US", worldRank: 12, status: "active", tier: "T2 Contender", position: "T12", score: "-5", thru: "F" },
      { playerId: "p13", name: "Shane Lowry", firstName: "Shane", lastName: "Lowry", country: "IE", worldRank: 13, status: "active", tier: "T2 Contender", position: "T18", score: "-3", thru: "F" },
      { playerId: "p14", name: "Hideki Matsuyama", firstName: "Hideki", lastName: "Matsuyama", country: "JP", worldRank: 14, status: "active", tier: "T2 Contender", position: "T8", score: "-7", thru: "15" },
      { playerId: "p15", name: "Tony Finau", firstName: "Tony", lastName: "Finau", country: "US", worldRank: 15, status: "active", tier: "T2 Contender", position: "T25", score: "-2", thru: "F" },
      { playerId: "p16", name: "Russell Henley", firstName: "Russell", lastName: "Henley", country: "US", worldRank: 16, status: "active", tier: "T2 Contender", position: "T30", score: "-1", thru: "F" },
      { playerId: "p17", name: "Sungjae Im", firstName: "Sungjae", lastName: "Im", country: "KR", worldRank: 17, status: "active", tier: "T2 Contender", position: "T22", score: "-2", thru: "F" },
      { playerId: "p18", name: "Sahith Theegala", firstName: "Sahith", lastName: "Theegala", country: "US", worldRank: 18, status: "active", tier: "T2 Contender", position: "T15", score: "-4", thru: "F" },
      { playerId: "p19", name: "Max Homa", firstName: "Max", lastName: "Homa", country: "US", worldRank: 19, status: "active", tier: "T2 Contender", position: "T10", score: "-6", thru: "F" },
      { playerId: "p20", name: "Brian Harman", firstName: "Brian", lastName: "Harman", country: "US", worldRank: 20, status: "active", tier: "T2 Contender", position: "T28", score: "-1", thru: "F" },
    ],
  },
  {
    name: "T3 Rising",
    rankRange: "World Rank 26–45",
    players: [
      { playerId: "p21", name: "Jason Day", firstName: "Jason", lastName: "Day", country: "AU", worldRank: 26, status: "active", tier: "T3 Rising", position: "T10", score: "-6", thru: "F" },
      { playerId: "p22", name: "Cameron Young", firstName: "Cameron", lastName: "Young", country: "US", worldRank: 28, status: "active", tier: "T3 Rising", position: "T28", score: "-1", thru: "F" },
      { playerId: "p23", name: "Si Woo Kim", firstName: "Si Woo", lastName: "Kim", country: "KR", worldRank: 30, status: "active", tier: "T3 Rising", position: "T22", score: "-2", thru: "F" },
      { playerId: "p24", name: "Tom Kim", firstName: "Tom", lastName: "Kim", country: "KR", worldRank: 32, status: "active", tier: "T3 Rising", position: "T18", score: "-3", thru: "14" },
      { playerId: "p25", name: "Keegan Bradley", firstName: "Keegan", lastName: "Bradley", country: "US", worldRank: 35, status: "active", tier: "T3 Rising", position: "T35", score: "E", thru: "F" },
      { playerId: "p26", name: "Adam Scott", firstName: "Adam", lastName: "Scott", country: "AU", worldRank: 38, status: "active", tier: "T3 Rising", position: "T40", score: "+1", thru: "F" },
      { playerId: "p27", name: "Justin Thomas", firstName: "Justin", lastName: "Thomas", country: "US", worldRank: 40, status: "active", tier: "T3 Rising", position: "T32", score: "E", thru: "F" },
      { playerId: "p28", name: "Robert MacIntyre", firstName: "Robert", lastName: "MacIntyre", country: "GB", worldRank: 42, status: "active", tier: "T3 Rising", position: "T15", score: "-4", thru: "F" },
      { playerId: "p29", name: "Corey Conners", firstName: "Corey", lastName: "Conners", country: "CA", worldRank: 44, status: "active", tier: "T3 Rising", position: "T20", score: "-3", thru: "F" },
      { playerId: "p30", name: "Sepp Straka", firstName: "Sepp", lastName: "Straka", country: "AT", worldRank: 45, status: "active", tier: "T3 Rising", position: "T25", score: "-2", thru: "F" },
    ],
  },
  {
    name: "T4 Sleeper",
    rankRange: "World Rank 46–70",
    players: [
      { playerId: "p31", name: "Rickie Fowler", firstName: "Rickie", lastName: "Fowler", country: "US", worldRank: 48, status: "active", tier: "T4 Sleeper", position: "T15", score: "-4", thru: "F" },
      { playerId: "p32", name: "Jordan Spieth", firstName: "Jordan", lastName: "Spieth", country: "US", worldRank: 50, status: "active", tier: "T4 Sleeper", position: "T28", score: "-1", thru: "F" },
      { playerId: "p33", name: "Dustin Johnson", firstName: "Dustin", lastName: "Johnson", country: "US", worldRank: 52, status: "active", tier: "T4 Sleeper", position: "T40", score: "+1", thru: "F" },
      { playerId: "p34", name: "Min Woo Lee", firstName: "Min Woo", lastName: "Lee", country: "AU", worldRank: 55, status: "active", tier: "T4 Sleeper", position: "T22", score: "-2", thru: "F" },
      { playerId: "p35", name: "Phil Mickelson", firstName: "Phil", lastName: "Mickelson", country: "US", worldRank: 58, status: "active", tier: "T4 Sleeper", position: "T50", score: "+3", thru: "F" },
      { playerId: "p36", name: "Tiger Woods", firstName: "Tiger", lastName: "Woods", country: "US", worldRank: 60, status: "active", tier: "T4 Sleeper", position: "T45", score: "+2", thru: "12" },
      { playerId: "p37", name: "Mackenzie Hughes", firstName: "Mackenzie", lastName: "Hughes", country: "CA", worldRank: 62, status: "active", tier: "T4 Sleeper", position: "T35", score: "E", thru: "F" },
      { playerId: "p38", name: "Taylor Moore", firstName: "Taylor", lastName: "Moore", country: "US", worldRank: 65, status: "active", tier: "T4 Sleeper", position: "T30", score: "-1", thru: "F" },
      { playerId: "p39", name: "Chris Kirk", firstName: "Chris", lastName: "Kirk", country: "US", worldRank: 68, status: "active", tier: "T4 Sleeper", position: "T38", score: "E", thru: "F" },
      { playerId: "p40", name: "Nick Taylor", firstName: "Nick", lastName: "Taylor", country: "CA", worldRank: 70, status: "active", tier: "T4 Sleeper", position: "T42", score: "+1", thru: "F" },
    ],
  },
  {
    name: "T5 Wildcard",
    rankRange: "World Rank 71+",
    players: [
      { playerId: "p41", name: "Abraham Ancer", firstName: "Abraham", lastName: "Ancer", country: "MX", worldRank: 75, status: "active", tier: "T5 Wildcard", position: "T28", score: "-1", thru: "F" },
      { playerId: "p42", name: "Kevin Na", firstName: "Kevin", lastName: "Na", country: "US", worldRank: 80, status: "active", tier: "T5 Wildcard", position: "T55", score: "+4", thru: "F" },
      { playerId: "p43", name: "Stewart Cink", firstName: "Stewart", lastName: "Cink", country: "US", worldRank: 90, status: "active", tier: "T5 Wildcard", position: "T60", score: "+5", thru: "F" },
      { playerId: "p44", name: "Lucas Glover", firstName: "Lucas", lastName: "Glover", country: "US", worldRank: 95, status: "active", tier: "T5 Wildcard", position: "T35", score: "E", thru: "F" },
      { playerId: "p45", name: "Zach Johnson", firstName: "Zach", lastName: "Johnson", country: "US", worldRank: 100, status: "active", tier: "T5 Wildcard", position: "T50", score: "+3", thru: "F" },
      { playerId: "p46", name: "Danny Willett", firstName: "Danny", lastName: "Willett", country: "GB", worldRank: 110, status: "active", tier: "T5 Wildcard", position: "T45", score: "+2", thru: "F" },
      { playerId: "p47", name: "Bubba Watson", firstName: "Bubba", lastName: "Watson", country: "US", worldRank: 120, status: "active", tier: "T5 Wildcard", position: "T52", score: "+3", thru: "F" },
      { playerId: "p48", name: "Gary Woodland", firstName: "Gary", lastName: "Woodland", country: "US", worldRank: 130, status: "active", tier: "T5 Wildcard", position: "T48", score: "+2", thru: "F" },
      { playerId: "p49", name: "Webb Simpson", firstName: "Webb", lastName: "Simpson", country: "US", worldRank: 140, status: "active", tier: "T5 Wildcard", position: "T58", score: "+4", thru: "F" },
      { playerId: "p50", name: "Charl Schwartzel", firstName: "Charl", lastName: "Schwartzel", country: "ZA", worldRank: 150, status: "active", tier: "T5 Wildcard", position: "T62", score: "+5", thru: "F" },
    ],
  },
];
