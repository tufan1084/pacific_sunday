"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { API_BASE_URL } from "@/app/lib/constants";
import { BsPinAngleFill } from "react-icons/bs";

export default function PublicPostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const postId = params?.postId ? parseInt(params.postId as string) : null;

  useEffect(() => {
    if (!postId) {
      setError("Invalid post ID");
      setLoading(false);
      return;
    }

    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const apiUrl = baseUrl.includes('/api') ? baseUrl : `${baseUrl}/api`;
      const res = await fetch(`${apiUrl}/posts/${postId}/public`);
      const data = await res.json();
      
      if (data.success) {
        setPost(data.data?.post);
      } else {
        setError(data.message || "Post not found or is private");
      }
    } catch (err) {
      console.error("Failed to load post:", err);
      setError("Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    router.push("/login");
  };

  function getTimeAgo(date: string) {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        backgroundColor: "#060D1F", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        color: "#888",
        fontFamily: "var(--font-poppins), sans-serif"
      }}>
        Loading post...
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        backgroundColor: "#060D1F", 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        justifyContent: "center",
        color: "#888",
        fontFamily: "var(--font-poppins), sans-serif",
        padding: "20px"
      }}>
        <div style={{ fontSize: "18px", marginBottom: "12px", color: "#E8C96A" }}>
          {error || "Post not found"}
        </div>
        <button 
          onClick={handleLoginClick}
          style={{
            backgroundColor: "#E8C96A",
            color: "#060D1F",
            border: "none",
            borderRadius: "5px",
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Login to view more
        </button>
      </div>
    );
  }

  const author = post.user?.profile?.name || post.user?.username || "Unknown";
  const username = post.user?.username;
  const initials = author.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const timeAgo = getTimeAgo(post.createdAt);
  const mediaUrls = post.mediaUrls ? (Array.isArray(post.mediaUrls) ? post.mediaUrls : []) : [];
  const currentLikes = post._count?.likes ?? 0;
  const commentsCount = post._count?.comments ?? 0;
  const shareCount = post.shareCount ?? 0;
  const isPinned = Boolean(post.isPinned);

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "#060D1F",
      padding: "20px",
      fontFamily: "var(--font-poppins), sans-serif"
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ 
          marginBottom: "20px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          padding: "16px",
          backgroundColor: "#13192A",
          borderRadius: "5px"
        }}>
          <div style={{ color: "#E8C96A", fontSize: "20px", fontWeight: 600 }}>
            Pacific Sunday
          </div>
          <button 
            onClick={handleLoginClick}
            style={{
              backgroundColor: "#E8C96A",
              color: "#060D1F",
              border: "none",
              borderRadius: "5px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Login
          </button>
        </div>
        
        {/* Post Card */}
        <div style={{
          backgroundColor: "#13192A",
          borderRadius: "5px",
          padding: "16px",
        }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{
              width: "38px", 
              height: "38px", 
              borderRadius: "5px",
              backgroundColor: "#060D1F", 
              display: "flex", 
              alignItems: "center",
              justifyContent: "center", 
              fontSize: "10px", 
              fontWeight: 700,
              color: "#E8C96A", 
              flexShrink: 0,
            }}>
              {initials}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ color: "#E8C96A", fontWeight: 500, fontSize: "16px" }}>
                  {author}
                </span>
                {username && (
                  <span style={{ color: "#888888", fontSize: "13px", fontWeight: 400 }}>
                    @{username}
                  </span>
                )}
                {isPinned && (
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#E8C96A", fontSize: "12px" }}>
                    <BsPinAngleFill size={11} />
                    <span>Pinned</span>
                  </span>
                )}
                <span style={{ color: "#888888", fontSize: "13px", fontWeight: 400 }}>
                  · {timeAgo}
                </span>
              </div>

              <p style={{ color: "#FFFFFF", fontSize: "14px", lineHeight: "1.6", fontWeight: 400, marginBottom: mediaUrls.length > 0 ? "12px" : "16px", wordBreak: "break-word" }}>
                {post.content}
              </p>

              {mediaUrls.length > 0 && (
                <div style={{ marginBottom: "16px", display: "grid", gridTemplateColumns: mediaUrls.length === 1 ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
                  {mediaUrls.map((url: string, idx: number) => {
                    const isVideo = url.includes("/video/");
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

              <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span style={{ color: "#FFFFFF", fontSize: "14px" }}>{currentLikes}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Image src="/icons/reply.svg" alt="Reply" width={22} height={22} />
                  <span style={{ color: "#FFFFFF", fontSize: "14px" }}>{commentsCount}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#E8C96A" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                  <span style={{ color: "#FFFFFF", fontSize: "14px" }}>{shareCount}</span>
                </div>
              </div>

              <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#060D1F", borderRadius: "5px", textAlign: "center" }}>
                <p style={{ color: "#888", fontSize: "13px", marginBottom: "8px" }}>
                  Login to like, comment, and interact with this post
                </p>
                <button 
                  onClick={handleLoginClick}
                  style={{
                    backgroundColor: "#E8C96A",
                    color: "#060D1F",
                    border: "none",
                    borderRadius: "5px",
                    padding: "8px 20px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Login to Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
