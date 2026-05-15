"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { RefreshProvider, useGlobalRefresh } from "@/app/context/RefreshContext";
import Sidebar from "./Sidebar";
import Header from "./Header";
import GolfLoader from "@/app/components/ui/GolfLoader";
import { api } from "@/app/services/api";
import { cache, CACHE_TTL } from "@/app/services/cache";
import { usePullToRefresh } from "@/app/hooks/usePullToRefresh";

// Pre-warm cache for the most visited pages in the background
async function prefetchCommonData() {
  const prefetch = async (key: string, fn: () => Promise<any>, ttl: number) => {
    if (cache.has(key)) return;
    try { const result = await fn(); if (result !== null && result !== undefined) cache.set(key, result, ttl); } catch { /* ignore */ }
  };
  Promise.all([
    prefetch("dashboard:overview",  async () => { const r = await api.dashboard.getOverview(); return r.success ? r.data : null; }, CACHE_TTL.SHORT),
    prefetch("leaderboard:page",    async () => { const r = await api.leaderboard.getAll();    return r.success ? r.data : null; }, CACHE_TTL.SHORT),
    prefetch("profile:page",        async () => { const r = await api.profile.get();            return r.success ? r.data : null; }, CACHE_TTL.MEDIUM),
    prefetch("mybag:page",          async () => { const r = await api.profile.getBags();        return r.success ? r.data : null; }, CACHE_TTL.MEDIUM),
    prefetch("dashboard:posts",     async () => { const r = await api.posts.getAll(5, 0);      return r.success ? r.data : null; }, CACHE_TTL.SHORT),
    prefetch("challenges:page",     async () => {
      const r = await api.challenges.listMine();
      if (!r.success || !r.data) return [];
      return r.data.challenges;
    }, CACHE_TTL.MEDIUM),
    prefetch("achievements:page",   async () => {
      const r = await api.challenges.listMine();
      if (!r.success || !r.data) return [];
      return r.data.challenges;
    }, CACHE_TTL.MEDIUM),
  ]);
}

interface AppShellProps {
  children: React.ReactNode;
}

const AUTH_ROUTES = ["/n", "/login"];

// Pages that are "root" tabs — pressing back here should not navigate further
// back, and the in-app back arrow is hidden. Anything else gets a back arrow
// in the header so iOS standalone PWA users (no hardware back, no browser
// chrome) can navigate up.
const ROOT_PATHS = ["/", "/community", "/fantasy-golf", "/leaderboard", "/my-bag"];

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
  const isMessagesPage = pathname === "/messages";

  // Keep the user inside the PWA when they press the system back button on a
  // root tab (Android hardware back, browser back). Without a sentinel the
  // back press would close the PWA / leave the site entirely.
  //
  // We only push a sentinel while ON a root path — pushing on every route
  // change inflated history (each subpage had a phantom entry) and confused
  // the iOS edge-swipe-back gesture: a swipe consumed the sentinel but the
  // URL didn't change, so users felt their swipe "did nothing." With the
  // sentinel limited to root tabs, the natural browser-back behavior works
  // correctly on subpages on every platform. iOS PWA standalone mode (no
  // gesture, no hardware key) is handled by the in-app back arrow in Header.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!ROOT_PATHS.includes(pathname)) return;

    window.history.pushState({ rootSentinel: pathname }, "");

    const handlePopState = () => {
      // Still on root — re-push so the next back press stays put.
      window.history.pushState({ rootSentinel: pathname }, "");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [pathname]);

  // Redirect unauthenticated users to /login on protected pages
  useEffect(() => {
    if (!loading && !user && !isAuthRoute) {
      const token = typeof window !== "undefined" ? localStorage.getItem("ps_token") : null;
      if (!token) router.replace("/login");
    }
  }, [loading, user, isAuthRoute, router]);

  // Pre-warm cache for all pages once user is authenticated
  useEffect(() => {
    if (user) prefetchCommonData();
  }, [user?.id]);

  // NFC entry / auth pages render without sidebar & header — no loading gate
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Show centered loading spinner while checking auth on protected pages
  if (loading || !user) {
    return <GolfLoader fullScreen text="Loading..." />;
  }

  return (
    <RefreshProvider>
      <div
        className="flex flex-col overflow-hidden"
        style={{
          height: "100dvh",
        }}
      >
        <Header
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
          showBack={!ROOT_PATHS.includes(pathname)}
        />

        <div className="flex flex-1 overflow-hidden min-h-0">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <main
            className="flex-1 min-w-0 min-h-0"
            style={{
              padding: isMessagesPage ? "0" : "12px",
              backgroundColor: "#060D1F",
              overflow: isMessagesPage ? "hidden" : "auto",
              height: isMessagesPage ? "100%" : "auto",
            }}
          >
            {children}
          </main>
        </div>
        {/* Global pull-to-refresh — page-level useRegisterRefresh overrides
            the default location.reload() fallback for a smoother UX. Skip on
            /messages where main is not scrollable and pulls would be weird. */}
        {!isMessagesPage && <GlobalPullToRefresh />}
      </div>
    </RefreshProvider>
  );
}

function GlobalPullToRefresh() {
  const trigger = useGlobalRefresh();
  const { indicator } = usePullToRefresh(trigger);
  return <>{indicator}</>;
}
