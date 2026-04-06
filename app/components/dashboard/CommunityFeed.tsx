import Link from "next/link";
import Image from "next/image";
import type { CommunityPost } from "@/app/types";

interface CommunityFeedProps {
  posts: CommunityPost[];
}

export default function CommunityFeed({ posts }: CommunityFeedProps) {
  return (
    <div style={{ paddingTop: "20px", paddingBottom: "20px", marginTop: "40px", marginBottom: "20px" }}>
      {/* Section Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: "20px", gap: "16px" }}>
        <div className="flex items-center gap-3">
          <Image src="/icons/community.svg" alt="Community" width={24} height={24} style={{ filter: "brightness(0) saturate(100%) invert(82%) sepia(30%) saturate(800%) hue-rotate(5deg) brightness(100%)" }} />
          <h3 style={{ color: "#E8C96A", fontWeight: 500, fontSize: "clamp(15px, 1.8vw, 18px)", fontFamily: "var(--font-poppins), sans-serif" }}>
            Latest from the Community
          </h3>
        </div>
        <div className="hidden sm:block" style={{ flex: 1, height: "1px", backgroundColor: "#E8C96A", margin: "0 16px" }} />
        <Link
          href="/community"
          style={{ border: "1px solid #E8C96A", color: "#E8C96A", padding: "6px 16px", borderRadius: "5px", fontSize: "clamp(12px, 1.3vw, 14px)", fontWeight: 400, textDecoration: "none", fontFamily: "var(--font-poppins), sans-serif", flexShrink: 0, whiteSpace: "nowrap" }}
        >
          View All
        </Link>
      </div>

      {/* Posts */}
      <div>
        {posts.map((post) => (
          <article
            key={post.id}
            style={{ backgroundColor: "#13192A", borderRadius: "5px", padding: "16px 20px", marginBottom: "12px", fontFamily: "var(--font-poppins), sans-serif" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "5px", backgroundColor: "#060D1F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#E8C96A", flexShrink: 0 }}>
                PS
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap", marginBottom: "8px" }}>
                  <span style={{ color: "#E8C96A", fontWeight: 500, fontSize: "clamp(13px, 1.3vw, 16px)" }}>{post.author}</span>
                  <span style={{ color: "#888888", fontSize: "clamp(12px, 1.2vw, 14px)", fontWeight: 400, marginLeft: "6px" }}>{post.badge}</span>
                  {post.isPinned && (
                    <>
                      <span style={{ color: "#888888", fontSize: "clamp(12px, 1.2vw, 14px)" }}>·</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "clamp(12px, 1.2vw, 14px)", color: "#888888", fontWeight: 400 }}>
                        📌 Pinned
                      </span>
                    </>
                  )}
                  <span style={{ color: "#888888", fontSize: "clamp(12px, 1.2vw, 14px)", fontWeight: 400 }}>· {post.timeAgo}</span>
                </div>

                <p style={{ color: "#FFFFFF", fontSize: "clamp(13px, 1.3vw, 14px)", lineHeight: "1.6", fontWeight: 400, marginBottom: "12px" }}>
                  {post.content}
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  <button style={{ display: "flex", alignItems: "center", gap: "6px", color: "#E8C96A", background: "none", border: "none", cursor: "pointer", fontSize: "clamp(12px, 1.2vw, 13px)", fontFamily: "var(--font-poppins), sans-serif" }}>
                    <Image src="/icons/like.svg" alt="Like" width={18} height={18} style={{ filter: "brightness(0) saturate(100%) invert(82%) sepia(30%) saturate(800%) hue-rotate(5deg) brightness(100%)" }} />
                    <span style={{ color: "#FFFFFF" }}>{post.likes}</span>
                  </button>
                  <button style={{ display: "flex", alignItems: "center", gap: "6px", color: "#FFFFFF", background: "none", border: "none", cursor: "pointer", fontSize: "clamp(12px, 1.2vw, 13px)", fontFamily: "var(--font-poppins), sans-serif" }}>
                    <Image src="/icons/reply.svg" alt="Reply" width={18} height={18} style={{ filter: "brightness(0) saturate(100%) invert(82%) sepia(30%) saturate(800%) hue-rotate(5deg) brightness(100%)" }} />
                    <span>{post.replies} replies</span>
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
