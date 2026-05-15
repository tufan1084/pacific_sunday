"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/app/services/api";
import { resolveMediaUrl } from "@/app/lib/constants";
import { subscribeFeed } from "@/app/lib/feedSocket";
import { IoMdSend } from "react-icons/io";
import { IoImageOutline } from "react-icons/io5";
import { FiShare2, FiTrash2, FiEdit2, FiMoreHorizontal, FiRepeat, FiCamera } from "react-icons/fi";
import { BsPinAngleFill } from "react-icons/bs";
import { useToast } from "@/app/context/ToastContext";
import PostActionMenu from "./PostActionMenu";
import ShareSheet from "./ShareSheet";
import ReportPanel from "./ReportPanel";
import ConfirmDialog from "../ui/ConfirmDialog";
import SaveToCategorySheet from "./SaveToCategorySheet";
import CommentItem from "./CommentItem";
import EditableInput from "../ui/EditableInput";
import GifPicker from "@/app/components/ui/GifPicker";


interface PostCardProps {
  post: any;
  onUpdate: () => void;
  onHidePost?: (postId: number) => void;
  onHideUser?: (userId: number) => void;
  isPublicView?: boolean;
  onOpenModal?: (postId: number) => void;
}

const MIME_EXT: Record<string, string> = {
  "image/gif": ".gif",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "image/heif": ".heif",
};

function normalizeImageFile(file: File): File {
  const hasExt = /\.[a-z0-9]{2,5}$/i.test(file.name);
  if (hasExt) return file;
  const ext = MIME_EXT[file.type.toLowerCase()] || ".png";
  const base = file.name || `pasted-${Date.now()}`;
  return new File([file], `${base}${ext}`, { type: file.type || "image/png", lastModified: file.lastModified });
}

