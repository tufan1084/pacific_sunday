"use client";

import { useEffect, useState, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { IoClose, IoHeart, IoHeartOutline } from "react-icons/io5";
import { FiShare2, FiRepeat } from "react-icons/fi";
import { BsPinAngleFill } from "react-icons/bs";
import { api } from "@/app/services/api";
import { resolveMediaUrl } from "@/app/lib/constants";
import { useToast } from "@/app/context/ToastContext";

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  onUpdate?: () => void;
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function PostModalComponent({ isOpen, onClose, postId, onUpdate }: PostModalProps) {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);
  const toast = useToast();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const currentUserId = typeof window !== "undefined"
    ? parseInt(localStorage.getItem("ps_user_id") || "0") : 0;
  // Fetch post data when modal opens
  useEffect(() => {
    if (!isOpen || !postId) return;
    setLoading(true);
    setError(null);
    api.posts.getById(postId)
      .then((res) => {
        if (res.success && res.data) {
          setPost((res.data as any).post);
        } else {
          setError(res.message || "Failed to load post");
        }
      })
      .catch(() => {
        setError("Failed to load post");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, postId]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleLike = async () => {
    if (liking || !post) return;
    setLiking(true);
    try {
      await api.posts.like(post.id);
      // Optimistic update
      setPost((prev: any) => ({
        ...prev,
        isLikedByUser: !prev.isLikedByUser,
        _count: {
          ...prev._count,
          likes: prev.isLikedByUser ? prev._count.likes - 1 : prev._count.likes + 1,
        },
      }));
      onUpdate?.();
    } catch (error) {
      console.error("Failed to like post:", error);
      toast.showToast("Could not update like", "error");
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async () => {
    if (!post) return;
    try {
      const shareUrl = `${window.location.origin}/post/${post.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.showToast("Link copied!", "success");
      api.posts.share(post.id).catch(() => {});
    } catch {
      toast.showToast("Could not copy link", "error");
    }
  };

  const author = post?.user?.profile?.name || post?.user?.username || "Unknown";
  const username = post?.user?.username;
  const authorPhoto = post?.user?.profile?.golfPassport?.photoUrl || null;
  const initials = useMemo(
    () => (author || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
    [author]
  );
  const mediaUrls: string[] = Array.isArray(post?.mediaUrls) ? post.mediaUrls : [];
  const isLiked = Boolean(post?.isLikedByUser);
  const currentLikes = post?._count?.likes ?? 0;
  const commentsCount = post?._count?.comments ?? 0;
  const shareCount = post?.shareCount ?? 0;
  const isPinned = Boolean(post?.isPinned);
  const computedTags: string[] = Array.isArray(post?._computedTags) ? post._computedTags : [];

  // Reshare detection
  const isReshare = Boolean(post?.originalPostId && post?.originalPost);
  const originalPost = post?.originalPost;
  const originalAuthor = originalPost?.user?.profile?.name || originalPost?.user?.username || "Unknown";
  const originalUsername = originalPost?.user?.username;
  const originalInitials = useMemo(
    () => (originalAuthor || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
    [originalAuthor]
  );
  const originalAuthorPhoto = originalPost?.user?.profile?.golfPassport?.photoUrl || null;
  const originalMediaUrls = originalPost?.mediaUrls ? (Array.isArray(originalPost.mediaUrls) ? originalPost.mediaUrls : []) : [];
  const originalTags: string[] = Array.isArray(originalPost?.tagSlugs) ? originalPost.tagSlugs : [];

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0",
        fontFamily: "var(--font-poppins), sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Close button - top right */}
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: "fixed",
          top: "16px",
          right: "16px",
          zIndex: 10001,
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          border: "none",
          color: "#FFFFFF",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background-color 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        }}
      >
        <IoClose size={28} />
      </button>

      {/* Modal content container */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "90%",
          maxWidth: "700px",
          maxHeight: "90vh",
          backgroundColor: "#13192A",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: "12px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            color: "#FFFFFF",
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
              Loading post...
            </div>
          ) : error || !post ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
              {error || "Post not found"}
            </div>
          ) : (
            <article
              style={{
                backgroundColor: "#13192A",
                borderRadius: "0",
                overflow: "hidden",
                fontFamily: "var(--font-poppins), sans-serif",
              }}
            >
              {/* Pinned strip */}
              {isPinned && (
                <div
                  className="flex items-center gap-2"
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "rgba(232,201,106,0.08)",
                    borderBottom: "1px solid rgba(232,201,106,0.15)",
                    color: "#E8C96A",
                    fontSize: "11.5px",
                    fontWeight: 500,
                  }}
                >
                  <BsPinAngleFill size={11} />
                  <span>Pinned post</span>
                </div>
              )}

              {/* Reshare badge */}
              {isReshare && (
                <div
                  className="flex items-center gap-2"
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "rgba(100,181,246,0.08)",
                    borderBottom: "1px solid rgba(100,181,246,0.15)",
                    color: "#64B5F6",
                    fontSize: "11.5px",
                    fontWeight: 500,
                  }}
                >
                  <FiRepeat size={12} />
                  <span>{author} reshared</span>
                </div>
              )}

              {/* Header */}
              <div className="flex items-start gap-3" style={{ padding: "14px 16px 10px" }}>
                <div
                  style={{
                    width: "44px", height: "44px", borderRadius: "8px",
                    backgroundColor: "#060D1F", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "12px", fontWeight: 700,
                    color: "#E8C96A", flexShrink: 0, overflow: "hidden",
                  }}
                >
                  {authorPhoto ? (
                    <img src={resolveMediaUrl(authorPhoto)} alt={author} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    initials
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: "#E8C96A", fontWeight: 600, fontSize: "15px",
                      lineHeight: 1.2,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}
                  >
                    {author}
                  </div>
                  <div style={{ color: "#888", fontSize: "12px", marginTop: "3px", display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
                    {username && <span>@{username}</span>}
                    {username && <span>·</span>}
                    <span>{timeAgo(post.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Content - Reshare comment if exists */}
              {isReshare && post.content && (
                <p style={{ color: "#FFFFFF", fontSize: "14px", lineHeight: "1.6", fontWeight: 400, padding: "0 16px", margin: 0, wordBreak: "break-word", marginBottom: "12px" }}>
                  {post.content}
                </p>
              )}

              {/* Original post for reshares */}
              {isReshare && originalPost && (
                <div
                  style={{
                    margin: "0 16px 12px",
                    padding: "12px",
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "8px",
                  }}
                >
                  {/* Original author */}
                  <div className="flex items-center gap-2" style={{ marginBottom: "8px" }}>
                    <div
                      style={{
                        width: "28px", height: "28px", borderRadius: "6px",
                        backgroundColor: "#060D1F", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: "10px", fontWeight: 700,
                        color: "#E8C96A", flexShrink: 0, overflow: "hidden",
                      }}
                    >
                      {originalAuthorPhoto ? (
                        <img src={resolveMediaUrl(originalAuthorPhoto)} alt={originalAuthor} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        originalInitials
                      )}
                    </div>
                    <div>
                      <div style={{ color: "#E8C96A", fontWeight: 600, fontSize: "13px", lineHeight: 1.2 }}>
                        {originalAuthor}
                      </div>
                      {originalUsername && (
                        <div style={{ color: "#888", fontSize: "11px" }}>@{originalUsername}</div>
                      )}
                    </div>
                  </div>

                  {/* Original content */}
                  {originalPost.content && (
                    <p style={{ color: "#FFFFFF", fontSize: "13px", lineHeight: "1.5", fontWeight: 400, margin: "0 0 8px 0", wordBreak: "break-word" }}>
                      {originalPost.content}
                    </p>
                  )}

                  {/* Original tags */}
                  {originalTags.length > 0 && (
                    <div className="flex flex-wrap gap-1" style={{ marginBottom: originalMediaUrls.length > 0 ? "8px" : "0" }}>
                      {originalTags.map((tag: string, i: number) => (
                        <span
                          key={i}
                          style={{
                            fontSize: "10px", color: "#E8C96A",
                            backgroundColor: "rgba(232,201,106,0.1)",
                            padding: "2px 8px", borderRadius: "999px",
                          }}
                        >
                          #{tag.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Original media */}
                  {originalMediaUrls.length > 0 && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: originalMediaUrls.length === 1 ? "1fr" : "repeat(2, 1fr)",
                        gap: "2px",
                        backgroundColor: "#060D1F",
                        borderRadius: "6px",
                        overflow: "hidden",
                      }}
                    >
                      {originalMediaUrls.map((url: string, idx: number) => {
                        const isVideo = /\.(mp4|mov|avi|mkv|webm)(\?|$)/i.test(url) || url.includes("/video/");
                        const fullUrl = resolveMediaUrl(url);
                        if (isVideo) {
                          return (
                            <div
                              key={idx}
                              style={{
                                position: "relative",
                                overflow: "hidden",
                                backgroundColor: "#000",
                                aspectRatio: "16 / 9",
                              }}
                            >
                              <video
                                src={fullUrl}
                                controls
                                style={{ width: "100%", height: "100%", display: "block", objectFit: "contain", backgroundColor: "#000" }}
                              />
                            </div>
                          );
                        }
                        return (
                          <div
                            key={idx}
                            style={{
                              position: "relative",
                              overflow: "hidden",
                              backgroundColor: "#000",
                              aspectRatio: originalMediaUrls.length === 1 ? "4 / 3" : "1 / 1",
                              maxHeight: originalMediaUrls.length === 1 ? "300px" : "200px",
                              width: "100%",
                            }}
                          >
                            <img
                              src={fullUrl}
                              alt="Original post media"
                              loading="lazy"
                              style={{
                                width: "100%",
                                height: "100%",
                                display: "block",
                                objectFit: "cover",
                                objectPosition: "center",
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Content - Regular post */}
              {!isReshare && post.content && (
                <p style={{ color: "#FFFFFF", fontSize: "14px", lineHeight: "1.6", fontWeight: 400, padding: "0 16px", margin: 0, wordBreak: "break-word" }}>
                  {post.content}
                </p>
              )}

              {!isReshare && computedTags.length > 0 && (
                <div className="flex flex-wrap gap-1" style={{ padding: "10px 16px 0" }}>
                  {computedTags.map((tag: string, i: number) => (
                    <span
                      key={i}
                      style={{
                        fontSize: "11px", color: "#E8C96A",
                        backgroundColor: "rgba(232,201,106,0.1)",
                        padding: "3px 10px", borderRadius: "999px",
                      }}
                    >
                      #{tag.replace("_", " ")}
                    </span>
                  ))}
                </div>
              )}

              {/* Full-bleed media - Only for non-reshare posts */}
              {!isReshare && mediaUrls.length > 0 && (
                <div
                  style={{
                    marginTop: "12px",
                    display: "grid",
                    gridTemplateColumns: mediaUrls.length === 1 ? "1fr" : "repeat(2, 1fr)",
                    gap: "2px",
                    backgroundColor: "#060D1F",
                  }}
                >
                  {mediaUrls.map((url: string, idx: number) => {
                    const isVideo = /\.(mp4|mov|avi|mkv|webm)(\?|$)/i.test(url) || url.includes("/video/");
                    const fullUrl = resolveMediaUrl(url);
                    if (isVideo) {
                      return (
                        <div
                          key={idx}
                          style={{
                            position: "relative",
                            overflow: "hidden",
                            backgroundColor: "#000",
                            aspectRatio: "16 / 9",
                          }}
                        >
                          <video
                            src={fullUrl}
                            controls
                            style={{ width: "100%", height: "100%", display: "block", objectFit: "contain", backgroundColor: "#000" }}
                          />
                        </div>
                      );
                    }
                    return (
                      <div
                        key={idx}
                        style={{
                          position: "relative",
                          overflow: "hidden",
                          backgroundColor: "#000",
                          aspectRatio: mediaUrls.length === 1 ? "4 / 3" : "1 / 1",
                          maxHeight: mediaUrls.length === 1 ? "440px" : "320px",
                          width: "100%",
                        }}
                      >
                        <img
                          src={fullUrl}
                          alt="Post media"
                          loading="lazy"
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "block",
                            objectFit: "cover",
                            objectPosition: "center",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Engagement summary */}
              {!(currentLikes > 0 || commentsCount > 0 || shareCount > 0) && (
                <div style={{ height: "12px" }} />
              )}
              {(currentLikes > 0 || commentsCount > 0 || shareCount > 0) && (
                <div
                  className="flex items-center justify-between"
                  style={{ padding: "10px 16px 8px", color: "#888", fontSize: "12.5px" }}
                >
                  <div className="flex items-center gap-1.5">
                    {currentLikes > 0 && (
                      <>
                        <span
                          style={{
                            width: "18px", height: "18px", borderRadius: "999px",
                            backgroundColor: "rgba(239,68,68,0.15)",
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="#EF4444" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </span>
                        <span>{currentLikes}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {commentsCount > 0 && <span>{commentsCount} {commentsCount === 1 ? "comment" : "comments"}</span>}
                    {shareCount > 0 && <span>{shareCount} {shareCount === 1 ? "share" : "shares"}</span>}
                  </div>
                </div>
              )}

              {/* Action bar */}
              <div style={{ padding: "0 8px" }}>
                <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.06)" }} />
                <div className="flex items-stretch" style={{ padding: "4px 0" }}>
                  <button
                    onClick={handleLike}
                    disabled={liking}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      background: "none",
                      border: "none",
                      padding: "10px 0",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: 500,
                      fontFamily: "inherit",
                      borderRadius: "6px",
                      transition: "background-color 0.15s ease",
                      color: isLiked ? "#94A3B8" : "#94A3B8",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    {isLiked ? <IoHeart size={20} color="#EF4444" /> : <IoHeartOutline size={20} />}
                    <span>{isLiked ? "Liked" : "Like"}</span>
                  </button>
                  <button
                    onClick={handleShare}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      background: "none",
                      border: "none",
                      padding: "10px 0",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: 500,
                      fontFamily: "inherit",
                      borderRadius: "6px",
                      transition: "background-color 0.15s ease",
                      color: "#94A3B8",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <FiShare2 size={18} />
                    <span>Share</span>
                  </button>
                </div>
                <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.06)" }} />
              </div>

              {/* Comments section placeholder - will add in next sub-task */}
              <div style={{ padding: "16px", color: "#888", fontSize: "13px", textAlign: "center" }}>
                Comments will be loaded here
              </div>
            </article>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default memo(PostModalComponent);
