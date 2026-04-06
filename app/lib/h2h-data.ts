import type { H2HStatCard, ActiveChallenge, PastChallenge } from "@/app/types/h2h";

export const H2H_STATS: H2HStatCard[] = [
  { value: "4 – 2", label: "Win Loss Record" },
  { value: "+784", label: "H2H Bonus Point" },
  { value: "2", label: "Active challenges" },
];

export const ACTIVE_CHALLENGE: ActiveChallenge = {
  title: "Active Challenge — The Masters 2026",
  you: {
    initials: "JD",
    name: "You",
    club: "Augusta Green #012",
    combineScore: "-65",
  },
  opponent: {
    initials: "MK",
    name: "Mike Hanza",
    club: "Augusta Green #012",
    combineScore: "-15",
  },
  statusMessage: "You're leading by 2 strokes! Hold on through Sunday.",
  wager: 200,
  endDay: "Sunday",
};

export const PAST_CHALLENGES: PastChallenge[] = [
  { initials: "JD", name: "Jordan Dogra", club: "Augusta Green #012", place: "Place", placeDetail: "New South book Field, Canada", weather: "Weather", weatherDetail: "Partly Cloudy", result: "Won", points: "+100 Pts" },
  { initials: "MK", name: "Mike Hanza", club: "Augusta Green #012", place: "Place", placeDetail: "Pebble Beach, USA", weather: "Weather", weatherDetail: "Sunny", result: "Lost", points: "-50 Pts" },
  { initials: "XS", name: "Xander Schauffele", club: "World #6 · Defending", place: "Place", placeDetail: "St Andrews, Scotland", weather: "Weather", weatherDetail: "Windy", result: "Won", points: "+200 Pts" },
  { initials: "RM", name: "Rory McIlroy", club: "Royal Portrush #004", place: "Place", placeDetail: "Augusta National, USA", weather: "Weather", weatherDetail: "Overcast", result: "Lost", points: "-100 Pts" },
  { initials: "JD", name: "Jordan Dogra", club: "Augusta Green #012", place: "Place", placeDetail: "New South book Field, Canada", weather: "Weather", weatherDetail: "Partly Cloudy", result: "Won", points: "+100 Pts" },
  { initials: "TS", name: "Tiger Spieth", club: "Augusta Green #007", place: "Place", placeDetail: "Torrey Pines, USA", weather: "Weather", weatherDetail: "Clear", result: "Won", points: "+150 Pts" },
  { initials: "BK", name: "Billy Koepka", club: "Pinehurst #003", place: "Place", placeDetail: "Pinehurst, USA", weather: "Weather", weatherDetail: "Hot", result: "Lost", points: "-75 Pts" },
  { initials: "JD", name: "Jordan Dogra", club: "Augusta Green #012", place: "Place", placeDetail: "New South book Field, Canada", weather: "Weather", weatherDetail: "Rainy", result: "Won", points: "+120 Pts" },
  { initials: "MK", name: "Mike Hanza", club: "Augusta Green #012", place: "Place", placeDetail: "Carnoustie, Scotland", weather: "Weather", weatherDetail: "Foggy", result: "Won", points: "+80 Pts" },
  { initials: "XS", name: "Xander Schauffele", club: "World #6 · Defending", place: "Place", placeDetail: "Muirfield, Scotland", weather: "Weather", weatherDetail: "Breezy", result: "Lost", points: "-60 Pts" },
];
