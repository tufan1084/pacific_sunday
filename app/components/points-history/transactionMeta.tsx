import type { ReactNode } from "react";

export interface TransactionMeta {
  label: string;
  tint: string;       // background tint behind icon
  stroke: string;     // icon stroke color
  icon: ReactNode;
}

const I = (path: ReactNode) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {path}
  </svg>
);

const ICON_TROPHY = I(
  <>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22M18 2H6v7a6 6 0 0 0 12 0V2z" />
  </>,
);
const ICON_GIFT = I(
  <>
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </>,
);
const ICON_AWARD = I(
  <>
    <circle cx="12" cy="8" r="6" />
    <polyline points="8.21 13.89 7 22 12 19 17 22 15.79 13.88" />
  </>,
);
const ICON_SWORDS = I(
  <>
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
    <line x1="13" y1="19" x2="19" y2="13" />
    <line x1="16" y1="16" x2="20" y2="20" />
    <line x1="19" y1="21" x2="21" y2="19" />
    <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
    <line x1="5" y1="14" x2="9" y2="18" />
    <line x1="7" y1="17" x2="4" y2="20" />
    <line x1="3" y1="19" x2="5" y2="21" />
  </>,
);
const ICON_LOCK = I(
  <>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </>,
);
const ICON_UNLOCK = I(
  <>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </>,
);
const ICON_BAG = I(
  <>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </>,
);
const ICON_UNDO = I(
  <>
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </>,
);
const ICON_COIN = I(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M14.8 9a2.5 2.5 0 0 0-5 0c0 1.4 1 2 2.5 2.5 1.5.5 2.5 1.1 2.5 2.5a2.5 2.5 0 0 1-5 0" />
    <line x1="12" y1="6" x2="12" y2="8" />
    <line x1="12" y1="16" x2="12" y2="18" />
  </>,
);

// ──  green / red / gold / blue / grey palette tints ─────────────────────────
const GOLD = { tint: "rgba(232,201,106,0.15)", stroke: "#E8C96A" };
const GREEN = { tint: "rgba(74,222,128,0.15)", stroke: "#4ADE80" };
const RED = { tint: "rgba(239,68,68,0.15)", stroke: "#EF4444" };
const BLUE = { tint: "rgba(96,165,250,0.15)", stroke: "#60A5FA" };
const GREY = { tint: "rgba(148,163,184,0.15)", stroke: "#94A3B8" };

const META: Record<string, Omit<TransactionMeta, "icon"> & { icon: ReactNode }> = {
  tournament_reward: { label: "Tournament", icon: ICON_TROPHY, ...GOLD },
  bonus:             { label: "Bonus",      icon: ICON_GIFT,   ...GOLD },
  challenge_unlock:  { label: "Challenge",  icon: ICON_AWARD,  ...GOLD },
  h2h_winnings:      { label: "H2H Win",    icon: ICON_SWORDS, ...GREEN },
  h2h_loss:          { label: "H2H Loss",   icon: ICON_SWORDS, ...RED },
  h2h_hold:          { label: "H2H Hold",   icon: ICON_LOCK,   ...GREY },
  h2h_release:       { label: "H2H Release",icon: ICON_UNLOCK, ...GREY },
  reward_redemption: { label: "Reward",     icon: ICON_BAG,    ...BLUE },
  challenge_rollback:{ label: "Adjustment", icon: ICON_UNDO,   ...GREY },
  debit:             { label: "Debit",      icon: ICON_COIN,   ...GREY },
};

const FALLBACK: TransactionMeta = {
  label: "Activity",
  icon: ICON_COIN,
  ...GREY,
};

export function getTransactionMeta(type: string): TransactionMeta {
  return META[type] ?? FALLBACK;
}
