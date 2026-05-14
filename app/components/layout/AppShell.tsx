"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import Sidebar from "./Sidebar";
import Header from "./Header";
import GolfLoader from "@/app/components/ui/GolfLoader";
import { api } from "@/app/services/api";
import { cache, CACHE_TTL } from "@/app/services/cache";

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

// Pages that are "root" tabs — pressing back here should not navigate further back
const ROOT_PATHS = ["/", "/community", "/fantasy-golf", "/leaderboard", "/my-bag"];

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
  const isMessagesPage = pathname === "/messages";

  // PWA back-button support: push a sentinel state on mount so the back
  // gesture always has somewhere to go, then intercept popstate to call
  // router.back() instead of letting the PWA close or do nothing.
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Push a forward state so there's always a history entry ahead of us
    window.history.pushState({ pwaPage: pathname }, "");

    const handlePopState = (e: PopStateEvent) => {
      // If we're on a root tab, re-push the sentinel so back does nothing
      if (ROOT_PATHS.includes(pathname)) {
        window.history.pushState({ pwaPage: pathname }, "");
        return;
      }
      router.back();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [pathname, router]);

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
    <div 
      className="flex flex-col overflow-hidden" 
      style={{ 
        height: "100dvh",
      }}
    >
      <Header onMenuToggle={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main
          className="flex-1 min-w-0 main-content"
          style={{ 
            padding: isMessagesPage ? "0" : undefined,
            paddingBottom: isMessagesPage ? "0" : undefined,
            backgroundColor: "#060D1F",
            overflow: isMessagesPage ? "hidden" : "auto",
            WebkitOverflowScrolling: "touch",
            height: isMessagesPage ? "calc(100dvh - 60px)" : "auto"
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
