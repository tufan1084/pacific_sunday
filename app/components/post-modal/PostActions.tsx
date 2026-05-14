"use client";

import { IoHeart, IoHeartOutline } from "react-icons/io5";
import { FiShare2, FiBookmark } from "react-icons/fi";
import { useState } from "react";

interface PostActionsProps {
  post: any;
  onLike: () => void;
}

export default function PostActions({ post, onLike }: PostActionsProps) {
  const [liking, setLiking] = useState(false);
  const [liked, setLiked] = useState(Boolean(post?.isLikedByUser));
  const isLiked = liked;
  const likesCount = post?._count?.likes || 0;
  const commentsCount = post?._count?.comments || 0;

  const handleLike = async () => {
    if (liking) return;
    setLiked(!liked);
    setLiking(true);
    await onLike();
    setLiking(false);
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/post/${post.id}`;
      await navigator.clipboard.writeText(shareUrl);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  return (
    <div className="py-3">
      {/* Action buttons */}
      <div className="flex items-center gap-1 mb-3">
        <button
          onClick={handleLike}
          disabled={liking}
          className={`group flex items-center gap-2 px-4 py-2.5 rounded-full transition-all active:scale-95 ${
            isLiked
              ? "text-red-500"
              : "text-gray-400 hover:text-red-500 hover:bg-red-500/10"
          }`}
        >
          {isLiked ? (
            <IoHeart size={24} className="animate-in zoom-in-50 duration-200" />
          ) : (
            <IoHeartOutline size={24} className="group-hover:scale-110 transition-transform" />
          )}
        </button>

        <button className="group flex items-center gap-2 px-4 py-2.5 rounded-full text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all active:scale-95">
          <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>

        <button
          onClick={handleShare}
          className="group flex items-center gap-2 px-4 py-2.5 rounded-full text-gray-400 hover:text-green-400 hover:bg-green-400/10 transition-all active:scale-95"
        >
          <FiShare2 size={22} className="group-hover:scale-110 transition-transform" />
        </button>

        <button className="group flex items-center gap-2 px-4 py-2.5 rounded-full text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 transition-all active:scale-95 ml-auto">
          <FiBookmark size={22} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Stats */}
      {(likesCount > 0 || commentsCount > 0) && (
        <div className="flex items-center gap-4 text-gray-400 text-sm px-2">
          {likesCount > 0 && (
            <button className="hover:underline font-medium">
              {likesCount} {likesCount === 1 ? "like" : "likes"}
            </button>
          )}
          {commentsCount > 0 && (
            <button className="hover:underline font-medium">
              {commentsCount} {commentsCount === 1 ? "comment" : "comments"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
