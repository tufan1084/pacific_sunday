"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { api } from "@/app/services/api";
import { SOCKET_URL, resolveMediaUrl } from "@/app/lib/constants";
import { io, Socket } from "socket.io-client";
import { IoIosAttach, IoMdSend } from "react-icons/io";
import { FiShare2, FiTrash2, FiEdit2, FiMoreHorizontal } from "react-icons/fi";
import { BsPinAngleFill } from "react-icons/bs";
import { useToast } from "@/app/context/ToastContext";
import PostActionMenu from "./PostActionMenu";
import ShareSheet from "./ShareSheet";
import ReportPanel from "./ReportPanel";
import ConfirmDialog from "../ui/ConfirmDialog";
import SaveToCategorySheet from "./SaveToCategorySheet";

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
  const [isSaved, setIsSaved] = useState<boolean>(Boolean(post.isSavedByMe));
  const [savedCategoryId, setSavedCategoryId] = useState<number | null>(post.myCategoryId ?? null);
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  const postUserId = post.user?.id || post.userId || 0;
  const isOwner = currentUserId > 0 && postUserId === currentUserId;
  const author = post.user?.profile?.name || post.user?.username || "Unknown";
  const username = post.user?.username;
  const initials = author.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const authorPhoto = post.user?.profile?.golfPassport?.photoUrl || null;
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

    socket.on("comment:deleted", ({ postId, commentId }: { postId: number; commentId: number }) => {
      if (postId !== post.id) return;
      setComments(prev =>
        prev
          .filter(c => c.id !== commentId)
          .map(c => ({
            ...c,
            replies: Array.isArray(c.replies) ? c.replies.filter((r: any) => r.id !== commentId) : c.replies,
          }))
      );
    });

    socket.on("comment:edited", ({ postId, comment }: { postId: number; comment: any }) => {
      if (postId !== post.id || !comment) return;
      setComments(prev => prev.map(c => {
        if (c.id === comment.id) return { ...c, content: comment.content, updatedAt: comment.updatedAt };
        if (Array.isArray(c.replies)) {
          return { ...c, replies: c.replies.map((r: any) => r.id === comment.id ? { ...r, content: comment.content, updatedAt: comment.updatedAt } : r) };
        }
        return c;
      }));
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
      const res = await api.posts.addComment(post.id, commentText || " ");
      if ((res as any)?.success === false) {
        // The fetchApi wrapper now returns 403 errors as { success:false, message, code }
        // instead of auto-logging the user out. Surface the moderation message.
        showToast(res.message || "Failed to add comment", "error");
        return;
      }
      setCommentText("");
      setCommentMedia(null);
      setCommentMediaPreview(null);
      // Server will emit comment:added to update all clients; local fetch keeps counts in sync
      onUpdate();
    } catch (error) {
      console.error("Failed to add comment:", error);
      showToast("Failed to add comment", "error");
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

  // 3-dot menu state for owner-only edit/delete on each comment + reply.
  // We track the *open* menu by comment id so opening one closes any other.
  const [openCommentMenuId, setOpenCommentMenuId] = useState<number | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  // Pending delete target for the styled ConfirmDialog (replaces window.confirm).
  const [pendingDeleteComment, setPendingDeleteComment] = useState<
    { id: number; isReply: boolean; parentId?: number } | null
  >(null);

  const startEdit = (id: number, content: string) => {
    setOpenCommentMenuId(null);
    setEditingCommentId(id);
    setEditText(content);
  };
  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditText("");
  };

  const handleSaveEdit = async (commentId: number) => {
    const text = editText.trim();
    if (!text || savingEdit) return;
    setSavingEdit(true);
    try {
      const res = await api.posts.editComment(commentId, text);
      if (res.success && (res.data as any)?.comment) {
        const updated = (res.data as any).comment;
        // Apply locally; the socket emit will sync any other open clients.
        setComments(prev => prev.map(c =>
          c.id === commentId
            ? { ...c, content: updated.content, updatedAt: updated.updatedAt }
            : ({
                ...c,
                replies: Array.isArray(c.replies)
                  ? c.replies.map((r: any) => r.id === commentId ? { ...r, content: updated.content, updatedAt: updated.updatedAt } : r)
                  : c.replies,
              })
        ));
        cancelEdit();
      } else {
        showToast(res.message || "Failed to edit comment", "error");
      }
    } catch {
      showToast("Failed to edit comment", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  // Open the styled confirmation dialog (replaces the native window.confirm
  // alert). Actual delete runs in confirmDeleteComment after the user clicks
  // the dialog's confirm button.
  const requestDeleteComment = (commentId: number, isReply: boolean = false, parentId?: number) => {
    setOpenCommentMenuId(null);
    setPendingDeleteComment({ id: commentId, isReply, parentId });
  };

  const confirmDeleteComment = async () => {
    const target = pendingDeleteComment;
    if (!target) return;
    setPendingDeleteComment(null);
    const snapshot = comments;
    if (target.isReply && target.parentId !== undefined) {
      setComments(prev => prev.map(c => c.id === target.parentId
        ? { ...c, replies: (c.replies || []).filter((r: any) => r.id !== target.id) }
        : c));
    } else {
      setComments(prev => prev.filter(c => c.id !== target.id));
    }
    try {
      const res = await api.posts.deleteComment(target.id);
      if (!res.success) {
        showToast(res.message || "Failed to delete comment", "error");
        setComments(snapshot);
      } else {
        // Server emits comment:deleted via socket; onUpdate() refreshes count.
        onUpdate();
      }
    } catch {
      showToast("Failed to delete comment", "error");
      setComments(snapshot);
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

  // Per-user hide. Optimistic — drops the card from the local feed immediately
  // via the parent's onHidePost callback, then persists via the API so the
  // hide survives across sessions and devices. Failure rolls back nothing on
  // the UI but logs a toast so the user knows the persist failed.
  const handleHide = async () => {
    setMenuOpen(false);
    onHidePost?.(post.id);
    try {
      const res = await api.posts.hide(post.id);
      if (!res.success) {
        showToast(res.message || "Could not hide post", "error");
      } else {
        showToast("Post hidden from your feed", "success");
      }
    } catch {
      showToast("Could not hide post", "error");
    }
  };

  const confirmBlock = () => {
    setShowBlockConfirm(false);
    onHideUser?.(postUserId);
    showToast(`Hidden @${username}`, "success");
  };

  const handleSave = () => {
    setMenuOpen(false);
    if (isSaved) {
      // Optimistic unsave
      const prevSaved = isSaved;
      const prevCat = savedCategoryId;
      setIsSaved(false);
      setSavedCategoryId(null);
      api.posts.unsave(post.id)
        .then((res) => {
          if (res.success) showToast("Post unsaved", "success");
          else { setIsSaved(prevSaved); setSavedCategoryId(prevCat); showToast(res.message || "Failed to unsave", "error"); }
        })
        .catch(() => { setIsSaved(prevSaved); setSavedCategoryId(prevCat); showToast("Failed to unsave", "error"); });
    } else {
      // Open the category picker; saving happens inside the sheet
      setShowSaveSheet(true);
    }
  };

  const handleSavedToCategory = (categoryId: number | null) => {
    setIsSaved(true);
    setSavedCategoryId(categoryId);
    setShowSaveSheet(false);
    showToast(categoryId ? "Post saved to category" : "Post saved", "success");
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

  const goToAuthor = () => { if (!isPublicView && postUserId && router) router.push(`/user/${postUserId}`); };
  const authorClickable = !isPublicView && postUserId;

  const divider = (
    <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.06)" }} />
  );

  const actionBtnStyle: React.CSSProperties = {
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
  };

  return (
    <article
      style={{
        backgroundColor: "#13192A",
        borderRadius: "10px",
        marginBottom: "16px",
        fontFamily: "var(--font-poppins), sans-serif",
        overflow: "hidden",
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

      {/* Header */}
      <div className="flex items-start gap-3" style={{ padding: "14px 16px 10px" }}>
        <div
          onClick={goToAuthor}
          style={{
            width: "44px", height: "44px", borderRadius: "8px",
            backgroundColor: "#060D1F", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "12px", fontWeight: 700,
            color: "#E8C96A", flexShrink: 0,
            cursor: authorClickable ? "pointer" : "default",
            overflow: "hidden",
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
            onClick={goToAuthor}
            style={{
              color: "#E8C96A", fontWeight: 600, fontSize: "15px",
              cursor: authorClickable ? "pointer" : "default",
              lineHeight: 1.2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
          >
            {author}
          </div>
          <div style={{ color: "#888", fontSize: "12px", marginTop: "3px", display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
            {username && <span>@{username}</span>}
            {username && <span>·</span>}
            <span>{timeAgo}</span>
          </div>
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
          onHide={handleHide}
          onCopyLink={handleCopyLink}
        />
      </div>

      {/* Content */}
      {post.content && (
        <p style={{ color: "#FFFFFF", fontSize: "14px", lineHeight: "1.6", fontWeight: 400, padding: "0 16px", margin: 0, wordBreak: "break-word" }}>
          {post.content}
        </p>
      )}

      {computedTags.length > 0 && (
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

      {/* Full-bleed media. Images render in a fixed 1:1 box with object-fit:cover
          (Instagram-style) so a feed of mixed portrait/landscape uploads stays
          visually consistent. Videos keep their native aspect because cropping
          a video looks bad. */}
      {mediaUrls.length > 0 && (
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
                  // 4:3 keeps every card visually consistent without going as tall
                  // as a 1:1 square. maxHeight caps the image on very wide
                  // viewports so it never dominates the screen.
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

      {/* Engagement summary (or breathing room above the divider when empty) */}
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
                    backgroundColor: "rgba(232,201,106,0.15)",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#E8C96A" stroke="#E8C96A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </span>
                <span>{currentLikes}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {commentsCount > 0 && (
              <button
                onClick={() => setShowAllComments(!showAllComments)}
                style={{ background: "none", border: "none", color: "#888", fontSize: "12.5px", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
              >
                {commentsCount} {commentsCount === 1 ? "comment" : "comments"}
              </button>
            )}
            {shareCount > 0 && <span>{shareCount} {shareCount === 1 ? "share" : "shares"}</span>}
          </div>
        </div>
      )}

      {/* Action bar */}
      <div style={{ padding: "0 8px" }}>
        {divider}
        <div className="flex items-stretch" style={{ padding: "4px 0" }}>
          <button
            onClick={handleLike}
            disabled={liking}
            style={{ ...actionBtnStyle, color: isLiked ? "#E8C96A" : "#94A3B8" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isLiked ? "#E8C96A" : "none"} stroke={isLiked ? "#E8C96A" : "#94A3B8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>Like</span>
          </button>
          <button
            onClick={() => setShowAllComments(!showAllComments)}
            style={{ ...actionBtnStyle, color: "#94A3B8" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <Image src="/icons/reply.svg" alt="" width={18} height={18} style={{ filter: "grayscale(1) brightness(0.7)" }} />
            <span>Comment</span>
          </button>
          <button
            onClick={() => setShowShare(true)}
            style={{ ...actionBtnStyle, color: "#94A3B8" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <FiShare2 size={18} />
            <span>Share</span>
          </button>
        </div>
        {divider}
      </div>

      {showReport && (
        <ReportPanel
          postId={post.id}
          onClose={() => setShowReport(false)}
          onReported={handleReported}
        />
      )}

      {commentsCount > 0 && !showAllComments && (
        <button
          onClick={() => setShowAllComments(true)}
          style={{
            background: "none", border: "none", color: "#888888",
            fontSize: "13px", cursor: "pointer",
            padding: "10px 16px 0", fontFamily: "inherit",
            textAlign: "left", width: "100%",
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
            fontSize: "13px", cursor: "pointer",
            padding: "10px 16px 0", fontFamily: "inherit",
            textAlign: "left", width: "100%",
          }}
        >
          Hide comments
        </button>
      )}

      {showAllComments && (
        <div style={{ padding: "10px 16px 0" }}>
          {loadingComments ? (
            <div style={{ color: "#888", fontSize: "12px", padding: "8px 0" }}>Loading...</div>
          ) : comments.length === 0 ? (
            <div style={{ color: "#888", fontSize: "12px", padding: "8px 0" }}>No comments yet</div>
          ) : comments.map((comment) => (
            <div key={comment.id} style={{ marginBottom: "10px" }}>
              <div className="flex items-start gap-2">
                <div style={{ width: "24px", height: "24px", borderRadius: "4px", backgroundColor: "#060D1F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700, color: "#E8C96A", flexShrink: 0, overflow: "hidden" }}>
                  {comment.user?.profile?.golfPassport?.photoUrl ? (
                    <img src={resolveMediaUrl(comment.user.profile.golfPassport.photoUrl)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    (comment.user?.profile?.name || comment.user?.username || "U").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-start" style={{ gap: "8px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ marginBottom: "2px" }}>
                        <span style={{ color: "#E8C96A", fontSize: "12px", fontWeight: 600, marginRight: "6px" }}>
                          {comment.user?.profile?.name || comment.user?.username || "Unknown"}
                        </span>
                        <span style={{ color: "#888888", fontSize: "11px" }}>
                          {getTimeAgo(comment.createdAt)}
                          {comment.updatedAt && comment.updatedAt !== comment.createdAt && <span style={{ marginLeft: "4px", fontStyle: "italic" }}>· edited</span>}
                        </span>
                      </div>
                      {editingCommentId === comment.id ? (
                        <div className="flex items-start" style={{ gap: "4px", marginBottom: "4px", flexWrap: "wrap" }}>
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            autoFocus
                            rows={2}
                            onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); }}
                            style={{ flex: "1 1 160px", minWidth: 0, backgroundColor: "#060D1F", border: "1px solid #1E2A47", borderRadius: "4px", padding: "5px 7px", color: "#FFFFFF", fontSize: "12px", fontFamily: "inherit", outline: "none", resize: "vertical", minHeight: "44px", maxHeight: "180px", lineHeight: "1.4" }}
                          />
                          <button onClick={() => handleSaveEdit(comment.id)} disabled={savingEdit || !editText.trim()} style={{ backgroundColor: "#E8C96A", color: "#060D1F", border: "none", borderRadius: "4px", padding: "4px 9px", fontSize: "10px", fontWeight: 600, cursor: savingEdit || !editText.trim() ? "not-allowed" : "pointer", opacity: savingEdit || !editText.trim() ? 0.5 : 1, flexShrink: 0 }}>
                            Save
                          </button>
                          <button onClick={cancelEdit} style={{ background: "transparent", color: "#888", border: "1px solid #1E2A47", borderRadius: "4px", padding: "4px 9px", fontSize: "10px", cursor: "pointer", flexShrink: 0 }}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <p style={{ color: "#FFFFFF", fontSize: "12px", lineHeight: "1.4", marginBottom: "4px", wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
                          {comment.content}
                        </p>
                      )}
                      <div className="flex items-center" style={{ gap: "10px" }}>
                        <button onClick={() => setReplyingTo(comment.id)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#E8C96A", fontSize: "11px" }}>
                          Reply
                        </button>
                      </div>
                    </div>
                    {/* Kebab menu — owner or post owner */}
                    {(comment.user?.id === currentUserId || isOwner) && editingCommentId !== comment.id && (
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <button
                          onClick={() => setOpenCommentMenuId(openCommentMenuId === comment.id ? null : comment.id)}
                          aria-label="Comment actions"
                          style={{ background: "none", border: "none", padding: "2px 4px", cursor: "pointer", color: "rgba(255,255,255,0.5)", borderRadius: "4px" }}
                        >
                          <FiMoreHorizontal size={14} />
                        </button>
                        {openCommentMenuId === comment.id && (
                          <div
                            onMouseLeave={() => setOpenCommentMenuId(null)}
                            style={{
                              position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 20,
                              backgroundColor: "#060D1F", border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "5px", minWidth: "120px",
                              boxShadow: "0 6px 20px rgba(0,0,0,0.5)", overflow: "hidden",
                            }}
                          >
                            {comment.user?.id === currentUserId && (
                              <button
                                onClick={() => startEdit(comment.id, comment.content)}
                                className="flex items-center"
                                style={{ gap: "8px", width: "100%", padding: "8px 12px", background: "none", border: "none", color: "#FFF", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
                              >
                                <FiEdit2 size={12} color="#E8C96A" /><span>Edit</span>
                              </button>
                            )}
                            <button
                              onClick={() => requestDeleteComment(comment.id)}
                              className="flex items-center"
                              style={{ gap: "8px", width: "100%", padding: "8px 12px", background: "none", border: "none", color: "#F87171", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", textAlign: "left", borderTop: comment.user?.id === currentUserId ? "1px solid rgba(255,255,255,0.06)" : "none" }}
                            >
                              <FiTrash2 size={12} /><span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {replyingTo === comment.id && (
                    <div style={{ marginTop: "6px", display: "flex", gap: "6px" }}>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        rows={1}
                        style={{
                          flex: 1, backgroundColor: "#060D1F", border: "1px solid #1E2A47",
                          borderRadius: "4px", padding: "6px 8px",
                          color: "#FFFFFF", fontSize: "12px", fontFamily: "inherit", outline: "none",
                          resize: "vertical", minHeight: "32px", maxHeight: "140px",
                          lineHeight: "1.4",
                        }}
                      />
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
                            <div style={{ width: "20px", height: "20px", borderRadius: "4px", backgroundColor: "#060D1F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 700, color: "#E8C96A", flexShrink: 0, overflow: "hidden" }}>
                              {reply.user?.profile?.golfPassport?.photoUrl ? (
                                <img src={resolveMediaUrl(reply.user.profile.golfPassport.photoUrl)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                (reply.user?.profile?.name || reply.user?.username || "U").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                              )}
                            </div>
                            <div className="flex items-start" style={{ flex: 1, minWidth: 0, gap: "6px" }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ marginBottom: "2px" }}>
                                  <span style={{ color: "#E8C96A", fontSize: "11px", fontWeight: 600, marginRight: "6px" }}>
                                    {reply.user?.profile?.name || reply.user?.username || "Unknown"}
                                  </span>
                                  <span style={{ color: "#888888", fontSize: "10px" }}>
                                    {getTimeAgo(reply.createdAt)}
                                    {reply.updatedAt && reply.updatedAt !== reply.createdAt && <span style={{ marginLeft: "4px", fontStyle: "italic" }}>· edited</span>}
                                  </span>
                                </div>
                                {editingCommentId === reply.id ? (
                                  <div className="flex items-start" style={{ gap: "4px", flexWrap: "wrap" }}>
                                    <textarea
                                      value={editText}
                                      onChange={(e) => setEditText(e.target.value)}
                                      autoFocus
                                      rows={2}
                                      onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); }}
                                      style={{ flex: "1 1 140px", minWidth: 0, backgroundColor: "#060D1F", border: "1px solid #1E2A47", borderRadius: "4px", padding: "4px 6px", color: "#FFFFFF", fontSize: "11px", fontFamily: "inherit", outline: "none", resize: "vertical", minHeight: "40px", maxHeight: "160px", lineHeight: "1.4" }}
                                    />
                                    <button onClick={() => handleSaveEdit(reply.id)} disabled={savingEdit || !editText.trim()} style={{ backgroundColor: "#E8C96A", color: "#060D1F", border: "none", borderRadius: "4px", padding: "3px 8px", fontSize: "10px", fontWeight: 600, cursor: savingEdit || !editText.trim() ? "not-allowed" : "pointer", opacity: savingEdit || !editText.trim() ? 0.5 : 1, flexShrink: 0 }}>
                                      Save
                                    </button>
                                    <button onClick={cancelEdit} style={{ background: "transparent", color: "#888", border: "1px solid #1E2A47", borderRadius: "4px", padding: "3px 8px", fontSize: "10px", cursor: "pointer", flexShrink: 0 }}>
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <p style={{ color: "#FFFFFF", fontSize: "11px", lineHeight: "1.4", wordBreak: "break-word", marginBottom: "2px", whiteSpace: "pre-wrap" }}>
                                    {reply.content}
                                  </p>
                                )}
                              </div>
                              {(reply.user?.id === currentUserId || isOwner) && editingCommentId !== reply.id && (
                                <div style={{ position: "relative", flexShrink: 0 }}>
                                  <button
                                    onClick={() => setOpenCommentMenuId(openCommentMenuId === reply.id ? null : reply.id)}
                                    aria-label="Reply actions"
                                    style={{ background: "none", border: "none", padding: "2px 3px", cursor: "pointer", color: "rgba(255,255,255,0.45)", borderRadius: "4px" }}
                                  >
                                    <FiMoreHorizontal size={12} />
                                  </button>
                                  {openCommentMenuId === reply.id && (
                                    <div
                                      onMouseLeave={() => setOpenCommentMenuId(null)}
                                      style={{
                                        position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 20,
                                        backgroundColor: "#060D1F", border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: "5px", minWidth: "110px",
                                        boxShadow: "0 6px 20px rgba(0,0,0,0.5)", overflow: "hidden",
                                      }}
                                    >
                                      {reply.user?.id === currentUserId && (
                                        <button
                                          onClick={() => startEdit(reply.id, reply.content)}
                                          className="flex items-center"
                                          style={{ gap: "8px", width: "100%", padding: "7px 10px", background: "none", border: "none", color: "#FFF", fontSize: "11px", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
                                        >
                                          <FiEdit2 size={11} color="#E8C96A" /><span>Edit</span>
                                        </button>
                                      )}
                                      <button
                                        onClick={() => requestDeleteComment(reply.id, true, comment.id)}
                                        className="flex items-center"
                                        style={{ gap: "8px", width: "100%", padding: "7px 10px", background: "none", border: "none", color: "#F87171", fontSize: "11px", cursor: "pointer", fontFamily: "inherit", textAlign: "left", borderTop: reply.user?.id === currentUserId ? "1px solid rgba(255,255,255,0.06)" : "none" }}
                                      >
                                        <FiTrash2 size={11} /><span>Delete</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
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

      <div style={{ padding: "10px 16px 14px" }}>
        {commentMediaPreview && (
          <div style={{ marginBottom: "8px", position: "relative", display: "inline-block" }}>
            {commentMedia?.type.startsWith("video/") ? (
              <video src={commentMediaPreview} style={{ maxWidth: "200px", maxHeight: "150px", borderRadius: "8px" }} />
            ) : (
              <img src={commentMediaPreview} alt="Preview" style={{ maxWidth: "200px", maxHeight: "150px", borderRadius: "8px" }} />
            )}
            <button onClick={removeCommentMedia} style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", width: "20px", height: "20px", color: "#fff", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ✕
            </button>
          </div>
        )}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              rows={1}
              style={{
                width: "100%", backgroundColor: "#060D1F",
                border: "1px solid #1E2A47", borderRadius: "18px",
                padding: "8px 40px 8px 14px",
                color: "#FFFFFF", fontSize: "13px",
                fontFamily: "inherit", outline: "none",
                resize: "vertical", minHeight: "38px", maxHeight: "180px",
                lineHeight: "1.4",
              }}
            />
            <input type="file" accept="image/*,video/*" onChange={handleCommentMediaSelect} style={{ display: "none" }} id={`comment-media-${post.id}`} />
            <label htmlFor={`comment-media-${post.id}`} style={{ position: "absolute", right: "12px", top: "10px", cursor: "pointer", display: "flex", alignItems: "center", color: "#888888" }}>
              <IoIosAttach size={18} />
            </label>
          </div>
          <button
            onClick={handleAddComment}
            disabled={submittingComment || (!commentText.trim() && !commentMedia)}
            style={{
              backgroundColor: "#E8C96A", color: "#060D1F",
              border: "none", borderRadius: "999px",
              width: "28px", height: "28px",
              cursor: submittingComment || (!commentText.trim() && !commentMedia) ? "not-allowed" : "pointer",
              opacity: submittingComment || (!commentText.trim() && !commentMedia) ? 0.5 : 1,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
            aria-label="Send comment"
          >
            <IoMdSend size={13} />
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

      {showSaveSheet && (
        <SaveToCategorySheet
          postId={post.id}
          currentCategoryId={savedCategoryId}
          onClose={() => setShowSaveSheet(false)}
          onSaved={handleSavedToCategory}
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

      <ConfirmDialog
        isOpen={pendingDeleteComment !== null}
        onClose={() => setPendingDeleteComment(null)}
        onConfirm={confirmDeleteComment}
        title="Are you sure want to delete?"
        message={pendingDeleteComment?.isReply
          ? "This reply will be permanently removed."
          : "This comment and all its replies will be permanently removed."}
        confirmText="Delete"
        confirmColor="#EF4444"
      />
    </article>
  );
}
