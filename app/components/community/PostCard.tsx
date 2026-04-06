import Image from "next/image";
import type { CommunityPost } from "@/app/types/community";

interface PostCardProps {
  post: CommunityPost;
}

export default function PostCard({ post }: PostCardProps) {
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
          {post.initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + meta */}
          <div className="flex flex-wrap items-center gap-1" style={{ marginBottom: "8px" }}>
            <span style={{ color: "#E8C96A", fontWeight: 500, fontSize: "clamp(14px, 1.5vw, 16px)" }}>
              {post.author}
            </span>
            {post.badge && (
              <span style={{ color: "#888888", fontSize: "14px", fontWeight: 400 }}>
                {post.badge}
              </span>
            )}
            {post.team && (
              <span style={{ color: "#888888", fontSize: "14px", fontWeight: 400 }}>
                · {post.team}
              </span>
            )}
            {post.rank && (
              <span style={{ color: "#E8C96A", fontSize: "14px", fontWeight: 400 }}>
                · {post.rank}
              </span>
            )}
            {post.isPinned && (
              <span style={{ color: "#888888", fontSize: "14px" }}>
                · 📌 Pinned
              </span>
            )}
            <span style={{ color: "#888888", fontSize: "14px", fontWeight: 400 }}>
              · {post.timeAgo}
            </span>
          </div>

          {/* Content */}
          <p style={{ color: "#FFFFFF", fontSize: "14px", lineHeight: "1.6", fontWeight: 400, marginBottom: post.image ? "12px" : "16px" }}>
            {post.content}
          </p>

          {/* Image / Video */}
          {post.image && (
            <div style={{ marginBottom: "16px", position: "relative", display: "inline-block", maxWidth: "100%" }}>
              <Image
                src="/Rectangle 12.png"
                alt="Post image"
                width={250}
                height={50}
                style={{ width: "550px", height: "auto", minHeight: "30px", maxWidth: "100%", borderRadius: "5px", display: "block" }}
              />
              {post.hasVideo && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#E8C96A">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-5">
            <button className="flex items-center gap-2" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <Image src="/icons/like.svg" alt="Like" width={24} height={24} />
              <span style={{ color: "#FFFFFF", fontSize: "14px", fontFamily: "var(--font-poppins), sans-serif" }}>{post.likes}</span>
            </button>
            <button className="flex items-center gap-2" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <Image src="/icons/reply.svg" alt="Reply" width={24} height={24} />
              <span style={{ color: "#FFFFFF", fontSize: "14px", fontFamily: "var(--font-poppins), sans-serif" }}>{post.replies} replies</span>
            </button>
            {post.shares !== undefined && (
              <button className="flex items-center gap-2" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span style={{ color: "#FFFFFF", fontSize: "14px", fontFamily: "var(--font-poppins), sans-serif" }}>{post.shares}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
