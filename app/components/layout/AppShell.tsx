"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface AppShellProps {
  children: React.ReactNode;
}

const AUTH_ROUTES = ["/n", "/login"];

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));

  // Redirect unauthenticated users to /login on protected pages
  useEffect(() => {
    if (!loading && !user && !isAuthRoute) {
      router.replace("/login");
    }
  }, [loading, user, isAuthRoute, router]);

  // NFC entry / auth pages render without sidebar & header — no loading gate
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Show centered loading spinner while checking auth on protected pages
  if (loading) {
    return (
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#060D1F", zIndex: 9999 }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8C96A]/20 border-t-[#E8C96A]" />
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header onMenuToggle={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main
          className="flex-1 min-w-0 overflow-y-auto"
          style={{ padding: "20px", backgroundColor: "#060D1F" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
