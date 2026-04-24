"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { resolveMediaUrl, NAV_ITEMS } from "@/app/lib/constants";
import CommunityStatus from "@/app/components/community/CommunityStatus";
import { EditIcon, UserCircleIcon, H2HIcon } from "@/app/components/ui/Icons";
import { FiBell } from "react-icons/fi";
import { BsPinAngleFill } from "react-icons/bs";
import { IoHeart, IoHeartOutline, IoChatbubbleOutline, IoShareSocialOutline } from "react-icons/io5";
import Header from "@/app/components/layout/Header";
import Sidebar from "@/app/components/layout/Sidebar";
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
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesOverride, setLikesOverride] = useState<number | null>(null);
  const [sharesOverride, setSharesOverride] = useState<number | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentsOverride, setCommentsOverride] = useState<number | null>(null);

  // Share-link landing page lives outside AppShell. Check the token on mount so
  // we can render the real Header + Sidebar for logged-in viewers (header/sidebar
  // clicks navigate normally) and keep the locked chrome + gate for anonymous ones.
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
  }, [postId, isAuthed]);

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
  const currentLikes = likesOverride ?? post?._count?.likes ?? 0;
  const commentsCount = commentsOverride ?? post?._count?.comments ?? 0;
  const shareCount = sharesOverride ?? post?.shareCount ?? 0;
  const isPinned = Boolean(post?.isPinned);

  // Logged-in handlers for the action bar. Non-authed visitors hit the gate
  // via onClickCapture on the parent (these handlers never fire for them).
  const handleLike = async () => {
    if (!postId || busy) return;
    setBusy(true);
    const wasLiked = liked;
    const base = post?._count?.likes ?? 0;
    setLiked(!wasLiked);
    setLikesOverride(Math.max(0, base + (wasLiked ? 0 : 1) - (wasLiked ? 1 : 0)));
    try {
      await api.posts.like(postId);
    } catch {
      setLiked(wasLiked);
      setLikesOverride(null);
    } finally {
      setBusy(false);
    }
  };

  const handleComment = async () => {
    const nextOpen = !commentsOpen;
    setCommentsOpen(nextOpen);
    if (nextOpen && !commentsLoaded && postId) {
      setLoadingComments(true);
      try {
        const res = await api.posts.getComments(postId);
        const list = (res?.data as any)?.comments;
        setComments(Array.isArray(list) ? list : []);
        setCommentsLoaded(true);
      } catch {
        setComments([]);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const handleAddComment = async () => {
    const text = commentText.trim();
    if (!text || !postId || submittingComment) return;
    setSubmittingComment(true);
    try {
      const res = await api.posts.addComment(postId, text);
      const added = (res?.data as any)?.comment;
      if (added) setComments((prev) => [added, ...prev]);
      setCommentText("");
      setCommentsOverride((commentsOverride ?? post?._count?.comments ?? 0) + 1);
    } catch {
      // silent — keep text so the user can retry
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    if (!postId) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareToast("Link copied!");
      setTimeout(() => setShareToast(null), 2000);
    } catch {
      setShareToast("Copy failed");
      setTimeout(() => setShareToast(null), 2000);
    }
    try {
      const res = await api.posts.share(postId);
      if (res.success && res.data) setSharesOverride(res.data.shareCount);
    } catch {
      // share-count bump is non-critical
    }
  };

  if (isAuthed === null || loading) {
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
      {/* Header: real for logged-in users (clicks navigate normally),
          locked faux for share-link visitors (any click opens the gate). */}
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
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: real for logged-in users, locked faux for share-link visitors */}
        {isAuthed ? (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        ) : (
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
        )}

        <main className="flex-1 min-w-0 overflow-y-auto" style={{ padding: "20px", backgroundColor: "#060D1F" }}>
          <div className="lg:grid lg:grid-cols-[3fr_2fr] lg:gap-4">
            {/* LEFT: community top panel (locked) + the shared post (read-only) */}
            <div style={{ minWidth: 0 }}>
              <div style={{ marginBottom: "14px" }} {...(!isAuthed && { onClickCapture: openGate })}>
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
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#E8C96A" }}>
                          <IoHeart size={16} />
                        </span>
                        <span style={{ color: "#E8C96A" }}>{currentLikes}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center" style={{ gap: "10px" }}>
                    {commentsCount > 0 && <span>{commentsCount} {commentsCount === 1 ? "comment" : "comments"}</span>}
                    {commentsCount > 0 && shareCount > 0 && <span>·</span>}
                    {shareCount > 0 && <span>{shareCount} {shareCount === 1 ? "share" : "shares"}</span>}
                  </div>
                </div>

                {/* Action bar. Authed: real handlers. Anon: gate at the parent. */}
                <div style={{ padding: "10px 8px 6px" }} {...(!isAuthed && { onClickCapture: openGate })}>
                  <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.06)", margin: "0 8px" }} />
                  <div className="flex items-stretch" style={{ gap: "4px", padding: "4px 0" }}>
                    {[
                      {
                        label: liked ? "Liked" : "Like",
                        icon: liked ? <IoHeart size={18} /> : <IoHeartOutline size={18} />,
                        onClick: handleLike,
                        color: liked ? "#E8C96A" : "#94A3B8",
                      },
                      {
                        label: "Comment",
                        icon: <IoChatbubbleOutline size={18} />,
                        onClick: handleComment,
                        color: "#94A3B8",
                      },
                      {
                        label: shareToast || "Share",
                        icon: <IoShareSocialOutline size={18} />,
                        onClick: handleShare,
                        color: shareToast ? "#4ADE80" : "#94A3B8",
                      },
                    ].map((a) => (
                      <div
                        key={a.label === "Liked" ? "Like" : a.label === "Link copied!" || a.label === "Copy failed" ? "Share" : a.label}
                        onClick={isAuthed ? a.onClick : undefined}
                        style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                          padding: "10px 0", cursor: "pointer", fontSize: "13px", fontWeight: 500,
                          color: a.color, borderRadius: "6px", userSelect: "none",
                        }}
                      >
                        {a.icon}<span>{a.label}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.06)", margin: "0 8px" }} />
                </div>

                {/* Inline comment panel — authed users only. Lazy-loads on first open. */}
                {isAuthed && commentsOpen && (
                  <div style={{ padding: "8px 16px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-start" style={{ gap: "8px", marginBottom: comments.length > 0 || loadingComments ? "14px" : "0" }}>
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddComment(); }}
                        placeholder="Write a comment…"
                        disabled={submittingComment}
                        style={{
                          flex: 1,
                          padding: "10px 12px",
                          borderRadius: "6px",
                          backgroundColor: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "#FFFFFF",
                          fontSize: "13px",
                          fontFamily: "var(--font-poppins), sans-serif",
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={handleAddComment}
                        disabled={!commentText.trim() || submittingComment}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "6px",
                          border: "none",
                          backgroundColor: !commentText.trim() || submittingComment ? "rgba(232,201,106,0.3)" : "#E8C96A",
                          color: "#060D1F",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: !commentText.trim() || submittingComment ? "not-allowed" : "pointer",
                          fontFamily: "var(--font-poppins), sans-serif",
                        }}
                      >
                        Post
                      </button>
                    </div>

                    {loadingComments ? (
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", textAlign: "center", padding: "12px 0" }}>Loading comments…</div>
                    ) : comments.length === 0 ? (
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", textAlign: "center", padding: "8px 0" }}>No comments yet. Be the first.</div>
                    ) : (
                      <div className="flex flex-col" style={{ gap: "12px" }}>
                        {comments.map((c) => {
                          const cAuthor = c.user?.profile?.name || c.user?.username || "Unknown";
                          const cUsername = c.user?.username;
                          const cPhoto = c.user?.profile?.golfPassport?.photoUrl || null;
                          const cInitials = (cAuthor || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                          return (
                            <div key={c.id} className="flex items-start" style={{ gap: "10px" }}>
                              <div style={{ width: "32px", height: "32px", borderRadius: "6px", backgroundColor: "#060D1F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#E8C96A", flexShrink: 0, overflow: "hidden" }}>
                                {cPhoto ? <img src={resolveMediaUrl(cPhoto)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : cInitials}
                              </div>
                              <div style={{ flex: 1, minWidth: 0, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "8px 12px" }}>
                                <div className="flex items-center" style={{ gap: "6px", marginBottom: "2px" }}>
                                  <span style={{ color: "#E8C96A", fontWeight: 600, fontSize: "12.5px" }}>{cAuthor}</span>
                                  {cUsername && <span style={{ color: "#888", fontSize: "11px" }}>@{cUsername}</span>}
                                  <span style={{ color: "#666", fontSize: "11px" }}>· {timeAgo(c.createdAt)}</span>
                                </div>
                                <div style={{ color: "#FFFFFF", fontSize: "13px", lineHeight: 1.5, wordBreak: "break-word" }}>{c.content}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </article>
            </div>

            {/* RIGHT: sidebar content. Gate only for share-link visitors. */}
            <div
              {...(!isAuthed && { onClickCapture: openGate })}
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
