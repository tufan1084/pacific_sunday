"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "@/app/services/api";
import PostHeader from "./PostHeader";
import PostContent from "./PostContent";
import PostActions from "./PostActions";
import CommentList from "./CommentList";
import CommentInput from "./CommentInput";
import PostModalSkeleton from "./PostModalSkeleton";

interface PostModalContainerProps {
  post: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function PostModalContainer({ post: initialPost, isOpen, onClose }: PostModalContainerProps) {
  const [post, setPost] = useState<any>(initialPost);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    setPost(initialPost);
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
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handleLike = async () => {
    if (!post) return;
    try {
      await api.posts.like(post.id);
      setPost((prev: any) => ({
        ...prev,
        isLikedByUser: !prev.isLikedByUser,
        _count: {
          ...prev._count,
          likes: prev.isLikedByUser ? prev._count.likes - 1 : prev._count.likes + 1,
        },
      }));
    } catch (error) {
      console.error("Failed to like post:", error);
    }
  };

  const handleAddComment = async (content: string, media?: File) => {
    if (!post || (!content.trim() && !media)) return;
    try {
      let mediaUrl: string | undefined;
      if (media) {
        const uploadRes = await api.posts.uploadMedia([media]);
        if (uploadRes.success && uploadRes.data?.mediaUrls?.[0]) {
          mediaUrl = uploadRes.data.mediaUrls[0];
        }
      }
      const res = await api.posts.addComment(post.id, content || " ", undefined, mediaUrl);
      if ((res as any)?.success !== false) {
        const newComment = (res.data as any)?.comment;
        if (newComment) {
          setComments((prev) => [newComment, ...prev]);
          setPost((prev: any) => ({
            ...prev,
            _count: { ...prev._count, comments: prev._count.comments + 1 },
          }));
        }
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 animate-in fade-in duration-200 md:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full md:h-auto md:max-w-[720px] lg:max-w-[900px] bg-[#0f172a] md:rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
        style={{ maxHeight: "100vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 md:top-4 md:right-4 z-10 w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full bg-black/70 hover:bg-black/80 active:scale-95 transition-colors"
          aria-label="Close"
        >
          <svg
            className="w-5 h-5 md:w-6 md:h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {post ? (
          <div className="flex flex-col h-full">
            {/* Header - Fixed */}
            <div className="border-b border-white/5 p-4 md:p-6 flex-shrink-0">
              <PostHeader post={post} />
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-4 md:p-6">
                <PostContent post={post} />
              </div>
              
              <div className="px-4 md:px-6 pb-4">
                <PostActions post={post} onLike={handleLike} />
              </div>

              {/* Comments section */}
              <div className="border-t border-white/5 px-4 md:px-6 py-5">
                <h3 className="text-white font-bold text-base md:text-lg mb-4">
                  Comments
                </h3>
                <CommentList comments={comments} loading={loadingComments} />
              </div>
            </div>

            {/* Fixed comment input */}
            <div className="border-t border-white/5 bg-[#0a0f1e] flex-shrink-0">
              <CommentInput onSubmit={handleAddComment} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-400 text-base">Post not found</p>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
