"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { resolveMediaUrl, NAV_ITEMS } from "@/app/lib/constants";
import { COMMUNITY_STATS } from "@/app/lib/community-data";
import CommunityStatus from "@/app/components/community/CommunityStatus";
import { EditIcon, UserCircleIcon, H2HIcon } from "@/app/components/ui/Icons";
import { FiBell } from "react-icons/fi";
import { BsPinAngleFill } from "react-icons/bs";
import { IoHeartOutline, IoChatbubbleOutline, IoShareSocialOutline } from "react-icons/io5";

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

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function PublicPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params?.postId ? parseInt(params.postId as string) : null;

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    if (!postId) { setError("Invalid post ID"); setLoading(false); return; }
    (async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const apiUrl = baseUrl.includes("/api") ? baseUrl : `${baseUrl}/api`;
        const res = await fetch(`${apiUrl}/posts/${postId}/public`);
        const data = await res.json();
        if (data.success) setPost(data.data?.post);
        else setError(data.message || "Post not found or is private");
      } catch {
        setError("Failed to load post");
      } finally {
        setLoading(false);
      }
    })();
  }, [postId]);

  // Any click inside the shell — except the post content area and the gate
  // modal itself — opens the gate. We capture at the phase-root so Links,
  // buttons, and nested handlers never fire their own logic.
  const openGate = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setGateOpen(true);
  };

  const author = post?.user?.profile?.name || post?.user?.username || "Unknown";
  const username = post?.user?.username;
  const authorPhoto = post?.user?.profile?.golfPassport?.photoUrl || null;
  const initials = useMemo(
    () => (author || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
    [author]
  );
  const mediaUrls: string[] = Array.isArray(post?.mediaUrls) ? post.mediaUrls : [];
  const currentLikes = post?._count?.likes ?? 0;
  const commentsCount = post?._count?.comments ?? 0;
  const shareCount = post?.shareCount ?? 0;
  const isPinned = Boolean(post?.isPinned);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#060D1F", display: "flex", alignItems: "center", justifyContent: "center", color: "#888", fontFamily: "var(--font-poppins), sans-serif" }}>
        Loading post...
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#060D1F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#888", fontFamily: "var(--font-poppins), sans-serif", padding: "20px", textAlign: "center" }}>
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
    <div
      className="flex flex-col overflow-hidden"
      style={{ fontFamily: "var(--font-poppins), sans-serif", height: "100vh" }}
    >
      {/* Locked header — any click opens the gate */}
      <header
        className="sticky top-0 z-30 border-b border-ps-border w-full"
        style={{ backgroundColor: "#01050D" }}
        onClickCapture={openGate}
      >
        <div className="flex items-center w-full gap-3" style={{ height: "clamp(60px, 8vw, 90px)" }}>
          <div className="flex items-center flex-shrink-0" style={{ width: "clamp(200px, 22vw, 275px)", paddingLeft: "20px" }}>
            <div style={{ width: "clamp(120px, 14vw, 220px)", height: "clamp(36px, 5vw, 65px)", position: "relative", flexShrink: 0 }}>
              <Image src="/logo.png" alt="Pacific Sunday" fill style={{ objectFit: "contain", objectPosition: "left center" }} priority />
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

      <div className="flex flex-1 overflow-hidden">
        {/* Locked sidebar — any click opens the gate */}
        <aside
          className="hidden lg:flex flex-col bg-ps-sidebar lg:sticky lg:top-0 lg:overflow-y-auto"
          style={{ width: "275px", maxHeight: "100vh" }}
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
                    <Image
                      src={ICON_IMAGE_MAP[item.icon]}
                      alt={item.label}
                      width={20}
                      height={20}
                      style={{ flexShrink: 0, filter: isActive ? "brightness(0)" : "brightness(0) invert(1)" }}
                    />
                  )}
                  <span className="flex-1">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[13px] font-medium ${isActive ? "text-black" : "text-ps-gold"}`}>{item.badge}</span>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto" style={{ padding: "20px", backgroundColor: "#060D1F" }}>
          <div className="lg:grid lg:grid-cols-[3fr_2fr] lg:gap-4">
            {/* LEFT: community top panel (locked) + the shared post (read-only) */}
            <div style={{ minWidth: 0 }}>
              <div style={{ marginBottom: "14px" }} onClickCapture={openGate}>
                <div
                  className="tracking-wide"
                  style={{
                    fontSize: "clamp(17px, 2.5vw, 25px)",
                    color: "#E8C96A",
                    fontWeight: 400,
                    lineHeight: 1.2,
                  }}
                >
                  Owners Community
                </div>
                <div
                  style={{
                    fontSize: "clamp(11px, 1.5vw, 16px)",
                    color: "#FFFFFF",
                    fontWeight: 400,
                    marginTop: "2px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  Members-only · verified bag owners
                </div>
              </div>

              <article
                style={{
                  backgroundColor: "#13192A",
                  borderRadius: "10px",
                  overflow: "hidden",
                  fontFamily: "var(--font-poppins), sans-serif",
                }}
              >
                {isPinned && (
                  <div className="flex items-center gap-2" style={{ padding: "8px 16px", backgroundColor: "rgba(232,201,106,0.08)", borderBottom: "1px solid rgba(232,201,106,0.15)", color: "#E8C96A", fontSize: "11.5px", fontWeight: 500 }}>
                    <BsPinAngleFill size={11} /><span>Pinned post</span>
                  </div>
                )}

                <div className="flex items-start gap-3" style={{ padding: "14px 16px 10px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "8px", backgroundColor: "#060D1F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "#E8C96A", flexShrink: 0, overflow: "hidden" }}>
                    {authorPhoto ? (
                      <img src={resolveMediaUrl(authorPhoto)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      initials
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#E8C96A", fontWeight: 600, fontSize: "15px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{author}</div>
                    <div className="flex items-center" style={{ color: "#888", fontSize: "12px", marginTop: "3px", gap: "6px" }}>
                      {username && <span>@{username}</span>}
                      {username && <span>·</span>}
                      <span>{timeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <p style={{ color: "#FFFFFF", fontSize: "14px", lineHeight: "1.6", padding: "0 16px", margin: 0, wordBreak: "break-word" }}>
                  {post.content}
                </p>

                {mediaUrls.length > 0 && (
                  <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: mediaUrls.length === 1 ? "1fr" : "repeat(2, 1fr)", gap: "2px", backgroundColor: "#060D1F" }}>
                    {mediaUrls.map((url: string, idx: number) => {
                      const isVideo = /\.(mp4|mov|avi|mkv|webm)(\?|$)/i.test(url) || url.includes("/video/");
                      const fullUrl = resolveMediaUrl(url);
                      return (
                        <div key={idx} style={{ position: "relative", overflow: "hidden", maxHeight: "520px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#060D1F" }}>
                          {isVideo ? (
                            <video src={fullUrl} controls style={{ width: "100%", height: "auto", maxHeight: "520px", display: "block", objectFit: "cover" }} />
                          ) : (
                            <img src={fullUrl} alt="Post media" style={{ width: "100%", height: "auto", maxHeight: "520px", display: "block", objectFit: "cover" }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Engagement summary (read-only) */}
                <div style={{ marginTop: "14px", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#94A3B8", fontSize: "12.5px" }}>
                  <div className="flex items-center" style={{ gap: "6px" }}>
                    {currentLikes > 0 && (
                      <>
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "18px", height: "18px", borderRadius: "999px", backgroundColor: "#F87171", color: "#FFF" }}>
                          <IoHeartOutline size={11} />
                        </span>
                        <span>{currentLikes}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center" style={{ gap: "10px" }}>
                    {commentsCount > 0 && <span>{commentsCount} {commentsCount === 1 ? "comment" : "comments"}</span>}
                    {commentsCount > 0 && shareCount > 0 && <span>·</span>}
                    {shareCount > 0 && <span>{shareCount} {shareCount === 1 ? "share" : "shares"}</span>}
                  </div>
                </div>

                {/* Action bar — clicks trigger the gate */}
                <div style={{ padding: "10px 8px 6px" }} onClickCapture={openGate}>
                  <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.06)", margin: "0 8px" }} />
                  <div className="flex items-stretch" style={{ gap: "4px", padding: "4px 0" }}>
                    {[
                      { icon: <IoHeartOutline size={18} />, label: "Like" },
                      { icon: <IoChatbubbleOutline size={18} />, label: "Comment" },
                      { icon: <IoShareSocialOutline size={18} />, label: "Share" },
                    ].map((a) => (
                      <div
                        key={a.label}
                        style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                          padding: "10px 0", cursor: "pointer", fontSize: "13px", fontWeight: 500,
                          color: "#94A3B8", borderRadius: "6px",
                        }}
                      >
                        {a.icon}<span>{a.label}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.06)", margin: "0 8px" }} />
                </div>
              </article>
            </div>

            {/* RIGHT: locked sidebar content */}
            <div
              onClickCapture={openGate}
              style={{
                minWidth: 0,
                alignSelf: "start",
                position: "sticky",
                top: "-20px",
                zIndex: 20,
                backgroundColor: "#060D1F",
                marginTop: "-20px",
                paddingTop: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                maxHeight: "calc(100vh + 20px)",
                overflowY: "auto",
              }}
            >
              <div style={{ backgroundColor: "#13192A", borderRadius: "5px", padding: "20px 16px" }}>
                <div style={{ fontSize: "16px", color: "#E8C96A", fontWeight: 500, marginBottom: "8px" }}>Join the community</div>
                <div style={{ color: "#94A3B8", fontSize: "13px", lineHeight: 1.55 }}>
                  Pacific Sunday owners share picks, wins, and course reports with their teams here. Get your bag and register to join in.
                </div>
              </div>
              <CommunityStatus stats={COMMUNITY_STATS} />
            </div>
          </div>
        </main>
      </div>

      {gateOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setGateOpen(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            backgroundColor: "rgba(0,0,0,0.65)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px", fontFamily: "var(--font-poppins), sans-serif",
          }}
        >
          <div
            style={{
              backgroundColor: "#13192A", borderRadius: "10px",
              padding: "28px 24px", maxWidth: "420px", width: "100%",
              border: "1px solid rgba(232,201,106,0.2)",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#E8C96A", fontSize: "18px", fontWeight: 600, marginBottom: "10px" }}>
              Panel access required
            </div>
            <div style={{ color: "#FFFFFF", fontSize: "14px", lineHeight: 1.6, marginBottom: "22px" }}>
              First buy a golf bag from Pacific Sunday, then register through NFC. Once your bag is linked, you can access the full panel.
            </div>
            <div className="flex flex-col" style={{ gap: "10px" }}>
              <button
                onClick={() => router.push("/login")}
                style={{
                  backgroundColor: "#E8C96A", color: "#060D1F", border: "none",
                  borderRadius: "5px", padding: "12px 20px", fontSize: "14px",
                  fontWeight: 600, cursor: "pointer",
                }}
              >
                I already have a bag — Login
              </button>
              <button
                onClick={() => setGateOpen(false)}
                style={{
                  backgroundColor: "transparent", color: "#94A3B8",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "5px", padding: "12px 20px", fontSize: "13px",
                  fontWeight: 500, cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
