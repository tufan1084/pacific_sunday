"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { NAV_ITEMS } from "@/app/lib/constants";
import { H2HIcon } from "@/app/components/ui/Icons";
import { api } from "@/app/services/api";

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
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    fetchNewPostsCount();
    fetchUnreadNotifications();
    // Refresh counts every 30 seconds
    const interval = setInterval(() => {
      fetchNewPostsCount();
      fetchUnreadNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNewPostsCount = async () => {
    try {
      const lastVisit = localStorage.getItem('community_last_visit');
      if (!lastVisit) {
        setNewPostsCount(0);
        return;
      }

      const res = await api.posts.getAll(100, 0);
      if (res.success) {
        const posts = (res.data as any)?.posts || [];
        const newPosts = posts.filter((post: any) => 
          new Date(post.createdAt).getTime() > parseInt(lastVisit)
        );
        setNewPostsCount(newPosts.length);
      }
    } catch (error) {
      console.error('Failed to fetch new posts count:', error);
    }
  };

  const fetchUnreadNotifications = async () => {
    try {
      const res = await api.notifications.getUnreadCount();
      if (res.success) {
        setUnreadNotifications((res.data as any)?.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unread notifications:', error);
    }
  };

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
          fixed top-0 left-0 z-50 h-full bg-ps-sidebar
          flex flex-col transition-transform duration-300 ease-in-out
          lg:sticky lg:top-0 lg:translate-x-0 lg:z-auto lg:overflow-y-auto
          w-[275px] xl:w-[275px] lg:w-[240px] md:w-[220px]
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ fontFamily: "var(--font-poppins), sans-serif", maxHeight: "100vh" }}
      >
        {/* Mobile sidebar header with logo + close */}
        <div className="lg:hidden flex items-center justify-between px-5" style={{ height: "clamp(60px, 8vw, 90px)", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <div style={{ width: "120px", height: "40px", position: "relative" }}>
            <Image src="/logo.png" alt="Pacific Sunday" fill style={{ objectFit: "contain", objectPosition: "left center" }} />
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

        {/* Navigation — NO border-radius on items */}
        <nav className="flex-1 overflow-y-auto space-y-1" style={{ paddingTop: "20px", paddingBottom: "20px" }}>
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const isCommunity = item.href === "/community";
            const isNotification = item.href === "/notifications";
            const displayBadge = isCommunity ? newPostsCount : isNotification ? unreadNotifications : item.badge;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (isCommunity) {
                    localStorage.setItem('community_last_visit', Date.now().toString());
                    setNewPostsCount(0);
                  }
                  onClose();
                }}
                className={`
                  flex items-center gap-3 h-[60px] transition-all duration-200
                  text-[14px] md:text-[15px] lg:text-[16px] xl:text-[18px] font-normal w-full
                  ${isActive
                    ? "text-black"
                    : "text-white hover:bg-ps-sidebar-hover"
                  }
                `}
                style={{ borderRadius: 0, backgroundColor: isActive ? "#E8C96A" : undefined, paddingLeft: "20px", paddingRight: "10px" }}
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
                  <span
                    className={`text-[13px] font-medium ${
                      isActive ? "text-black" : "text-ps-gold"
                    }`}
                  >
                    {displayBadge}
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
