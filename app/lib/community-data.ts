import type { CommunityPost, TeamMember, CommunityStats } from "@/app/types/community";

export const COMMUNITY_FILTERS = ["All Owners", "Team Ryan", "Pyro Club", "Pokegolf"];
export const COMMUNITY_TABS = ["All Post", "Pinned", "Fantasy Talk", "Bag Flex", "Shared"];

export const COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 1,
    initials: "PS",
    author: "Pacific Sunday",
    badge: "Official",
    isPinned: true,
    timeAgo: "1h ago",
    content: "Masters week is here! Submit 5-tier picks before Thursday 8 AM ET. Remember — all Majors earn double points. Top 10 also earn +500 bonus pts. Who's your dark horse?",
    likes: 197,
    replies: 88,
    shares: 19,
  },
  {
    id: 2,
    initials: "MS",
    author: "Mike Sundu",
    team: "Augusto Green #012",
    rank: "#1",
    timeAgo: "3h ago",
    content: "Just hit a 280-yard drive at Pebble. Team Canada is an absolute work of art",
    image: "/community/golf1.jpg",
    likes: 197,
    replies: 88,
  },
  {
    id: 3,
    initials: "MS",
    author: "Pacala Poco",
    team: "Team USA #034",
    rank: "Rank #2",
    timeAgo: "5h ago",
    content: "Just hit a 290-yard drive at Pebble. Team USA",
    image: "/community/golf2.jpg",
    hasVideo: true,
    likes: 187,
    replies: 88,
  },
];

export const TEAM_MEMBERS: TeamMember[] = [
  { initials: "JD", name: "Jordan Dogra", preview: "\"Hadwin for T4 — thoughts?\"", timeAgo: "20m" },
  { initials: "JD", name: "Kim L · TC", preview: "\"Hadwin for T4 — backing Canada\"", timeAgo: "1h" },
  { initials: "JD", name: "Jordan Dogra", preview: "\"Going Scheffler T1, thoughts?\"", timeAgo: "20m" },
  { initials: "JD", name: "Jordan Dogra", preview: "\"Going Scheffler T1, thoughts?\"", timeAgo: "20m" },
];

export const COMMUNITY_STATS: CommunityStats[] = [
  { label: "Posts this week", value: 98 },
  { label: "Active owners", value: 56 },
  { label: "NFC scans today", value: 167 },
];
