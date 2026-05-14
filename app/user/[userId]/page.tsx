"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { FiArrowLeft, FiUserPlus, FiUserCheck, FiLock, FiClock } from "react-icons/fi";
import { AiFillHeart } from "react-icons/ai";
import { BsChatDots } from "react-icons/bs";
import { api, ApiUserProfile, ApiPost } from "@/app/services/api";
import { useToast } from "@/app/context/ToastContext";
import { resolveMediaUrl } from "@/app/lib/constants";
import GolfLoader from "@/app/components/ui/GolfLoader";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();

  const userId = params?.userId ? parseInt(params.userId as string) : null;
  const [profile, setProfile] = useState<ApiUserProfile | null>(null);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!userId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.follows.getUserProfile(userId!);
      if (res.success) {
        const userProfile = (res.data as any)?.user;
        setProfile(userProfile);
        if (userProfile?.canViewPosts) {
          const postsRes = await api.posts.getUserPosts(userId!);
          if (postsRes.success && postsRes.data) {
            setPosts(postsRes.data.posts || []);
          }
        }
      } else {
        setError(res.message || "User not found");
      }
    } catch {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!profile || profile.isSelf) return;
    setBusy(true);
    try {
      const res = profile.isFollowing || profile.requestSent
        ? await api.follows.unfollow(profile.id)
        : await api.follows.follow(profile.id);
      if (res.success && res.data) {
        const wasFollowing = profile.isFollowing;
        const wasRequested = profile.requestSent;
        setProfile({
          ...profile,
          isFollowing: res.data.isFollowing,
          requestSent: res.data.requestSent,
          followerCount: wasFollowing && !res.data.isFollowing 
            ? profile.followerCount - 1 
            : !wasFollowing && res.data.isFollowing
            ? profile.followerCount + 1
            : profile.followerCount,
        });
      } else {
        toast.error(res.message || "Failed");
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <GolfLoader text="Loading profile..." />;

  if (error || !profile) {
    return (
      <div style={{ padding: "40px", textAlign: "center", fontFamily: "var(--font-poppins), sans-serif" }}>
        <div style={{ color: "#F87171", fontSize: "15px", marginBottom: "12px" }}>{error || "User not found"}</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "16px", fontFamily: "var(--font-poppins), sans-serif" }}>
      <button
        onClick={() => router.back()}
        style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#888", fontSize: "13px", cursor: "pointer", marginBottom: "16px", padding: 0 }}
      >
        <FiArrowLeft size={14} /> Back
      </button>

      {/* Profile Header */}
      <div style={{ backgroundColor: "#13192A", borderRadius: "5px", padding: "clamp(16px, 3vw, 28px)", marginBottom: "16px" }}>
        
        {/* Top row: avatar + info + follow button */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "clamp(12px, 2vw, 20px)", marginBottom: "16px" }}>
          <div style={{
            width: "clamp(64px, 8vw, 80px)", height: "clamp(64px, 8vw, 80px)", borderRadius: "8px",
            backgroundColor: "#060D1F",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#E8C96A", fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700,
            flexShrink: 0, overflow: "hidden",
          }}>
            {profile.photoUrl ? (
              <Image src={resolveMediaUrl(profile.photoUrl)} alt={profile.name} width={80} height={80} style={{ width: "100%", height: "100%", objectFit: "cover" }} unoptimized />
            ) : (
              profile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#E8C96A", fontSize: "clamp(16px, 2.5vw, 22px)", fontWeight: 600, marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.name}</div>
            <div style={{ color: "#888", fontSize: "clamp(12px, 1.5vw, 14px)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{profile.username}</div>
            {profile.country && (
              <div style={{ color: "#666", fontSize: "12px", marginTop: "4px" }}>{profile.country}</div>
            )}
          </div>

          {!profile.isSelf && (
            <button
              onClick={handleToggleFollow}
              disabled={busy}
              style={{
                padding: "8px 16px",
                backgroundColor: profile.isFollowing ? "transparent" : profile.requestSent ? "transparent" : "#E8C96A",
                color: profile.isFollowing || profile.requestSent ? "#E8C96A" : "#060D1F",
                border: profile.isFollowing || profile.requestSent ? "1px solid #E8C96A" : "none",
                borderRadius: "5px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              {profile.isFollowing ? (
                <><FiUserCheck size={14} /> Following</>
              ) : profile.requestSent ? (
                <><FiClock size={14} /> Requested</>
              ) : (
                <><FiUserPlus size={14} /> Follow</>
              )}
            </button>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div style={{ color: "#CCC", fontSize: "13px", lineHeight: "1.6", marginBottom: "16px" }}>{profile.bio}</div>
        )}

        {/* Stats */}
        <div style={{ display: "flex", gap: "clamp(8px, 3vw, 24px)", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px" }}>
          {[
            { label: "Posts", value: profile.canViewPosts ? profile.postCount : 0 },
            { label: "Followers", value: profile.followerCount },
            { label: "Following", value: profile.followingCount },
          ].map(({ label, value }) => (
            <div key={label} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ color: "#FFF", fontSize: "clamp(16px, 2.5vw, 20px)", fontWeight: 600 }}>{value}</div>
              <div style={{ color: "#888", fontSize: "clamp(10px, 1.2vw, 11px)", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "3px" }}>{label}</div>
            </div>
          ))}
        </div>

        {profile.isPrivate && !profile.canViewPosts && (
          <div style={{ marginTop: "16px", padding: "20px", backgroundColor: "#060D1F", borderRadius: "8px", textAlign: "center" }}>
            <FiLock style={{ width: "32px", height: "32px", color: "#888", margin: "0 auto 10px" }} />
            <div style={{ color: "#FFF", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>This account is private</div>
            <div style={{ color: "#888", fontSize: "13px" }}>Follow to see their posts and activity</div>
          </div>
        )}
      </div>

      {/* Posts Section */}
      {profile.canViewPosts && (
        <div>
          <div style={{ color: "#E8C96A", fontSize: "15px", fontWeight: 600, marginBottom: "12px" }}>Posts</div>
          {posts.length === 0 ? (
            <div style={{ textAlign: "center", color: "#888", fontSize: "13px", padding: "40px 20px", backgroundColor: "#13192A", borderRadius: "5px" }}>
              No posts yet
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {posts.map((post) => {
                const isReshare = post.originalPost !== null;
                const displayPost: any = isReshare ? post.originalPost! : post;
                const reshareAuthor: any = isReshare ? (post.user || post.author) : null;
                const postAuthor: any = displayPost.user || displayPost.author;

                return (
                  <div
                    key={post.id}
                    onClick={() => router.push(`/post/${post.id}`)}
                    style={{
                      backgroundColor: "#13192A",
                      borderRadius: "5px",
                      border: "1px solid rgba(255,255,255,0.06)",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    {isReshare && reshareAuthor && (
                      <div style={{ padding: "10px 14px", backgroundColor: "rgba(232,201,106,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "28px", height: "28px", borderRadius: "5px", backgroundColor: "#060D1F", display: "flex", alignItems: "center", justifyContent: "center", color: "#E8C96A", fontSize: "11px", fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>
                          {reshareAuthor?.photoUrl ? (
                            <Image src={resolveMediaUrl(reshareAuthor.photoUrl)} alt="" width={28} height={28} style={{ width: "100%", height: "100%", objectFit: "cover" }} unoptimized />
                          ) : (
                            (reshareAuthor?.name || "U").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                          )}
                        </div>
                        <div style={{ color: "#888", fontSize: "12px" }}>
                          <span style={{ color: "#E8C96A", fontWeight: 600 }}>{reshareAuthor?.name || reshareAuthor?.profile?.name}</span> reshared
                        </div>
                      </div>
                    )}

                    <div style={{ padding: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "6px", backgroundColor: "#060D1F", display: "flex", alignItems: "center", justifyContent: "center", color: "#E8C96A", fontSize: "12px", fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>
                          {postAuthor?.photoUrl ? (
                            <Image src={resolveMediaUrl(postAuthor.photoUrl)} alt="" width={36} height={36} style={{ width: "100%", height: "100%", objectFit: "cover" }} unoptimized />
                          ) : postAuthor?.profile?.golfPassport?.photoUrl ? (
                            <Image src={resolveMediaUrl(postAuthor.profile.golfPassport.photoUrl)} alt="" width={36} height={36} style={{ width: "100%", height: "100%", objectFit: "cover" }} unoptimized />
                          ) : (
                            (postAuthor?.name || postAuthor?.profile?.name || "U").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: "#E8C96A", fontSize: "13px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {postAuthor?.name || postAuthor?.profile?.name}
                          </div>
                          <div style={{ color: "#888", fontSize: "11px" }}>@{postAuthor?.username}</div>
                        </div>
                      </div>

                      {displayPost.content && (
                        <div style={{ color: "#FFF", fontSize: "14px", lineHeight: "1.5", marginBottom: "10px", wordBreak: "break-word" }}>
                          {displayPost.content}
                        </div>
                      )}

                      {/* Media */}
                      {(() => {
                        const urls = displayPost.mediaUrls && Array.isArray(displayPost.mediaUrls) && displayPost.mediaUrls.length > 0
                          ? displayPost.mediaUrls
                          : displayPost.mediaUrl ? [displayPost.mediaUrl] : [];
                        if (urls.length === 0) return null;
                        return (
                          <div style={{ marginBottom: "10px", borderRadius: "5px", overflow: "hidden" }}>
                            <Image src={resolveMediaUrl(urls[0])} alt="Post media" width={600} height={300} style={{ width: "100%", height: "auto", maxHeight: "280px", objectFit: "cover", display: "block" }} unoptimized />
                          </div>
                        );
                      })()}

                      <div style={{ display: "flex", gap: "16px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.06)", color: "#888", fontSize: "12px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <AiFillHeart size={14} color="#EF4444" />
                          <span style={{ color: "#FFF" }}>{displayPost._count?.likes || 0}</span>
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <BsChatDots size={13} color="#888" />
                          <span style={{ color: "#FFF" }}>{displayPost._count?.comments || 0}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
