"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IoClose, IoHeart, IoHeartOutline, IoChatbubbleOutline, IoShareSocialOutline, IoBookmarkOutline, IoBookmark, IoSend, IoChevronBack, IoChevronForward, IoImageOutline } from "react-icons/io5";
import { FiCamera } from "react-icons/fi";
import { api } from "@/app/services/api";
import { resolveMediaUrl } from "@/app/lib/constants";
import ConfirmDialog from "../ui/ConfirmDialog";
import ShareSheet from "../community/ShareSheet";
import SaveToCategorySheet from "../community/SaveToCategorySheet";
import CommentItem from "../community/CommentItem";
import { useToast } from "@/app/context/ToastContext";
import EditableInput from "../ui/EditableInput";
import GifPicker from "@/app/components/ui/GifPicker";

interface PostModalNewProps {
  post: any;
  isOpen: boolean;
  onClose: () => void;
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

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function PostModalNew({ post: initialPost, isOpen, onClose }: PostModalNewProps) {
  const [post, setPost] = useState<any>(initialPost);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentMedia, setCommentMedia] = useState<File | null>(null);
  const [commentMediaPreview, setCommentMediaPreview] = useState<string | null>(null);
  const [showCommentGif, setShowCommentGif] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyMedia, setReplyMedia] = useState<File | null>(null);
  const [replyMediaPreview, setReplyMediaPreview] = useState<string | null>(null);
  const [openCommentMenuId, setOpenCommentMenuId] = useState<number | null>(null);
  const [showCommentSheet, setShowCommentSheet] = useState(false);
  const commentFileRef = useRef<HTMLInputElement>(null);
  const commentCameraRef = useRef<HTMLInputElement>(null);
  const [showReplySheet, setShowReplySheet] = useState(false);
  const replyFileRef = useRef<HTMLInputElement>(null);
  const replyCameraRef = useRef<HTMLInputElement>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [pendingDeleteComment, setPendingDeleteComment] = useState<{ id: number; isReply: boolean; parentId?: number } | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [isSaved, setIsSaved] = useState<boolean>(Boolean(initialPost?.isSavedByMe));
  const [savedCategoryId, setSavedCategoryId] = useState<number | null>(initialPost?.myCategoryId ?? null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { showToast } = useToast();

  const isMobile = typeof window !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  const openCommentCamera = () => {
    setShowCommentSheet(false);
    if (isMobile) {
      commentCameraRef.current?.click();
    } else {
      commentFileRef.current?.click();
    }
  };

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    setPost(initialPost);
    setIsSaved(Boolean(initialPost?.isSavedByMe));
    setSavedCategoryId(initialPost?.myCategoryId ?? null);
    setCurrentImageIndex(0);
  }, [initialPost]);

  useEffect(() => {
    if (!isOpen || !post?.id) return;

    const fetchComments = async () => {
      setLoadingComments(true);
      try {
        const res = await api.posts.getComments(post.id);
        const commentsData = (res.data as any)?.comments || [];
        setComments(Array.isArray(commentsData) ? commentsData : []);
      } catch (error) {
        console.error("Failed to load comments:", error);
      } finally {
        setLoadingComments(false);
      }
    };

    fetchComments();
  }, [post?.id, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (post?.mediaUrls && Array.isArray(post.mediaUrls)) {
        const mediaCount = post.mediaUrls.length;
        if (e.key === "ArrowLeft" && mediaCount > 1) {
          setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : mediaCount - 1));
        } else if (e.key === "ArrowRight" && mediaCount > 1) {
          setCurrentImageIndex((prev) => (prev < mediaCount - 1 ? prev + 1 : 0));
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, post?.mediaUrls]);

  const handleLike = async () => {
    if (!post) return;
    const wasLiked = post.isLikedByUser;
    
    setPost((prev: any) => ({
      ...prev,
      isLikedByUser: !prev.isLikedByUser,
      _count: {
        ...prev._count,
        likes: prev.isLikedByUser ? prev._count.likes - 1 : prev._count.likes + 1,
      },
    }));

    try {
      await api.posts.like(post.id);
    } catch (error) {
      console.error("Failed to like post:", error);
      setPost((prev: any) => ({
        ...prev,
        isLikedByUser: wasLiked,
        _count: {
          ...prev._count,
          likes: wasLiked ? prev._count.likes + 1 : prev._count.likes - 1,
        },
      }));
    }
  };

  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!post || (!commentText.trim() && !commentMedia) || submitting) return;

    setSubmitting(true);
    try {
      let mediaUrl: string | undefined;
      if (commentMedia) {
        const uploadRes = await api.posts.uploadMedia([commentMedia]);
        if (uploadRes.success && uploadRes.data?.mediaUrls?.[0]) {
          mediaUrl = uploadRes.data.mediaUrls[0];
        } else {
          showToast("Failed to upload image", "error");
          setSubmitting(false);
          return;
        }
      }
      const res = await api.posts.addComment(post.id, commentText || " ", undefined, mediaUrl);
      if ((res as any)?.success !== false) {
        const newComment = (res.data as any)?.comment;
        if (newComment) {
          setComments((prev) => [newComment, ...prev]);
          setPost((prev: any) => ({
            ...prev,
            _count: {
              ...prev._count,
              comments: prev._count.comments + 1,
            },
          }));
          setCommentText("");
          setCommentMedia(null);
          setCommentMediaPreview(null);
        }
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
      showToast("Failed to add comment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReply = async (parentId: number) => {
    if ((!replyText.trim() && !replyMedia) || submitting) return;
    setSubmitting(true);
    const textToSubmit = replyText;
    setReplyText("");
    setReplyingTo(null);
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
          setReplyingTo(parentId);
          setReplyText(textToSubmit);
          setSubmitting(false);
          return;
        }
      }
      const res = await api.posts.addComment(post.id, textToSubmit || " ", parentId, mediaUrl);
      if ((res as any)?.success !== false) {
        const newReply = (res.data as any)?.comment;
        if (newReply) {
          // Helper function to recursively add reply to nested structure
          const addReplyToTree = (comments: any[], newComment: any): any[] => {
            return comments.map(c => {
              if (c.id === newComment.parentId) {
                return { ...c, replies: [...(c.replies || []), newComment] };
              } else if (c.replies && c.replies.length > 0) {
                return { ...c, replies: addReplyToTree(c.replies, newComment) };
              }
              return c;
            });
          };
          
          setComments((prev) => addReplyToTree(prev, newReply));
          setPost((prev: any) => ({
            ...prev,
            _count: {
              ...prev._count,
              comments: prev._count.comments + 1,
            },
          }));
        }
      }
    } catch (error) {
      console.error("Failed to add reply:", error);
      setReplyingTo(parentId);
      setReplyText(textToSubmit);
    } finally {
      setSubmitting(false);
    }
  };

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
        // Helper function to recursively update comment in nested structure
        const updateInTree = (comments: any[]): any[] => {
          return comments.map(c => {
            if (c.id === commentId) {
              return { ...c, content: updated.content, updatedAt: updated.updatedAt };
            } else if (c.replies && c.replies.length > 0) {
              return { ...c, replies: updateInTree(c.replies) };
            }
            return c;
          });
        };
        
        setComments(prev => updateInTree(prev));
        cancelEdit();
      }
    } catch {
      console.error("Failed to edit comment");
    } finally {
      setSavingEdit(false);
    }
  };

  const requestDeleteComment = (commentId: number, isReply: boolean = false, parentId?: number) => {
    setOpenCommentMenuId(null);
    setPendingDeleteComment({ id: commentId, isReply, parentId });
  };

  const confirmDeleteComment = async () => {
    const target = pendingDeleteComment;
    if (!target) return;
    setPendingDeleteComment(null);
    const snapshot = comments;
    
    // Helper function to recursively remove comment from nested structure
    const removeFromTree = (comments: any[], commentId: number): any[] => {
      return comments
        .filter(c => c.id !== commentId)
        .map(c => ({
          ...c,
          replies: c.replies ? removeFromTree(c.replies, commentId) : c.replies,
        }));
    };
    
    setComments(prev => removeFromTree(prev, target.id));
    
    try {
      const res = await api.posts.deleteComment(target.id);
      if (!res.success) {
        setComments(snapshot);
      } else {
        setPost((prev: any) => ({
          ...prev,
          _count: {
            ...prev._count,
            comments: prev._count.comments - 1,
          },
        }));
      }
    } catch {
      setComments(snapshot);
    }
  };

  const handleShare = () => {
    setShowShare(true);
  };

  const handleSave = () => {
    if (isSaved) {
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
      setShowSaveSheet(true);
    }
  };

  const handleSavedToCategory = (categoryId: number | null) => {
    setIsSaved(true);
    setSavedCategoryId(categoryId);
    setShowSaveSheet(false);
    showToast(categoryId ? "Post saved to category" : "Post saved", "success");
  };

  const handlePrevImage = () => {
    const mediaUrls = Array.isArray(post?.mediaUrls) ? post.mediaUrls : [];
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : mediaUrls.length - 1));
  };

  const handleNextImage = () => {
    const mediaUrls = Array.isArray(post?.mediaUrls) ? post.mediaUrls : [];
    setCurrentImageIndex((prev) => (prev < mediaUrls.length - 1 ? prev + 1 : 0));
  };

  const handleCommentPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith("image/"));
    if (!imageItem) return;
    const file = imageItem.getAsFile();
    if (file) { e.preventDefault(); const f = normalizeImageFile(file); setCommentMedia(f); setCommentMediaPreview(URL.createObjectURL(f)); }
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) form.requestSubmit();
    }
  };

  const handleCommentMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const looksLikeImage = file.type.startsWith("image/") || /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(file.name); if (!looksLikeImage) { showToast("Please select an image", "error"); e.target.value = ""; return; } setCommentMedia(file); setCommentMediaPreview(URL.createObjectURL(file)); } e.target.value = ""; };

  const removeCommentMedia = () => {
    if (commentMediaPreview) URL.revokeObjectURL(commentMediaPreview);
    setCommentMedia(null);
    setCommentMediaPreview(null);
  };

  const removeReplyMedia = () => {
    if (replyMediaPreview) URL.revokeObjectURL(replyMediaPreview);
    setReplyMedia(null);
    setReplyMediaPreview(null);
  };

  const handleReplyPaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith("image/"));
    if (!imageItem) return;
    const file = imageItem.getAsFile();
    if (file) { e.preventDefault(); const f = normalizeImageFile(file); setReplyMedia(f); setReplyMediaPreview(URL.createObjectURL(f)); }
  };

  const handleReplyMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const looksLikeImage = file.type.startsWith("image/") || /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(file.name); if (!looksLikeImage) { showToast("Please select an image", "error"); e.target.value = ""; return; } setReplyMedia(file); setReplyMediaPreview(URL.createObjectURL(file)); } e.target.value = ""; };

  if (!isOpen || !mounted || !post) return null;

  const author = post?.user?.profile?.name || post?.user?.username || "Unknown";
  const username = post?.user?.username;
  const authorPhoto = post?.user?.profile?.golfPassport?.photoUrl;
  const initials = author
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const mediaUrls: string[] = Array.isArray(post?.mediaUrls) ? post.mediaUrls : [];
  const computedTags: string[] = Array.isArray(post?._computedTags) ? post._computedTags : [];
  const isLiked = Boolean(post?.isLikedByUser);
  const likesCount = post?._count?.likes || 0;
  const commentsCount = post?._count?.comments || 0;
  const currentUserId = typeof window !== "undefined" ? parseInt(localStorage.getItem("ps_user_id") || "0") : 0;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-container"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          maxWidth: '1400px',
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <style jsx>{`
          @media (min-width: 768px) {
            .modal-container {
              flex-direction: row !important;
              max-height: 95vh !important;
            }
            .media-section {
              flex: 1 1 60% !important;
              min-height: 100% !important;
              max-height: 100% !important;
            }
            .media-section img {
              max-height: 90vh !important;
            }
            .details-section {
              flex: 0 0 480px !important;
              max-width: 480px !important;
              min-width: 380px !important;
              max-height: none !important;
            }
          }
          @media (max-width: 767px) {
            .details-section {
              min-width: 100% !important;
            }
          }
        `}</style>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 30,
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <IoClose style={{ width: '24px', height: '24px', color: 'white' }} />
        </button>

        {/* Media Section */}
        <div
          className="media-section"
          style={{
            flex: '0 0 45vh',
            backgroundColor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {mediaUrls.length > 0 ? (
            <>
              <img
                src={resolveMediaUrl(mediaUrls[currentImageIndex])}
                alt="Post media"
                style={{
                  maxWidth: '100%',
                  maxHeight: '85vh',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                }}
              />
              
              {/* Navigation Buttons */}
              {mediaUrls.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                    className="nav-button-prev"
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      zIndex: 10,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                    }}
                  >
                    <IoChevronBack style={{ width: '20px', height: '20px', color: 'white' }} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    className="nav-button-next"
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      zIndex: 10,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                    }}
                  >
                    <IoChevronForward style={{ width: '20px', height: '20px', color: 'white' }} />
                  </button>

                  {/* Image Counter */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 500,
                      zIndex: 10,
                    }}
                  >
                    {currentImageIndex + 1} / {mediaUrls.length}
                  </div>

                  {/* Dot Indicators */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '44px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: '6px',
                      zIndex: 10,
                    }}
                  >
                    {mediaUrls.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(index);
                        }}
                        style={{
                          width: index === currentImageIndex ? '20px' : '6px',
                          height: '6px',
                          borderRadius: '3px',
                          backgroundColor: index === currentImageIndex ? '#E8C96A' : 'rgba(255, 255, 255, 0.5)',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div style={{ padding: '40px', color: '#888', textAlign: 'center' }}>
              <p className="text-white text-xl">{post.content}</p>
            </div>
          )}
        </div>

        {/* Details Section */}
        <div
          className="details-section"
          style={{
            flex: '1 1 auto',
            backgroundColor: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              flexShrink: 0,
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-[#E8C96A] via-[#d4b558] to-[#E8C96A] p-[2px] flex-shrink-0">
                <div className="w-full h-full rounded-lg bg-[#0f172a] flex items-center justify-center overflow-hidden">
                  {authorPhoto ? (
                    <img
                      src={resolveMediaUrl(authorPhoto)}
                      alt={author}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[#E8C96A] font-bold text-sm">{initials}</span>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-sm leading-tight truncate">
                  {author}
                </div>
                <div className="flex items-center gap-1.5 text-gray-400 text-[11px] mt-1">
                  {username && <span className="truncate">@{username}</span>}
                  {username && <span>·</span>}
                  <span>{timeAgo(post.createdAt)}</span>
                </div>
              </div>
            </div>
            <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors active:scale-90 flex-shrink-0">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
          </div>

          {/* Scrollable Content */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            {/* Post Content */}
            {post.content && (
              <div style={{ padding: '16px' }}>
                <p className="text-white text-[14px] leading-[1.6] whitespace-pre-wrap break-words">
                  {post.content}
                </p>
              </div>
            )}

            {/* Tags */}
            {computedTags.length > 0 && (
              <div style={{ padding: '0 16px 16px' }}>
                <div className="flex flex-wrap gap-2">
                  {computedTags.map((tag: string, i: number) => (
                    <span
                      key={i}
                      className="text-xs text-[#E8C96A] bg-[#E8C96A]/10 px-3 py-1 rounded-full font-medium"
                    >
                      #{tag.replace("_", " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: '#0f172a' }}>
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={handleLike}
                  className="group flex items-center gap-1.5 transition-all"
                  style={{ color: isLiked ? '#E8C96A' : '#9ca3af' }}
                >
                  {isLiked ? (
                    <IoHeart className="w-5 h-5" />
                  ) : (
                    <IoHeartOutline className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  )}
                  {likesCount > 0 && <span className="text-sm font-medium">{likesCount}</span>}
                </button>

                <button className="group flex items-center gap-1.5 text-gray-400 hover:text-[#E8C96A] transition-all">
                  <IoChatbubbleOutline className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  {commentsCount > 0 && <span className="text-sm font-medium">{commentsCount}</span>}
                </button>

                <button 
                  onClick={handleShare}
                  className="group flex items-center gap-1.5 text-gray-400 hover:text-[#E8C96A] transition-all ml-auto"
                >
                  <IoShareSocialOutline className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>

                <button 
                  onClick={handleSave}
                  className="group flex items-center gap-1.5 transition-all"
                  style={{ color: isSaved ? '#E8C96A' : '#9ca3af' }}
                >
                  {isSaved ? (
                    <IoBookmark className="w-5 h-5" />
                  ) : (
                    <IoBookmarkOutline className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  )}
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div style={{ padding: '16px' }}>
              <h3 className="text-white font-bold text-xs uppercase tracking-wide mb-3 text-gray-300">Comments ({commentsCount})</h3>

              {loadingComments ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-white/10" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-white/10 rounded w-1/4" />
                        <div className="h-3 bg-white/10 rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12">
                  <IoChatbubbleOutline className="w-10 h-10 mx-auto mb-2 text-gray-600" />
                  <p className="text-gray-500 text-sm">No comments yet</p>
                  <p className="text-gray-600 text-xs mt-1">Be the first to comment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      currentUserId={currentUserId}
                      isOwner={post.user?.id === currentUserId}
                      replyingTo={replyingTo}
                      replyText={replyText}
                      submittingComment={submitting}
                      editingCommentId={editingCommentId}
                      editText={editText}
                      savingEdit={savingEdit}
                      openCommentMenuId={openCommentMenuId}
                      onReplyClick={(id) => { setReplyingTo(id); setReplyText(""); setReplyMedia(null); setReplyMediaPreview(null); }}
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
                      onReplyImagePaste={(file) => { const f = normalizeImageFile(file); setReplyMedia(f); setReplyMediaPreview(URL.createObjectURL(f)); }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sticky Comment Input */}
          <div
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: '#0f172a',
              padding: '12px 16px',
              paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
              flexShrink: 0,
            }}
          >
            {commentMediaPreview && (
              <div style={{ marginBottom: '8px', position: 'relative', display: 'inline-block' }}>
                <img src={commentMediaPreview} alt="Preview" style={{ maxWidth: '150px', maxHeight: '100px', borderRadius: '8px' }} />
                <button 
                  onClick={removeCommentMedia} 
                  style={{ 
                    position: 'absolute', 
                    top: '4px', 
                    right: '4px', 
                    background: 'rgba(0,0,0,0.7)', 
                    border: 'none', 
                    borderRadius: '50%', 
                    width: '20px', 
                    height: '20px', 
                    color: '#fff', 
                    cursor: 'pointer', 
                    fontSize: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}
                >
                  ✕
                </button>
              </div>
            )}
            <form onSubmit={handleAddComment} className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-[#E8C96A] to-[#d4b558] p-[1.5px] flex-shrink-0">
                <div className="w-full h-full rounded-lg bg-[#0f172a] flex items-center justify-center overflow-hidden">
                  {authorPhoto ? (
                    <img
                      src={resolveMediaUrl(authorPhoto)}
                      alt={author}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[#E8C96A] font-bold text-xs">{initials}</span>
                  )}
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 rounded-full border border-transparent focus-within:border-[#E8C96A]/30 transition-all" style={{ backgroundColor: '#1a2332', padding: '10px 16px' }}>
                <EditableInput
                  value={commentText}
                  onChange={setCommentText}
                  onImagePaste={(file) => { const f = normalizeImageFile(file); setCommentMedia(f); setCommentMediaPreview(URL.createObjectURL(f)); }}
                  onEnter={() => { void handleAddComment(); }}
                  placeholder="Write a comment..."
                  ariaLabel="Write a comment"
                  disabled={submitting}
                  className="flex-1 bg-transparent text-white text-xs"
                  style={{ lineHeight: "1.4", maxHeight: "100px", overflowY: "auto" }}
                />
                {/* Hidden inputs */}
                <input ref={commentFileRef} type="file" accept="image/*,image/gif" onChange={handleCommentMediaSelect} style={{ display: 'none' }} />
                <input ref={commentCameraRef} type="file" accept="image/*" capture="environment" onChange={handleCommentMediaSelect} style={{ position: "absolute", width: "1px", height: "1px", opacity: 0, pointerEvents: "none", overflow: "hidden", clip: "rect(0,0,0,0)" }} />
                <button
                  type="button"
                  onClick={() => setShowCommentGif(true)}
                  disabled={submitting}
                  aria-label="Add GIF"
                  style={{ background: 'none', border: '1px solid rgba(232,201,106,0.4)', borderRadius: '6px', cursor: 'pointer', color: '#E8C96A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px 6px', height: '22px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', flexShrink: 0, fontFamily: 'inherit' }}
                >
                  GIF
                </button>
                <button
                  type="button"
                  onClick={() => setShowCommentSheet(true)}
                  disabled={submitting}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E8C96A', display: 'flex', alignItems: 'center', padding: '2px', flexShrink: 0 }}
                >
                  <IoImageOutline size={18} />
                </button>
                <button
                  type="submit"
                  disabled={(!commentText.trim() && !commentMedia) || submitting}
                  className="flex items-center justify-center text-[#E8C96A] disabled:opacity-40 disabled:cursor-not-allowed hover:scale-110 active:scale-95 transition-all"
                >
                  <IoSend className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>

          {/* Comment media sheet - rendered outside overflow:hidden container */}
        </div>
      </div>
      {/* Outside the comment <form> so GifPicker's type-less buttons can't
          submit the comment when tapped. */}
      <GifPicker
        isOpen={showCommentGif}
        onClose={() => setShowCommentGif(false)}
        onSelect={({ file }) => {
          setCommentMedia(file);
          setCommentMediaPreview(URL.createObjectURL(file));
          setShowCommentGif(false);
        }}
      />

      {showCommentSheet && (
        <div onClick={() => setShowCommentSheet(false)} style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', backgroundColor: '#13192A', borderRadius: '14px', padding: '8px', fontFamily: 'var(--font-poppins), sans-serif' }}>
            <button type="button" onClick={openCommentCamera} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: 'none', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
              <FiCamera size={20} color="#E8C96A" /> Take Photo
            </button>
            <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.07)', margin: '0 16px' }} />
            <button type="button" onClick={() => { setShowCommentSheet(false); commentFileRef.current?.click(); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: 'none', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> Choose from Gallery
            </button>
            <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.07)', margin: '0 16px' }} />
            <button type="button" onClick={() => setShowCommentSheet(false)} style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', borderRadius: '10px', color: '#94A3B8', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={pendingDeleteComment !== null}
        onClose={() => setPendingDeleteComment(null)}
        onConfirm={confirmDeleteComment}
        title="Delete Comment?"
        message={pendingDeleteComment?.isReply
          ? "This reply will be permanently removed."
          : "This comment and all its replies will be permanently removed."}
        confirmText="Delete"
        confirmColor="#EF4444"
      />

      {/* Share Sheet */}
      {showShare && (
        <ShareSheet
          postId={post.id}
          postContent={post.content}
          onClose={() => setShowShare(false)}
          onShared={() => { api.posts.share(post.id).catch(() => {}); }}
          onReshared={() => {}}
        />
      )}

      {/* Save Sheet */}
      {showSaveSheet && (
        <SaveToCategorySheet
          postId={post.id}
          currentCategoryId={savedCategoryId}
          onClose={() => setShowSaveSheet(false)}
          onSaved={handleSavedToCategory}
        />
      )}
    </div>,
    document.body
  );
}




