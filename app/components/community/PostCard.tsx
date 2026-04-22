"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { api } from "@/app/services/api";
import { API_BASE_URL, SOCKET_URL } from "@/app/lib/constants";
import { io, Socket } from "socket.io-client";
import { IoIosAttach, IoMdSend } from "react-icons/io";
import { FiShare2 } from "react-icons/fi";
import { BsPinAngleFill } from "react-icons/bs";
import { useToast } from "@/app/context/ToastContext";
import PostActionMenu from "./PostActionMenu";
import ShareSheet from "./ShareSheet";
import ReportPanel from "./ReportPanel";
import ConfirmDialog from "../ui/ConfirmDialog";

interface PostCardProps {
  post: any;
  onUpdate: () => void;
  onHidePost?: (postId: number) => void;
  onHideUser?: (userId: number) => void;
  isPublicView?: boolean;
}

export default function PostCard({ post, onUpdate, onHidePost, onHideUser, isPublicView = false }: PostCardProps) {
  const { showToast } = useToast();
  const currentUserId = typeof window !== "undefined" ? parseInt(localStorage.getItem("ps_user_id") || "0") : 0;
  const router = typeof window !== "undefined" ? require("next/navigation").useRouter() : null;

  // Like state — mirrors post; updates via socket (server-driven truth)
  const [liking, setLiking] = useState(false);
  const isLiked = Boolean(post.isLikedByUser);
  const currentLikes = post._count?.likes ?? 0;
  const commentsCount = post._count?.comments ?? 0;
  const shareCount = post.shareCount ?? 0;
  const isPinned = Boolean(post.isPinned);

  const [showAllComments, setShowAllComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [commentMedia, setCommentMedia] = useState<File | null>(null);
  const [commentMediaPreview, setCommentMediaPreview] = useState<string | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  const postUserId = post.user?.id || post.userId || 0;
  const isOwner = currentUserId > 0 && postUserId === currentUserId;
  const author = post.user?.profile?.name || post.user?.username || "Unknown";
  const username = post.user?.username;
  const initials = author.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const timeAgo = getTimeAgo(post.createdAt);
  const mediaUrls = post.mediaUrls ? (Array.isArray(post.mediaUrls) ? post.mediaUrls : []) : [];
  const computedTags: string[] = Array.isArray(post._computedTags) ? post._computedTags : [];

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    loadComments();
  }, [post.id]);

  // Live-update comments list: listen for comment:added on this post
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on("comment:added", ({ postId, comment }: { postId: number; comment: any }) => {
      if (postId !== post.id || !comment) return;
      setComments(prev => {
        if (comment.parentId) {
          return prev.map(c => c.id === comment.parentId
            ? { ...c, replies: [...(c.replies || []), comment] }
            : c);
        }
        if (prev.some(c => c.id === comment.id)) return prev;
        return [comment, ...prev];
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [post.id]);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const response = await api.posts.getComments(post.id);
      const commentsData = (response.data as any)?.comments || [];
      setComments(Array.isArray(commentsData) ? commentsData : []);
    } catch (error) {
      console.error("Failed to load comments:", error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (isPublicView) {
      showToast("Please login to comment", "info");
      if (router) router.push("/login");
      return;
    }
    if ((!commentText.trim() && !commentMedia) || submittingComment) return;
    setSubmittingComment(true);
    try {
      await api.posts.addComment(post.id, commentText || " ");
      setCommentText("");
      setCommentMedia(null);
      setCommentMediaPreview(null);
      // Server will emit comment:added to update all clients; local fetch keeps counts in sync
      onUpdate();
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCommentMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) {
        showToast("Please select an image or video", "error");
        return;
      }
      setCommentMedia(file);
      setCommentMediaPreview(URL.createObjectURL(file));
    }
  };

  const removeCommentMedia = () => {
    if (commentMediaPreview) URL.revokeObjectURL(commentMediaPreview);
    setCommentMedia(null);
    setCommentMediaPreview(null);
  };

  const handleAddReply = async (parentId: number) => {
    if (!replyText.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      await api.posts.addComment(post.id, replyText, parentId);
      setReplyText("");
      setReplyingTo(null);
      onUpdate();
    } catch (error) {
      console.error("Failed to add reply:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLike = async () => {
    if (isPublicView) {
      showToast("Please login to like posts", "info");
      if (router) router.push("/login");
      return;
    }
    if (liking) return;
    setLiking(true);
    try {
      await api.posts.like(post.id);
      // Socket broadcast updates likes for everyone, including this user
    } catch (error) {
      console.error("Failed to like post:", error);
      showToast("Could not update like", "error");
    } finally {
      setLiking(false);
    }
  };

  const handlePin = async () => {
    setMenuOpen(false);
    try {
      const res = await api.posts.togglePin(post.id);
      if (res.success) {
        showToast((res.data as any)?.isPinned ? "Post pinned" : "Post unpinned", "success");
        onUpdate();
      } else {
        showToast(res.message || "Could not pin post", "error");
      }
    } catch {
      showToast("Could not pin post", "error");
    }
  };

  const handleDelete = () => {
    setMenuOpen(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      const res = await api.posts.delete(post.id);
      if (res.success) {
        showToast("Post deleted", "success");
        // Socket will remove this post from all open feeds
      } else {
        showToast(res.message || "Could not delete post", "error");
      }
    } catch {
      showToast("Could not delete post", "error");
    }
  };

  const handleShare = () => {
    setMenuOpen(false);
    setShowShare(true);
  };

  const handleReport = () => {
    setMenuOpen(false);
    setShowReport(true);
  };

  const handleBlock = () => {
    setMenuOpen(false);
    setShowBlockConfirm(true);
  };

  const confirmBlock = () => {
    setShowBlockConfirm(false);
    onHideUser?.(postUserId);
    showToast(`Hidden @${username}`, "success");
  };

  const handleSave = () => {
    setMenuOpen(false);
    setIsSaved(!isSaved);
    showToast(!isSaved ? "Post saved" : "Post unsaved", "success");
  };

  const handleCopyLink = async () => {
    setMenuOpen(false);
    try {
      const shareUrl = `${window.location.origin}/post/${post.id}`;
      await navigator.clipboard.writeText(shareUrl);
      showToast("Link copied!", "success");
      api.posts.share(post.id).catch(() => {});
    } catch {
      showToast("Could not copy link", "error");
    }
  };

  const handleReported = () => {
    setShowReport(false);
    onHidePost?.(post.id);
  };

  function getTimeAgo(date: string) {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  return (
    <div
      style={{
        backgroundColor: "#13192A",
        borderRadius: "5px",
        padding: "16px",
        paddingRight: "clamp(16px, 3vw, 36px)",
        marginBottom: "16px",
        fontFamily: "var(--font-poppins), sans-serif",
      }}
    >
      <div className="flex items-start gap-3">
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
          <div className="flex items-start justify-between gap-2" style={{ marginBottom: "8px" }}>
            <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5" style={{ minWidth: 0, flex: 1 }}>
              <span style={{ color: "#E8C96A", fontWeight: 500, fontSize: "clamp(14px, 1.5vw, 16px)" }}>
                {author}
              </span>
              {username && (
                <span style={{ color: "#888888", fontSize: "13px", fontWeight: 400 }}>
                  @{username}
                </span>
              )}
              {isPinned && (
                <span className="flex items-center gap-1" style={{ color: "#E8C96A", fontSize: "12px" }}>
                  <BsPinAngleFill size={11} />
                  <span>Pinned</span>
                </span>
              )}
              <span style={{ color: "#888888", fontSize: "13px", fontWeight: 400 }}>
                · {timeAgo}
              </span>
            </div>

            <PostActionMenu
              isOwner={isOwner}
              isPinned={isPinned}
              isSaved={isSaved}
              open={menuOpen}
              onToggle={() => setMenuOpen(!menuOpen)}
              onClose={() => setMenuOpen(false)}
              onPin={handlePin}
              onDelete={handleDelete}
              onShare={handleShare}
              onReport={handleReport}
              onBlock={handleBlock}
              onSave={handleSave}
              onCopyLink={handleCopyLink}
            />
          </div>

          <p style={{ color: "#FFFFFF", fontSize: "14px", lineHeight: "1.6", fontWeight: 400, marginBottom: mediaUrls.length > 0 ? "12px" : "16px", wordBreak: "break-word" }}>
            {post.content}
          </p>

          {computedTags.length > 0 && (
            <div className="flex flex-wrap gap-1" style={{ marginBottom: "12px" }}>
              {computedTags.map((tag: string, i: number) => (
                <span
                  key={i}
                  style={{
                    fontSize: "11px", color: "#E8C96A",
                    backgroundColor: "rgba(232,201,106,0.1)",
                    padding: "2px 8px", borderRadius: "999px",
                  }}
                >
                  #{tag.replace("_", " ")}
                </span>
              ))}
            </div>
          )}

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

          <div className="flex items-center gap-5 flex-wrap">
            <button onClick={handleLike} disabled={liking} className="flex items-center gap-2" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill={isLiked ? "#E8C96A" : "none"} stroke="#E8C96A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span style={{ color: "#FFFFFF", fontSize: "14px" }}>{currentLikes}</span>
            </button>

            <button
              onClick={() => setShowAllComments(!showAllComments)}
              className="flex items-center gap-2"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <Image src="/icons/reply.svg" alt="Reply" width={22} height={22} />
              <span style={{ color: "#FFFFFF", fontSize: "14px" }}>{commentsCount}</span>
            </button>

            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-2"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#E8C96A" }}
              aria-label="Share"
            >
              <FiShare2 size={20} />
              <span style={{ color: "#FFFFFF", fontSize: "14px" }}>{shareCount}</span>
            </button>
          </div>

          {showReport && (
            <ReportPanel
              postId={post.id}
              onClose={() => setShowReport(false)}
              onReported={handleReported}
            />
          )}
        </div>
      </div>

      {commentsCount > 0 && !showAllComments && (
        <button
          onClick={() => setShowAllComments(true)}
          style={{
            background: "none", border: "none", color: "#888888",
            fontSize: "14px", cursor: "pointer",
            marginTop: "12px", marginLeft: "50px", padding: 0,
          }}
        >
          View all {commentsCount} comments
        </button>
      )}

      {commentsCount > 0 && showAllComments && (
        <button
          onClick={() => setShowAllComments(false)}
          style={{
            background: "none", border: "none", color: "#888888",
            fontSize: "14px", cursor: "pointer",
            marginTop: "12px", marginLeft: "50px", padding: 0,
          }}
        >
          Hide comments
        </button>
      )}

      {showAllComments && (
        <div style={{ marginTop: "12px", marginLeft: "50px", borderLeft: "1px solid #1E2A47", paddingLeft: "12px" }}>
          {loadingComments ? (
            <div style={{ color: "#888", fontSize: "12px", padding: "8px 0" }}>Loading...</div>
          ) : comments.length === 0 ? (
            <div style={{ color: "#888", fontSize: "12px", padding: "8px 0" }}>No comments yet</div>
          ) : comments.map((comment) => (
            <div key={comment.id} style={{ marginBottom: "10px" }}>
              <div className="flex items-start gap-2">
                <div style={{ width: "24px", height: "24px", borderRadius: "4px", backgroundColor: "#060D1F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700, color: "#E8C96A", flexShrink: 0 }}>
                  {(comment.user?.profile?.name || comment.user?.username || "U").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ marginBottom: "2px" }}>
                    <span style={{ color: "#E8C96A", fontSize: "12px", fontWeight: 600, marginRight: "6px" }}>
                      {comment.user?.profile?.name || comment.user?.username || "Unknown"}
                    </span>
                    <span style={{ color: "#888888", fontSize: "11px" }}>
                      {getTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p style={{ color: "#FFFFFF", fontSize: "12px", lineHeight: "1.4", marginBottom: "4px", wordBreak: "break-word" }}>
                    {comment.content}
                  </p>
                  <button onClick={() => setReplyingTo(comment.id)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#E8C96A", fontSize: "11px" }}>
                    Reply
                  </button>

                  {replyingTo === comment.id && (
                    <div style={{ marginTop: "6px", display: "flex", gap: "6px" }}>
                      <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply..." style={{ flex: 1, backgroundColor: "#060D1F", border: "1px solid #1E2A47", borderRadius: "4px", padding: "6px 8px", color: "#FFFFFF", fontSize: "12px" }} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddReply(comment.id); } }} />
                      <button onClick={() => handleAddReply(comment.id)} disabled={submittingComment || !replyText.trim()} style={{ backgroundColor: "#E8C96A", color: "#060D1F", border: "none", borderRadius: "4px", padding: "6px 12px", fontSize: "11px", fontWeight: 600, cursor: "pointer", opacity: submittingComment || !replyText.trim() ? 0.5 : 1 }}>
                        Reply
                      </button>
                      <button onClick={() => { setReplyingTo(null); setReplyText(""); }} style={{ backgroundColor: "transparent", color: "#888888", border: "1px solid #1E2A47", borderRadius: "4px", padding: "6px 12px", fontSize: "11px", cursor: "pointer" }}>
                        ✕
                      </button>
                    </div>
                  )}

                  {comment.replies && comment.replies.length > 0 && (
                    <div style={{ marginTop: "8px", marginLeft: "8px", borderLeft: "1px solid #1E2A47", paddingLeft: "8px" }}>
                      {comment.replies.map((reply: any) => (
                        <div key={reply.id} style={{ marginBottom: "8px" }}>
                          <div className="flex items-start gap-2">
                            <div style={{ width: "20px", height: "20px", borderRadius: "4px", backgroundColor: "#060D1F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 700, color: "#E8C96A", flexShrink: 0 }}>
                              {(reply.user?.profile?.name || reply.user?.username || "U").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ marginBottom: "2px" }}>
                                <span style={{ color: "#E8C96A", fontSize: "11px", fontWeight: 600, marginRight: "6px" }}>
                                  {reply.user?.profile?.name || reply.user?.username || "Unknown"}
                                </span>
                                <span style={{ color: "#888888", fontSize: "10px" }}>
                                  {getTimeAgo(reply.createdAt)}
                                </span>
                              </div>
                              <p style={{ color: "#FFFFFF", fontSize: "11px", lineHeight: "1.4", wordBreak: "break-word" }}>
                                {reply.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: "12px", marginLeft: "50px" }}>
        {commentMediaPreview && (
          <div style={{ marginBottom: "8px", position: "relative", display: "inline-block" }}>
            {commentMedia?.type.startsWith("video/") ? (
              <video src={commentMediaPreview} style={{ maxWidth: "200px", maxHeight: "150px", borderRadius: "4px" }} />
            ) : (
              <img src={commentMediaPreview} alt="Preview" style={{ maxWidth: "200px", maxHeight: "150px", borderRadius: "4px" }} />
            )}
            <button onClick={removeCommentMedia} style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", width: "20px", height: "20px", color: "#fff", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ✕
            </button>
          </div>
        )}
        <div style={{ display: "flex", gap: "6px", position: "relative" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment..." style={{ width: "100%", backgroundColor: "#060D1F", border: "1px solid #1E2A47", borderRadius: "4px", padding: "8px 36px 8px 10px", color: "#FFFFFF", fontSize: "12px" }} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }} />
            <input type="file" accept="image/*,video/*" onChange={handleCommentMediaSelect} style={{ display: "none" }} id={`comment-media-${post.id}`} />
            <label htmlFor={`comment-media-${post.id}`} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", display: "flex", alignItems: "center", color: "#888888" }}>
              <IoIosAttach size={20} />
            </label>
          </div>
          <button onClick={handleAddComment} disabled={submittingComment || (!commentText.trim() && !commentMedia)} style={{ backgroundColor: "#E8C96A", color: "#060D1F", border: "none", borderRadius: "4px", padding: "8px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: submittingComment || (!commentText.trim() && !commentMedia) ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IoMdSend size={18} />
          </button>
        </div>
      </div>

      {showShare && (
        <ShareSheet
          postId={post.id}
          postContent={post.content}
          onClose={() => setShowShare(false)}
          onShared={() => { api.posts.share(post.id).catch(() => {}); }}
        />
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Post"
        message="Delete this post? This cannot be undone."
        confirmText="Delete"
        confirmColor="#EF4444"
      />

      <ConfirmDialog
        isOpen={showBlockConfirm}
        onClose={() => setShowBlockConfirm(false)}
        onConfirm={confirmBlock}
        title="Hide User"
        message={`Hide posts from @${username}?`}
        confirmText="Hide"
        confirmColor="#EF4444"
      />
    </div>
  );
}
