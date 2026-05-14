"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { NAV_ITEMS } from "@/app/lib/constants";
import CommunityStatus from "@/app/components/community/CommunityStatus";
import { EditIcon, UserCircleIcon, H2HIcon } from "@/app/components/ui/Icons";
import { FiBell, FiArrowLeft } from "react-icons/fi";
import Header from "@/app/components/layout/Header";
import Sidebar from "@/app/components/layout/Sidebar";
import PostCard from "@/app/components/community/PostCard";
import { useToast } from "@/app/context/ToastContext";
import GolfLoader from "@/app/components/ui/GolfLoader";

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

export default function PublicPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params?.postId ? parseInt(params.postId as string) : null;
  const toast = useToast();

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsAuthed(!!localStorage.getItem("ps_token"));
  }, []);

  useEffect(() => {
    if (isAuthed === null) return;
    if (!postId) { setError("Invalid post ID"); setLoading(false); return; }
    (async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const apiUrl = baseUrl.includes("/api") ? baseUrl : `${baseUrl}/api`;
        const urlParams = new URLSearchParams(window.location.search);
        const viewToken = urlParams.get("viewToken");
        const endpoint = isAuthed ? `/posts/${postId}` : `/posts/${postId}/public`;
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (isAuthed) {
          const token = localStorage.getItem("ps_token");
          if (token) headers["Authorization"] = `Bearer ${token}`;
        }
        const apiEndpoint = viewToken ? `${endpoint}?viewToken=${viewToken}` : endpoint;
        const res = await fetch(`${apiUrl}${apiEndpoint}`, { headers });
        const data = await res.json();
        if (data.success) {
          setPost(data.data?.post);
        } else {
          setError(data.message || "Post not found or is private");
        }
      } catch {
        setError("Failed to load post");
      } finally {
        setLoading(false);
      }
    })();
  }, [postId, isAuthed]);

  const openGate = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setGateOpen(true);
  };

  if (isAuthed === null || loading) {
    return <GolfLoader fullScreen text="Loading post..." />;
  }

  if (error || !post) {
    return (
      <div style={{ minHeight: "100dvh", backgroundColor: "#060D1F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#888", fontFamily: "var(--font-poppins), sans-serif", padding: "20px", textAlign: "center" }}>
        <div style={{ fontSize: "18px", marginBottom: "12px", color: "#E8C96A" }}>
          {error || "Post not found"}
        </div>
        <button
          onClick={() => router.push("/login")}
          style={{ backgroundColor: "#E8C96A", color: "#060D1F", border: "none", borderRadius: "5px", padding: "10px 20px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden" style={{ fontFamily: "var(--font-poppins), sans-serif", height: "100dvh" }}>
      {isAuthed ? (
        <Header onMenuToggle={() => setSidebarOpen((v) => !v)} />
      ) : (
        <header
          className="sticky top-0 z-30 border-b border-ps-border w-full"
          style={{ backgroundColor: "#01050D" }}
          onClickCapture={openGate}
        >
          <div className="flex items-center w-full gap-3" style={{ height: "clamp(60px, 8vw, 90px)" }}>
            <div className="flex items-center flex-shrink-0" style={{ width: "clamp(200px, 22vw, 275px)", paddingLeft: "20px" }}>
              <div style={{ width: "clamp(120px, 14vw, 220px)", height: "clamp(36px, 5vw, 65px)", position: "relative", flexShrink: 0 }}>
                <Image src="/data/LOGO-PHOTO.png" alt="Pacific Sunday" fill style={{ objectFit: "contain", objectPosition: "left center" }} priority />
              </div>
            </div>
            <div className="flex-1" />
            <div className="flex items-center flex-shrink-0" style={{ gap: "clamp(10px, 1.5vw, 20px)", paddingRight: "clamp(16px, 2vw, 30px)" }}>
              <div style={{ color: "#E8C96A", display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px" }}>
                <FiBell size={22} />
              </div>
              <div style={{ color: "#E8C96A", display: "flex" }}><EditIcon size={24} /></div>
              <div style={{ color: "#E8C96A", display: "flex" }}><UserCircleIcon size={24} /></div>
            </div>
          </div>
        </header>
      )}

      <div className="flex flex-1 overflow-hidden">
        {isAuthed ? (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        ) : (
          <aside
            className="hidden lg:flex flex-col bg-ps-sidebar lg:sticky lg:top-0 lg:overflow-y-auto"
            style={{ width: "275px", maxHeight: "100dvh" }}
            onClickCapture={openGate}
          >
            <nav className="flex-1 overflow-y-auto space-y-1" style={{ paddingTop: "20px", paddingBottom: "20px" }}>
              {NAV_ITEMS.map((item) => {
                const isActive = item.href === "/community";
                return (
                  <div
                    key={item.href}
                    className={`flex items-center gap-3 h-[60px] text-[14px] md:text-[15px] lg:text-[16px] xl:text-[18px] font-normal w-full ${isActive ? "text-black" : "text-white"}`}
                    style={{ borderRadius: 0, backgroundColor: isActive ? "#E8C96A" : undefined, paddingLeft: "20px", paddingRight: "10px", cursor: "pointer" }}
                  >
                    {item.icon === "h2h" ? (
                      <H2HIcon size={20} className={isActive ? "text-black" : "text-white"} />
                    ) : (
                      <Image src={ICON_IMAGE_MAP[item.icon]} alt={item.label} width={20} height={20} style={{ flexShrink: 0, filter: isActive ? "brightness(0)" : "brightness(0) invert(1)" }} />
                    )}
                    <span className="flex-1">{item.label}</span>
                  </div>
                );
              })}
            </nav>
          </aside>
        )}

        <main className="flex-1 min-w-0 overflow-y-auto" style={{ padding: "20px", paddingBottom: "calc(40px + env(safe-area-inset-bottom))", backgroundColor: "#060D1F" }}>
          <div className="lg:grid lg:grid-cols-[3fr_2fr] lg:gap-4">
            <div style={{ minWidth: 0 }}>
              <div style={{ marginBottom: "14px" }}>
                <button
                  onClick={() => router.back()}
                  style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#888", fontSize: "13px", cursor: "pointer", padding: "0 0 12px 0", fontFamily: "inherit" }}
                >
                  <FiArrowLeft size={14} /> Back
                </button>
                <div className="tracking-wide" style={{ fontSize: "clamp(17px, 2.5vw, 25px)", color: "#E8C96A", fontWeight: 400, lineHeight: 1.2 }}>
                  Owners Community
                </div>
                <div style={{ fontSize: "clamp(11px, 1.5vw, 16px)", color: "#FFFFFF", fontWeight: 400, marginTop: "2px" }}>
                  Members-only · verified bag owners
                </div>
              </div>

              {isAuthed ? (
                <PostCard
                  post={post}
                  onUpdate={() => {
                    // reload post data on update
                    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                    const apiUrl = baseUrl.includes("/api") ? baseUrl : `${baseUrl}/api`;
                    const token = localStorage.getItem("ps_token");
                    fetch(`${apiUrl}/posts/${postId}`, {
                      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
                    }).then(r => r.json()).then(d => { if (d.success) setPost(d.data?.post); });
                  }}
                  onHidePost={() => router.push("/community")}
                  onHideUser={() => router.push("/community")}
                />
              ) : (
                <div
                  onClickCapture={openGate}
                  style={{ backgroundColor: "#13192A", borderRadius: "8px", padding: "20px", color: "#888", fontSize: "14px", textAlign: "center", cursor: "pointer" }}
                >
                  <div style={{ color: "#E8C96A", marginBottom: "8px", fontWeight: 600 }}>Login to view this post</div>
                  <div>Sign in to like, comment and share</div>
                </div>
              )}
            </div>

            <div
              {...(!isAuthed && { onClickCapture: openGate })}
              style={{ minWidth: 0, alignSelf: "start", position: "sticky", top: "-20px", zIndex: 20, backgroundColor: "#060D1F", marginTop: "-20px", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "16px", maxHeight: "calc(100dvh + 20px)", overflowY: "auto" }}
            >
              <div style={{ backgroundColor: "#13192A", borderRadius: "5px", padding: "20px 16px" }}>
                <div style={{ fontSize: "16px", color: "#E8C96A", fontWeight: 500, marginBottom: "8px" }}>Join the community</div>
                <div style={{ color: "#94A3B8", fontSize: "13px", lineHeight: 1.55 }}>
                  Pacific Sunday owners share picks, wins, and course reports with their teams here. Get your bag and register to join in.
                </div>
              </div>
              <CommunityStatus />
            </div>
          </div>
        </main>
      </div>

      {gateOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setGateOpen(false); }}
          style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "var(--font-poppins), sans-serif" }}
        >
          <div style={{ backgroundColor: "#13192A", borderRadius: "10px", padding: "28px 24px", maxWidth: "420px", width: "100%", border: "1px solid rgba(232,201,106,0.2)", textAlign: "center" }}>
            <div style={{ color: "#E8C96A", fontSize: "18px", fontWeight: 600, marginBottom: "10px" }}>Panel access required</div>
            <div style={{ color: "#FFFFFF", fontSize: "14px", lineHeight: 1.6, marginBottom: "22px" }}>
              First buy a golf bag from Pacific Sunday, then register through NFC. Once your bag is linked, you can access the full panel.
            </div>
            <div className="flex flex-col" style={{ gap: "10px" }}>
              <button onClick={() => router.push("/login")} style={{ backgroundColor: "#E8C96A", color: "#060D1F", border: "none", borderRadius: "5px", padding: "12px 20px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                I already have a bag — Login
              </button>
              <button onClick={() => { toast.info("Coming soon!"); }} style={{ backgroundColor: "transparent", color: "#E8C96A", border: "1px solid rgba(232,201,106,0.4)", borderRadius: "5px", padding: "12px 20px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
                I don&apos;t have a bag — Buy a bag
              </button>
              <button onClick={() => setGateOpen(false)} style={{ backgroundColor: "transparent", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "5px", padding: "12px 20px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
