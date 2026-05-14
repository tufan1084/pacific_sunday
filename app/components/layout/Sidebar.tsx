"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/app/lib/constants";
import { H2HIcon } from "@/app/components/ui/Icons";
import { useNotifications } from "@/app/context/NotificationContext";


const ICON_IMAGE_MAP: Record<string, string> = {
  dashboard: "/icons/dashboard.svg",
  fantasy: "/icons/fantasy.svg",
  community: "/icons/community.svg",
  live: "/icons/live_score.svg",
  store: "/icons/reward_store.svg",
  achievements: "/icons/achievements.svg",
  leaderboard: "/icons/leaderboard.svg",
  challenges: "/icons/challenges.svg",
  bag: "/icons/bag.svg",
  profile: "/icons/profile.svg",
  notification: "/icons/notification.svg",
  settings: "/icons/seeting.svg",
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const {
    unreadCount, invitesCount,
    communityUnreadCount, h2hUnreadCount, fantasyUnreadCount, challengesUnreadCount, profileUnreadCount,
    clearCommunityCount, clearH2HCount, clearFantasyCount, clearChallengesCount, clearProfileCount,
  } = useNotifications();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 bg-ps-sidebar
          flex flex-col transition-transform duration-300 ease-in-out
          lg:sticky lg:top-0 lg:translate-x-0 lg:z-auto lg:overflow-y-auto
          w-[275px] xl:w-[275px] lg:w-[240px] md:w-[220px]
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ 
          fontFamily: "var(--font-poppins), sans-serif",
          height: "100dvh",
          WebkitTransform: "translateZ(0)",
          transform: "translateZ(0)",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch" as any,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Mobile sidebar header with logo + close */}
        <div className="lg:hidden flex items-center justify-between px-5" style={{ height: "clamp(60px, 8vw, 90px)", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <div style={{ width: "120px", height: "40px", position: "relative" }}>
            <Image src="/data/LOGO-PHOTO.png" alt="Pacific Sunday" fill style={{ objectFit: "contain", objectPosition: "left center" }} />
          </div>
          <button
            onClick={onClose}
            style={{ color: "#E8C96A", background: "none", border: "2px solid #E8C96A", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            aria-label="Close menu"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto" style={{ paddingTop: "8px", paddingBottom: "8px" }}>
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const isCommunity    = item.href === "/community";
            const isNotification = item.href === "/notifications";
            const isH2H          = item.href === "/head-to-head";
            const isFantasy      = item.href === "/fantasy-golf";
            const isChallenges   = item.href === "/challenges";
            const isProfile      = item.href === "/profile";

            let displayBadge: number | undefined;
            if (isCommunity)         displayBadge = communityUnreadCount;
            else if (isH2H)          displayBadge = h2hUnreadCount;
            else if (isFantasy)      displayBadge = fantasyUnreadCount;
            else if (isChallenges)   displayBadge = challengesUnreadCount;
            else if (isProfile)      displayBadge = profileUnreadCount;
            else if (isNotification) displayBadge = unreadCount + invitesCount;
            else displayBadge = undefined;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (isCommunity)  clearCommunityCount();
                  if (isH2H)        clearH2HCount();
                  if (isFantasy)    clearFantasyCount();
                  if (isChallenges) clearChallengesCount();
                  if (isProfile)    clearProfileCount();
                  onClose();
                }}
                className={`
                  flex items-center gap-3 transition-all duration-200
                  text-[14px] md:text-[15px] lg:text-[16px] xl:text-[18px] font-normal w-full
                  ${isActive
                    ? "text-black"
                    : "text-white hover:bg-ps-sidebar-hover"
                  }
                `}
                style={{ borderRadius: 0, backgroundColor: isActive ? "#E8C96A" : undefined, paddingLeft: "20px", paddingRight: "10px", height: "52px" }}
              >
                {item.icon === "h2h" ? (
                  <H2HIcon size={20} className={isActive ? "text-black" : "text-white"} />
                ) : (
                  <Image
                    src={ICON_IMAGE_MAP[item.icon]}
                    alt={item.label}
                    width={20}
                    height={20}
                    style={{
                      flexShrink: 0,
                      filter: isActive
                        ? "brightness(0)"
                        : "brightness(0) invert(1)",
                    }}
                  />
                )}
                <span className="flex-1">{item.label}</span>
                {displayBadge !== undefined && displayBadge > 0 && (
                  <span style={{
                    color: isActive ? "#000" : "#E8C96A",
                    fontSize: "13px",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    {displayBadge > 99 ? "99+" : displayBadge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