export default function PostCard({ post, onUpdate, onHidePost, onHideUser, isPublicView = false, onOpenModal }: PostCardProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const currentUserId = typeof window !== "undefined" ? parseInt(localStorage.getItem("ps_user_id") || "0") : 0;



  // Like state — local mirror so socket broadcasts can update instantly
  // without waiting for a parent refetch. Initial value comes from the post
  // prop; useEffect below keeps it in sync if the parent refreshes.
  const [liking, setLiking] = useState(false);
  const [liked, setLiked] = useState(Boolean(post.isLikedByUser));
  const [likeCount, setLikeCount] = useState<number>(post._count?.likes ?? 0);
  useEffect(() => {
    setLiked(Boolean(post.isLikedByUser));
    setLikeCount(post._count?.likes ?? 0);
  }, [post.isLikedByUser, post._count?.likes]);
  const isLiked = liked;
  const currentLikes = likeCount;
  const commentsCount = post._count?.comments ?? 0;
  const shareCount = post.shareCount ?? 0;
  const isPinned = Boolean(post.isPinned);

  const [showAllComments, setShowAllComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(5);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyParentId, setReplyParentId] = useState<number | null>(null);
  const [replyMedia, setReplyMedia] = useState<File | null>(null);
  const [replyMediaPreview, setReplyMediaPreview] = useState<string | null>(null);
  const [commentMedia, setCommentMedia] = useState<File | null>(null);
  const [commentMediaPreview, setCommentMediaPreview] = useState<string | null>(null);

  const [showCommentSheet, setShowCommentSheet] = useState(false);
  const [showCommentGif, setShowCommentGif] = useState(false);
  const commentFileRef = useRef<HTMLInputElement>(null);
  const commentCameraRef = useRef<HTMLInputElement>(null);

  const isMobile = typeof window !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  const openCommentCamera = () => {
    setShowCommentSheet(false);
    if (isMobile) {
      commentCameraRef.current?.click();
    } else {
      commentFileRef.current?.click();
    }
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isSaved, setIsSaved] = useState<boolean>(Boolean(post.isSavedByMe));
  const [savedCategoryId, setSavedCategoryId] = useState<number | null>(post.myCategoryId ?? null);
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editPostText, setEditPostText] = useState("");
  const [savingPostEdit, setSavingPostEdit] = useState(false);
  const [editPostMedia, setEditPostMedia] = useState<File[]>([]);
  const [editPostMediaPreviews, setEditPostMediaPreviews] = useState<string[]>([]);
  const [existingPostMediaUrls, setExistingPostMediaUrls] = useState<string[]>([]);

  const postUserId = post.user?.id || post.userId || 0;
  const isOwner = currentUserId > 0 && postUserId === currentUserId;
  const author = post.user?.profile?.name || post.user?.username || "Unknown";
  const username = post.user?.username;
  const initials = author.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const authorPhoto = post.user?.profile?.golfPassport?.photoUrl || null;
  const timeAgo = getTimeAgo(post.createdAt);
  const mediaUrls = post.mediaUrls ? (Array.isArray(post.mediaUrls) ? post.mediaUrls : []) : [];
  const computedTags: string[] = Array.isArray(post._computedTags) ? post._computedTags : [];

  // Reshare detection
  const isReshare = Boolean(post.originalPostId && post.originalPost);
  const originalPost = post.originalPost;
  const originalAuthor = originalPost?.user?.profile?.name || originalPost?.user?.username || "Unknown";
  const originalUsername = originalPost?.user?.username;
  const originalInitials = originalAuthor.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const originalAuthorPhoto = originalPost?.user?.profile?.golfPassport?.photoUrl || null;
  const originalMediaUrls = originalPost?.mediaUrls ? (Array.isArray(originalPost.mediaUrls) ? originalPost.mediaUrls : []) : [];
  const originalTags: string[] = Array.isArray(originalPost?.tagSlugs) ? originalPost.tagSlugs : [];

  useEffect(() => {
    if (showAllComments && comments.length === 0 && !loadingComments) {
      loadComments();
    }
  }, [showAllComments, post.id]);

  // Live updates via the SHARED community socket — see app/lib/feedSocket.ts.
  // Each subscribeFeed call only adds/removes a listener; the underlying
  // socket is created once for the whole tab and torn down when the last
  // listener leaves. This replaces a per-card io() call that opened one
  // websocket per mounted PostCard (30 cards = 30 sockets on the iPhone).
  useEffect(() => {
    const onCommentAdded = ({ postId, comment }: { postId: number; comment: any }) => {
      if (postId !== post.id || !comment) return;
      const addReplyToTree = (comments: any[], newComment: any): any[] => { return comments.map(c => { if (c.id === newComment.parentId) { const replies = c.replies || []; if (replies.some((r: any) => r.id === newComment.id)) return c; const hasOptimistic = replies.some((r: any) => r._optimistic && r.userId === newComment.userId && r.content === newComment.content); if (hasOptimistic) { return { ...c, replies: replies.map((r: any) => (r._optimistic && r.userId === newComment.userId && r.content === newComment.content) ? newComment : r) }; } return { ...c, replies: [...replies, newComment] }; } else if (c.replies && c.replies.length > 0) { return { ...c, replies: addReplyToTree(c.replies, newComment) }; } return c; }); };
      setComments(prev => {
        if (comment.parentId) return addReplyToTree(prev, comment);
        if (prev.some(c => c.id === comment.id)) return prev;
        const hasOptimistic = prev.some(c => c._optimistic && c.userId === comment.userId && c.content === comment.content);
        if (hasOptimistic) return prev.map(c => (c._optimistic && c.userId === comment.userId && c.content === comment.content) ? comment : c);
        return [comment, ...prev];
      });
    };

    const onCommentDeleted = ({ postId, commentId }: { postId: number; commentId: number }) => {
      if (postId !== post.id) return;
      const removeFromTree = (comments: any[]): any[] => comments
        .filter(c => c.id !== commentId)
        .map(c => ({ ...c, replies: c.replies ? removeFromTree(c.replies) : c.replies }));
      setComments(prev => removeFromTree(prev));
    };

    const onPostLiked = ({ postId, likeCount: count, userId }: { postId: number; likeCount: number; userId: number }) => {
      if (postId !== post.id) return;
      setLikeCount(count);
      if (userId === currentUserId) setLiked(true);
    };

    const onPostUnliked = ({ postId, likeCount: count, userId }: { postId: number; likeCount: number; userId: number }) => {
      if (postId !== post.id) return;
      setLikeCount(count);
      if (userId === currentUserId) setLiked(false);
    };

    const onCommentEdited = ({ postId, comment }: { postId: number; comment: any }) => {
      if (postId !== post.id || !comment) return;
      const updateInTree = (comments: any[]): any[] => comments.map(c => {
        if (c.id === comment.id) return { ...c, content: comment.content, updatedAt: comment.updatedAt };
        if (c.replies && c.replies.length > 0) return { ...c, replies: updateInTree(c.replies) };
        return c;
      });
      setComments(prev => updateInTree(prev));
    };

    const unsub = [
      subscribeFeed("comment:added", onCommentAdded),
      subscribeFeed("comment:deleted", onCommentDeleted),
      subscribeFeed("post:liked", onPostLiked),
      subscribeFeed("post:unliked", onPostUnliked),
      subscribeFeed("comment:edited", onCommentEdited),
    ];

    return () => { unsub.forEach(fn => fn()); };
  }, [post.id, currentUserId]);

  const loadComments = async () => {
    if (loadingComments) return;
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

    // Optimistic comment — show immediately before API responds
    const optimisticComment = {
      id: Date.now(), // temp id
      postId: post.id,
      userId: currentUserId,
      content: commentText.trim(),
      mediaUrl: commentMediaPreview || null,
      createdAt: new Date().toISOString(),
      replies: [],
      user: {
        id: currentUserId,
        username: localStorage.getItem("ps_username") || "",
        profile: { name: localStorage.getItem("ps_name") || "", golfPassport: { photoUrl: localStorage.getItem("ps_photo") || null } },
      },
      _optimistic: true,
    };
    const textToSend = commentText.trim();
    setComments(prev => [optimisticComment, ...prev]);
    setShowAllComments(true);
    setCommentText("");
    setCommentMedia(null);
    setCommentMediaPreview(null);

    try {
      let mediaUrl: string | undefined;
      if (commentMedia) {
        const uploadRes = await api.posts.uploadMedia([commentMedia]);
        if (uploadRes.success && uploadRes.data?.mediaUrls?.[0]) {
          mediaUrl = uploadRes.data.mediaUrls[0];
        } else {
          showToast("Failed to upload image", "error");
          setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
          setCommentText(textToSend);
          setSubmittingComment(false);
          return;
        }
      }
      const res = await api.posts.addComment(post.id, textToSend || " ", undefined, mediaUrl);
      if ((res as any)?.success === false) {
        showToast(res.message || "Failed to add comment", "error");
        setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
        setCommentText(textToSend);
        return;
      }
      // Replace optimistic with real comment from server
      const realComment = (res?.data as any)?.comment;
      if (realComment) {
        setComments(prev => prev.map(c => c.id === optimisticComment.id ? realComment : c));
      }
      onUpdate();
    } catch (error) {
      console.error("Failed to add comment:", error);
      showToast("Failed to add comment", "error");
      setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
      setCommentText(textToSend);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCommentMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const looksLikeImage = file.type.startsWith("image/") || /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(file.name); if (!looksLikeImage) { showToast("Please select an image", "error"); e.target.value = ""; return; } const f = normalizeImageFile(file); setCommentMedia(f); setCommentMediaPreview(URL.createObjectURL(f)); } e.target.value = ""; };

  const handleCommentPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const imageItem = Array.from(e.clipboardData.items).find(i => i.type.startsWith("image/"));
    if (!imageItem) return;
    const file = imageItem.getAsFile();
    if (file) { e.preventDefault(); const f = normalizeImageFile(file); setCommentMedia(f); setCommentMediaPreview(URL.createObjectURL(f)); }
  };

  const removeCommentMedia = () => {
    if (commentMediaPreview) URL.revokeObjectURL(commentMediaPreview);
    setCommentMedia(null);
    setCommentMediaPreview(null);
  };

  const handleReplyMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const looksLikeImage = file.type.startsWith("image/") || /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(file.name); if (!looksLikeImage) { showToast("Please select an image", "error"); e.target.value = ""; return; } const f = normalizeImageFile(file); setReplyMedia(f); setReplyMediaPreview(URL.createObjectURL(f)); } e.target.value = ""; };

  const handleReplyPaste = (e: React.ClipboardEvent) => {
    const imageItem = Array.from(e.clipboardData.items).find(i => i.type.startsWith("image/"));
    if (!imageItem) return;
    const file = imageItem.getAsFile();
    if (file) { e.preventDefault(); const f = normalizeImageFile(file); setReplyMedia(f); setReplyMediaPreview(URL.createObjectURL(f)); }
  };

  const removeReplyMedia = () => {
    if (replyMediaPreview) URL.revokeObjectURL(replyMediaPreview);
    setReplyMedia(null);
    setReplyMediaPreview(null);
  };

  const handleAddReply = async (parentId: number) => {
    if ((!replyText.trim() && !replyMedia) || submittingComment) return;
    setSubmittingComment(true);
    const textToSubmit = replyText;
    setReplyText("");
    setReplyingTo(null);
    setReplyParentId(null);

    // Optimistic reply
    const optimisticReply = {
      id: Date.now(),
      postId: post.id,
      userId: currentUserId,
      parentId,
      content: textToSubmit.trim(),
      mediaUrl: replyMediaPreview || null,
      createdAt: new Date().toISOString(),
      replies: [],
      user: {
        id: currentUserId,
        username: localStorage.getItem("ps_username") || "",
        profile: { name: localStorage.getItem("ps_name") || "", golfPassport: { photoUrl: localStorage.getItem("ps_photo") || null } },
      },
      _optimistic: true,
    };
    setComments(prev => prev.map(c =>
      c.id === parentId ? { ...c, replies: [...(c.replies || []), optimisticReply] } : c
    ));
    setReplyMedia(null);
    setReplyMediaPreview(null);

    try {
      let mediaUrl: string | undefined;
      if (replyMedia) {
        const uploadRes = await api.posts.uploadMedia([replyMedia]);
        if (uploadRes.success && uploadRes.data?.mediaUrls?.[0]) {
          mediaUrl = uploadRes.data.mediaUrls[0];
        } else {
          showToast("Failed to upload image", "error");
          setComments(prev => prev.map(c =>
            c.id === parentId ? { ...c, replies: (c.replies || []).filter((r: any) => r.id !== optimisticReply.id) } : c
          ));
          setReplyingTo(parentId);
          setReplyText(textToSubmit);
          setSubmittingComment(false);
          return;
        }
      }
      const res = await api.posts.addComment(post.id, textToSubmit || " ", parentId, mediaUrl);
      // Replace optimistic with real reply
      const realReply = (res?.data as any)?.comment;
      if (realReply) {
        setComments(prev => prev.map(c =>
          c.id === parentId
            ? { ...c, replies: (c.replies || []).map((r: any) => r.id === optimisticReply.id ? realReply : r) }
            : c
        ));
      }
      onUpdate();
    } catch (error) {
      console.error("Failed to add reply:", error);
      setComments(prev => prev.map(c =>
        c.id === parentId ? { ...c, replies: (c.replies || []).filter((r: any) => r.id !== optimisticReply.id) } : c
      ));
      setReplyingTo(parentId);
      setReplyText(textToSubmit);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReplyClick = (commentId: number) => {
    setReplyingTo(commentId);
    setReplyText("");
    setReplyMedia(null);
    setReplyMediaPreview(null);
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
    // Optimistic update — flip immediately so the heart and count change in
    // the same frame as the tap. Socket broadcast confirms; on error we revert.
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!prevLiked);
    setLikeCount(prevCount + (prevLiked ? -1 : 1));
    try {
      await api.posts.like(post.id);
    } catch (error) {
      console.error("Failed to like post:", error);
      showToast("Could not update like", "error");
      setLiked(prevLiked);
      setLikeCount(prevCount);
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

  const handleEdit = () => {
    setMenuOpen(false);
    setEditPostText(post.content || "");
    setExistingPostMediaUrls(mediaUrls);
    setEditPostMedia([]);
    setEditPostMediaPreviews([]);
    setIsEditingPost(true);
  };

  const handleEditPostMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(f => f.type.startsWith("image/") || f.type.startsWith("video/"));
    if (validFiles.length === 0) {
      showToast("Please select valid image or video files", "error");
      return;
    }

    setEditPostMedia(validFiles);
    const previews = validFiles.map(f => URL.createObjectURL(f));
    setEditPostMediaPreviews(previews);
  };

  const removeExistingPostMedia = (index: number) => {
    setExistingPostMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeEditPostMedia = (index: number) => {
    setEditPostMedia(prev => prev.filter((_, i) => i !== index));
    setEditPostMediaPreviews(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (prev[index]) URL.revokeObjectURL(prev[index]);
      return updated;
    });
  };

  const handleSavePostEdit = async () => {
    const text = editPostText.trim();
    if (!text || savingPostEdit) return;
    setSavingPostEdit(true);
    try {
      let finalMediaUrls = [...existingPostMediaUrls];
      
      // Upload new media if any
      if (editPostMedia.length > 0) {
        const uploadRes = await api.posts.uploadMedia(editPostMedia);
        if (uploadRes.success && uploadRes.data?.mediaUrls) {
          finalMediaUrls = [...finalMediaUrls, ...uploadRes.data.mediaUrls];
        } else {
          showToast("Failed to upload media", "error");
          setSavingPostEdit(false);
          return;
        }
      }

      const res = await api.posts.edit(post.id, text, finalMediaUrls);
      if (res.success) {
        showToast("Post updated", "success");
        setIsEditingPost(false);
        setEditPostMedia([]);
        setEditPostMediaPreviews([]);
        setExistingPostMediaUrls([]);
        onUpdate();
      } else {
        showToast(res.message || "Failed to update post", "error");
      }
    } catch {
      showToast("Failed to update post", "error");
    } finally {
      setSavingPostEdit(false);
    }
  };

  const handleCancelPostEdit = () => {
    setIsEditingPost(false);
    setEditPostText("");
    setEditPostMedia([]);
    setEditPostMediaPreviews([]);
    setExistingPostMediaUrls([]);
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
    showToast("User blocked successfully", "success");
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
    // Persist the hide to the database so it survives refresh
    api.posts.hide(post.id).catch(() => {});
    onHidePost?.(post.id);
  };

  function getTimeAgo(date: string) {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Ignore clicks on interactive elements and the entire comment section
    const isInteractive = target.closest('button, a, textarea, input, label, [role="button"], [role="textbox"], [contenteditable="true"]');
    if (isInteractive) return;
    
    // Cancel edit mode if clicking elsewhere on the card
    if (isEditingPost) {
      setIsEditingPost(false);
      setEditPostText("");
      return;
    }
    
    // Only trigger modal for posts with media
    if (mediaUrls.length > 0) {
      onOpenModal?.(post.id);
    }
  };

  const goToAuthor = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPublicView && postUserId && router) router.push(`/user/${postUserId}`);
  };
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
    <>
      <article
        onClick={handleCardClick}
        style={{
          backgroundColor: "#13192A",
          borderRadius: "8px",
          marginBottom: "12px",
          fontFamily: "var(--font-poppins), sans-serif",
          overflow: "hidden",
          cursor: mediaUrls.length > 0 ? "pointer" : "default",
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
          onEdit={handleEdit}
          onDelete={handleDelete}
          onShare={handleShare}
          onReport={handleReport}
          onBlock={handleBlock}
          onSave={handleSave}
          onHide={handleHide}
          onCopyLink={handleCopyLink}
        />
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
                gridTemplateRows: originalMediaUrls.length > 2 ? "repeat(2, 1fr)" : "auto",
                gap: "2px",
                backgroundColor: "#060D1F",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              {originalMediaUrls.slice(0, originalMediaUrls.length === 1 ? 1 : 4).map((url: string, idx: number) => {
                const isVideo = /\.(mp4|mov|avi|mkv|webm)(\?|$)/i.test(url) || url.includes("/video/");
                const fullUrl = resolveMediaUrl(url);
                const isLastItem = idx === 3 && originalMediaUrls.length > 4;
                const remainingCount = originalMediaUrls.length - 4;
                
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
                        filter: isLastItem ? "brightness(0.4)" : "none",
                      }}
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
                          fontSize: "24px",
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

          {/* Original engagement stats */}
          {(originalPost._count?.likes > 0 || originalPost._count?.comments > 0) && (
            <div
              className="flex items-center gap-3"
              style={{ marginTop: "8px", color: "#888", fontSize: "11px" }}
            >
              {originalPost._count?.likes > 0 && <span>{originalPost._count.likes} likes</span>}
              {originalPost._count?.comments > 0 && <span>{originalPost._count.comments} comments</span>}
            </div>
          )}
        </div>
      )}

      {/* Content - Regular post */}
      {!isReshare && post.content && (
        <>
          {isEditingPost ? (
            <div style={{ padding: "0 16px", marginBottom: "12px" }}>
              <textarea
                value={editPostText}
                onChange={(e) => setEditPostText(e.target.value)}
                disabled={savingPostEdit}
                style={{
                  width: "100%",
                  backgroundColor: "#060D1F",
                  border: "1px solid #1E2A47",
                  borderRadius: "8px",
                  padding: "12px",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  outline: "none",
                  resize: "vertical",
                  minHeight: "100px",
                  lineHeight: "1.6",
                }}
                maxLength={2000}
              />
              
              {/* Existing Media */}
              {existingPostMediaUrls.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <div style={{ color: "#888", fontSize: "12px", marginBottom: "8px" }}>Current Media:</div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {existingPostMediaUrls.map((url, idx) => (
                      <div key={idx} style={{ position: "relative", width: "100px", height: "100px" }}>
                        <img
                          src={resolveMediaUrl(url)}
                          alt="Media"
                          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
                        />
                        <button
                          onClick={() => removeExistingPostMedia(idx)}
                          style={{
                            position: "absolute",
                            top: "4px",
                            right: "4px",
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(0,0,0,0.7)",
                            border: "none",
                            color: "#FFF",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "16px",
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* New Media Previews */}
              {editPostMediaPreviews.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <div style={{ color: "#888", fontSize: "12px", marginBottom: "8px" }}>New Media:</div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {editPostMediaPreviews.map((preview, idx) => (
                      <div key={idx} style={{ position: "relative", width: "100px", height: "100px" }}>
                        <img
                          src={preview}
                          alt="Preview"
                          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
                        />
                        <button
                          onClick={() => removeEditPostMedia(idx)}
                          style={{
                            position: "absolute",
                            top: "4px",
                            right: "4px",
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(0,0,0,0.7)",
                            border: "none",
                            color: "#FFF",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "16px",
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Add Media Button */}
              <div style={{ marginTop: "12px" }}>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={handleEditPostMediaSelect}
                  style={{ display: "none" }}
                  id={`edit-post-media-${post.id}`}
                />
                <label
                  htmlFor={`edit-post-media-${post.id}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    backgroundColor: "rgba(232,201,106,0.1)",
                    border: "1px solid rgba(232,201,106,0.3)",
                    borderRadius: "6px",
                    color: "#E8C96A",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(232,201,106,0.2)";
                    e.currentTarget.style.borderColor = "#E8C96A";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(232,201,106,0.1)";
                    e.currentTarget.style.borderColor = "rgba(232,201,106,0.3)";
                  }}
                >
                  <IoImageOutline size={16} />
                  Add/Change Media
                </label>
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "8px", justifyContent: "flex-end" }}>
                <button
                  onClick={handleCancelPostEdit}
                  disabled={savingPostEdit}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "transparent",
                    color: "#888",
                    border: "1px solid #1E2A47",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: savingPostEdit ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePostEdit}
                  disabled={savingPostEdit || !editPostText.trim()}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: savingPostEdit || !editPostText.trim() ? "rgba(232,201,106,0.5)" : "#E8C96A",
                    color: "#01050D",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: savingPostEdit || !editPostText.trim() ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {savingPostEdit ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <p style={{ color: "#FFFFFF", fontSize: "14px", lineHeight: "1.6", fontWeight: 400, padding: "0 16px", margin: 0, wordBreak: "break-word" }}>
              {post.content}
            </p>
          )}
        </>
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
            gridTemplateRows: mediaUrls.length > 2 ? "repeat(2, 1fr)" : "auto",
            gap: "2px",
            backgroundColor: "#060D1F",
          }}
        >
          {mediaUrls.slice(0, mediaUrls.length === 1 ? 1 : 4).map((url: string, idx: number) => {
            const isVideo = /\.(mp4|mov|avi|mkv|webm)(\?|$)/i.test(url) || url.includes("/video/");
            const fullUrl = resolveMediaUrl(url);
            const isLastItem = idx === 3 && mediaUrls.length > 4;
            const remainingCount = mediaUrls.length - 4;
            
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
                    filter: isLastItem ? "brightness(0.4)" : "none",
                  }}
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
                      fontSize: "32px",
                      fontWeight: 700,
                      cursor: "pointer",
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
            style={{ ...actionBtnStyle, color: "#94A3B8" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isLiked ? "#EF4444" : "none"} stroke={isLiked ? "#EF4444" : "#94A3B8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>{isLiked ? "Liked" : "Like"}</span>
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
          onClick={() => { 
            setShowAllComments(true); 
            setVisibleCommentsCount(5);
            if (comments.length === 0) {
              loadComments();
            }
          }}
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
          onClick={() => { setShowAllComments(false); setVisibleCommentsCount(5); }}
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
          ) : (
            <>
              {comments.slice(0, visibleCommentsCount).map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUserId}
                  isOwner={isOwner}
                  replyingTo={replyingTo}
                  replyText={replyText}
                  submittingComment={submittingComment}
                  editingCommentId={editingCommentId}
                  editText={editText}
                  savingEdit={savingEdit}
                  openCommentMenuId={openCommentMenuId}
                  onReplyClick={handleReplyClick}
                  onReplySubmit={handleAddReply}
                  onReplyCancel={() => { setReplyingTo(null); setReplyText(""); setReplyMedia(null); setReplyMediaPreview(null); }}
                  onReplyTextChange={setReplyText}
                  onEditStart={startEdit}
                  onEditSave={handleSaveEdit}
                  onEditCancel={cancelEdit}
                  onEditTextChange={setEditText}
                  onMenuToggle={setOpenCommentMenuId}
                  onDeleteRequest={requestDeleteComment}
                  replyMedia={replyMedia}
                  replyMediaPreview={replyMediaPreview}
                  onReplyMediaSelect={handleReplyMediaSelect}
                  onReplyMediaRemove={removeReplyMedia}
                  onReplyPaste={handleReplyPaste}
                  onReplyImagePaste={(file) => {
                    // GIFs from keyboard come as image/gif — skip normalizeImageFile to preserve animation
                    const f = file.type === "image/gif" ? file : normalizeImageFile(file);
                    setReplyMedia(f);
                    setReplyMediaPreview(URL.createObjectURL(f));
                  }}
                  onReplyGifInsert={(file) => { setReplyMedia(file); setReplyMediaPreview(URL.createObjectURL(file)); }}
                />
              ))}
              {visibleCommentsCount < comments.length && (
                <button
                  onClick={() => setVisibleCommentsCount(prev => prev + 5)}
                  style={{
                    background: "none", border: "none", color: "#E8C96A",
                    fontSize: "13px", cursor: "pointer", fontWeight: 500,
                    padding: "10px 0", fontFamily: "inherit",
                    textAlign: "left", width: "100%",
                  }}
                >
                  View more comments ({comments.length - visibleCommentsCount} remaining)
                </button>
              )}
            </>
          )}
        </div>
      )}

      <div style={{ padding: "10px 16px 14px" }}>
        {commentMediaPreview && (
          <div style={{ marginBottom: "8px", position: "relative", display: "inline-block" }}>
            <img src={commentMediaPreview} alt="Preview" style={{ maxWidth: "200px", maxHeight: "150px", borderRadius: "8px" }} />
            <button onClick={removeCommentMedia} style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", width: "20px", height: "20px", color: "#fff", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ✕
            </button>
          </div>
        )}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <EditableInput
              value={commentText}
              onChange={setCommentText}
              onImagePaste={(file) => { const f = normalizeImageFile(file); setCommentMedia(f); setCommentMediaPreview(URL.createObjectURL(f)); }}
              onGifInsert={(file) => { setCommentMedia(file); setCommentMediaPreview(URL.createObjectURL(file)); }}
              onEnter={handleAddComment}
              placeholder="Write a comment..."
              ariaLabel="Write a comment"
              style={{
                width: "100%", backgroundColor: "#060D1F",
                border: "1px solid #1E2A47", borderRadius: "18px",
                padding: "9px 40px 9px 14px",
                color: "#FFFFFF", fontSize: "16px",
                fontFamily: "inherit",
                minHeight: "38px", maxHeight: "180px",
                lineHeight: "1.4",
                overflowY: "auto",
              }}
            />
            <input ref={commentFileRef} type="file" accept="image/*,image/gif" onChange={handleCommentMediaSelect} style={{ display: "none" }} />
            <input ref={commentCameraRef} type="file" accept="image/*" capture="environment" onChange={handleCommentMediaSelect} style={{ position: "absolute", width: "1px", height: "1px", opacity: 0, pointerEvents: "none", overflow: "hidden", clip: "rect(0,0,0,0)" }} />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowCommentSheet(true); }}
              style={{ position: "absolute", right: "12px", top: "10px", cursor: "pointer", display: "flex", alignItems: "center", color: "#E8C96A", background: "none", border: "none", padding: 0 }}
            >
              <IoImageOutline size={18} />
            </button>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowCommentGif(true); }}
            disabled={submittingComment}
            aria-label="Add GIF"
            style={{
              backgroundColor: "transparent",
              color: "#E8C96A",
              border: "1px solid rgba(232,201,106,0.4)",
              borderRadius: "6px",
              height: "28px",
              padding: "0 8px",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              cursor: submittingComment ? "not-allowed" : "pointer",
              opacity: submittingComment ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontFamily: "inherit",
            }}
          >
            GIF
          </button>
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
          onReshared={onUpdate}
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

      <GifPicker
        isOpen={showCommentGif}
        onClose={() => setShowCommentGif(false)}
        onSelect={({ file }) => {
          setCommentMedia(file);
          setCommentMediaPreview(URL.createObjectURL(file));
          setShowCommentGif(false);
        }}
      />

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
        title="Block User"
        message={`Block all posts from @${username}? You won't see any of their posts in your feed.`}
        confirmText="Block"
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

      {showCommentSheet && (
        <div onClick={() => setShowCommentSheet(false)} style={{ position: "fixed", inset: 0, zIndex: 10000, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "420px", backgroundColor: "#13192A", borderRadius: "14px", padding: "8px", fontFamily: "var(--font-poppins), sans-serif" }}>
            <button type="button" onClick={openCommentCamera} style={{ width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", background: "none", border: "none", borderRadius: "10px", color: "#fff", fontSize: "15px", cursor: "pointer", fontFamily: "inherit" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
              <FiCamera size={20} color="#E8C96A" /> Take Photo
            </button>
            <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.07)", margin: "0 16px" }} />
            <button type="button" onClick={() => { setShowCommentSheet(false); commentFileRef.current?.click(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", background: "none", border: "none", borderRadius: "10px", color: "#fff", fontSize: "15px", cursor: "pointer", fontFamily: "inherit" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> Choose from Gallery
            </button>
            <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.07)", margin: "0 16px" }} />
            <button type="button" onClick={() => setShowCommentSheet(false)} style={{ width: "100%", padding: "14px 16px", background: "none", border: "none", borderRadius: "10px", color: "#94A3B8", fontSize: "15px", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}







