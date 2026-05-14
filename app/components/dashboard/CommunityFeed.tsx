import Link from "next/link";
import Image from "next/image";
import type { CommunityPost } from "@/app/types";

interface CommunityFeedProps {
  posts: CommunityPost[];
}

function PostMedia({ mediaUrls, postType }: { mediaUrls: any; postType?: string }) {
  if (!mediaUrls || !postType) return null;

  const urls = Array.isArray(mediaUrls) ? mediaUrls : [];
  if (urls.length === 0) return null;

  const isImage = postType === 'IMAGE' || postType === 'MIXED';
  const isVideo = postType === 'VIDEO' || postType === 'MIXED';

  const imageUrls = urls.filter((url: string) => url.match(/\.(jpg|jpeg|png|gif|webp)$/i));
  const videoUrls = urls.filter((url: string) => url.match(/\.(mp4|webm|ogg)$/i));

  return (
    <div style={{ marginTop: "8px", marginBottom: "8px" }}>
      {isImage && imageUrls.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: imageUrls.length === 1 ? "1fr" : "repeat(2, 1fr)",
            gridTemplateRows: imageUrls.length > 2 ? "repeat(2, 1fr)" : "auto",
            gap: "4px",
            maxWidth: "450px",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          {imageUrls.slice(0, 4).map((url: string, idx: number) => {
            const isLastItem = idx === 3 && imageUrls.length > 4;
            const remainingCount = imageUrls.length - 4;
            
            return (
              <div
                key={idx}
                style={{
                  position: "relative",
                  width: "100%",
                  height: imageUrls.length === 1 ? "300px" : "180px",
                  backgroundColor: "#060D1F",
                  overflow: "hidden",
                }}
              >
                <Image
                  src={url}
                  alt="Post image"
                  fill
                  style={{
                    objectFit: "cover",
                    filter: isLastItem ? "brightness(0.4)" : "none",
                  }}
                  sizes="(max-width: 640px) 150px, 250px"
                />
                {isLastItem && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      color: "#FFFFFF",
                      fontSize: "28px",
                      fontWeight: 700,
                      pointerEvents: "none",
                    }}
                  >
                    +{remainingCount}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {isVideo && videoUrls.length > 0 && (
        <div style={{ borderRadius: "8px", overflow: "hidden", backgroundColor: "#060D1F", maxWidth: "350px", marginTop: imageUrls.length > 0 ? "8px" : "0" }}>
          <video
            src={videoUrls[0]}
            controls
            style={{ width: "100%", maxHeight: "220px" }}
          />
        </div>
      )}
    </div>
  );
}

export default function CommunityFeed({ posts }: CommunityFeedProps) {
  return (
    <div style={{ paddingTop: "20px", paddingBottom: "0px", marginTop: "20px", marginBottom: "0px" }}>
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
          <Link
            key={post.id}
            href={`/post/${post.id}`}
            style={{ textDecoration: "none", display: "block" }}
          >
            <article
              style={{ backgroundColor: "#13192A", borderRadius: "5px", padding: "16px 20px", marginBottom: "12px", fontFamily: "var(--font-poppins), sans-serif", cursor: "pointer", transition: "background-color 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1a2238"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#13192A"}
            >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              {post.authorPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.authorPhotoUrl}
                  alt={post.author}
                  style={{ width: 32, height: 32, borderRadius: "5px", objectFit: "cover", flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: "32px", height: "32px", borderRadius: "5px", backgroundColor: "#060D1F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "#E8C96A", flexShrink: 0 }}>
                  {(post.author || "?").trim().split(/\s+/).slice(0, 2).map((s: string) => s[0]?.toUpperCase()).join("")}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap", marginBottom: "8px" }}>
                  <span style={{ color: "#E8C96A", fontWeight: 500, fontSize: "clamp(13px, 1.3vw, 16px)" }}>{post.author}</span>
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

                {post.isReshare && post.reshareComment && (
                  <p style={{ color: "#FFFFFF", fontSize: "clamp(13px, 1.3vw, 14px)", lineHeight: "1.6", fontWeight: 400, marginBottom: "8px" }}>
                    {post.reshareComment}
                  </p>
                )}

                {post.isReshare && post.originalPost ? (
                  <div style={{ backgroundColor: "#060D1F", borderRadius: "5px", padding: "12px", marginBottom: "12px", borderLeft: "3px solid #E8C96A" }}>
                    <div style={{ color: "#E8C96A", fontSize: "clamp(12px, 1.2vw, 13px)", marginBottom: "6px", fontWeight: 500 }}>
                      {post.originalPost.author}
                    </div>
                    <p style={{ color: "#CCCCCC", fontSize: "clamp(12px, 1.2vw, 13px)", lineHeight: "1.5", marginBottom: "8px" }}>
                      {post.originalPost.content}
                    </p>
                    <PostMedia mediaUrls={post.originalPost.mediaUrls} postType={post.originalPost.postType} />
                  </div>
                ) : (
                  <>
                    <p style={{ color: "#FFFFFF", fontSize: "clamp(13px, 1.3vw, 14px)", lineHeight: "1.6", fontWeight: 400, marginBottom: "12px" }}>
                      {post.content}
                    </p>
                    <PostMedia mediaUrls={post.mediaUrls} postType={post.postType} />
                  </>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#EF4444", fontSize: "clamp(12px, 1.2vw, 13px)", fontFamily: "var(--font-poppins), sans-serif" }}>
                    <Image src="/icons/like.svg" alt="Like" width={18} height={18} style={{ filter: "brightness(0) saturate(100%) invert(40%) sepia(90%) saturate(2000%) hue-rotate(340deg) brightness(100%)" }} />
                    <span style={{ color: "#FFFFFF" }}>{post.likes}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#FFFFFF", fontSize: "clamp(12px, 1.2vw, 13px)", fontFamily: "var(--font-poppins), sans-serif" }}>
                    <Image src="/icons/reply.svg" alt="Reply" width={18} height={18} style={{ filter: "brightness(0) saturate(100%) invert(82%) sepia(30%) saturate(800%) hue-rotate(5deg) brightness(100%)" }} />
                    <span>{post.replies} replies</span>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </Link>
        ))}
      </div>
    </div>
  );
}
