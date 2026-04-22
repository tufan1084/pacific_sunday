import Image from "next/image";
import { useState } from "react";
import { api } from "@/app/services/api";
import { API_BASE_URL } from "@/app/lib/constants";

interface PostCardProps {
  post: any;
  onUpdate: () => void;
}

export default function PostCard({ post, onUpdate }: PostCardProps) {
  const [liking, setLiking] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLikedByUser || false);
  const [currentLikes, setCurrentLikes] = useState(post._count?.likes || 0);

  const author = post.user?.profile?.name || post.user?.username || "Unknown";
  const username = post.user?.username;
  const initials = author.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const timeAgo = getTimeAgo(post.createdAt);
  const commentsCount = post._count?.comments || 0;
  const mediaUrls = post.mediaUrls ? (Array.isArray(post.mediaUrls) ? post.mediaUrls : []) : [];

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    
    const wasLiked = isLiked;
    setIsLiked(!isLiked);
    setCurrentLikes(wasLiked ? currentLikes - 1 : currentLikes + 1);
    
    try {
      await api.posts.like(post.id);
      onUpdate();
    } catch (error) {
      console.error('Failed to like post:', error);
      setIsLiked(wasLiked);
      setCurrentLikes(wasLiked ? currentLikes : currentLikes - 1);
    } finally {
      setLiking(false);
    }
  };

  function getTimeAgo(date: string) {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  return (
    <div
      style={{
        backgroundColor: "#13192A",
        borderRadius: "5px",
        padding: "16px 16px 16px 16px",
        paddingRight: "clamp(16px, 3vw, 36px)",
        marginBottom: "16px",
        fontFamily: "var(--font-poppins), sans-serif",
      }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar — 38px matching all other pages */}
        <div
          style={{
            width: "38px", height: "38px", borderRadius: "5px",
            backgroundColor: "#060D1F", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "10px", fontWeight: 700,
            color: "#E8C96A", flexShrink: 0,
          }}
        >
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + meta */}
          <div className="flex flex-wrap items-center gap-1" style={{ marginBottom: "8px" }}>
            <span style={{ color: "#E8C96A", fontWeight: 500, fontSize: "clamp(14px, 1.5vw, 16px)" }}>
              {author}
            </span>
            {username && (
              <span style={{ color: "#888888", fontSize: "14px", fontWeight: 400 }}>
                @{username}
              </span>
            )}
            {post.isPinned && (
              <span style={{ color: "#888888", fontSize: "14px" }}>
                · 📌 Pinned
              </span>
            )}
            <span style={{ color: "#888888", fontSize: "14px", fontWeight: 400 }}>
              · {timeAgo}
            </span>
          </div>

          {/* Content */}
          <p style={{ color: "#FFFFFF", fontSize: "14px", lineHeight: "1.6", fontWeight: 400, marginBottom: mediaUrls.length > 0 ? "12px" : "16px" }}>
            {post.content}
          </p>

          {/* Media */}
          {mediaUrls.length > 0 && (
            <div style={{ marginBottom: "16px", display: "grid", gridTemplateColumns: mediaUrls.length === 1 ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
              {mediaUrls.map((url: string, idx: number) => {
                const isVideo = url.includes('/video/');
                const fullUrl = `${API_BASE_URL}${url}`;
                return (
                  <div key={idx} style={{ position: "relative", borderRadius: "5px", overflow: "hidden" }}>
                    {isVideo ? (
                      <video src={fullUrl} controls style={{ width: "100%", height: "auto", display: "block" }} />
                    ) : (
                      <img src={fullUrl} alt="Post media" style={{ width: "100%", height: "auto", display: "block" }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-5">
            <button onClick={handleLike} disabled={liking} className="flex items-center gap-2" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? "#E8C96A" : "none"} stroke="#E8C96A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span style={{ color: "#FFFFFF", fontSize: "14px", fontFamily: "var(--font-poppins), sans-serif" }}>{currentLikes}</span>
            </button>
            <button className="flex items-center gap-2" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <Image src="/icons/reply.svg" alt="Reply" width={24} height={24} />
              <span style={{ color: "#FFFFFF", fontSize: "14px", fontFamily: "var(--font-poppins), sans-serif" }}>{commentsCount} replies</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
