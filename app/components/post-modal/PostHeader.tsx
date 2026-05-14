"use client";

import { resolveMediaUrl } from "@/app/lib/constants";

interface PostHeaderProps {
  post: any;
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function PostHeader({ post }: PostHeaderProps) {
  const author = post?.user?.profile?.name || post?.user?.username || "Unknown";
  const username = post?.user?.username;
  const authorPhoto = post?.user?.profile?.golfPassport?.photoUrl;
  const initials = author
    .split(" ")
    .map((n: string) => n[0])
    .join("")  
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#E8C96A] to-[#d4b558] p-[2px] flex-shrink-0">
          <div className="w-full h-full rounded-full bg-[#0f172a] flex items-center justify-center text-[#E8C96A] font-bold text-sm overflow-hidden">
            {authorPhoto ? (
              <img
                src={resolveMediaUrl(authorPhoto)}
                alt={author}
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-sm md:text-base leading-tight truncate">
            {author}
          </div>
          <div className="flex items-center gap-1.5 text-gray-400 text-xs md:text-sm mt-0.5">
            {username && <span className="truncate">@{username}</span>}
            {username && <span className="flex-shrink-0">·</span>}
            <span className="flex-shrink-0">{timeAgo(post.createdAt)}</span>
          </div>
        </div>
      </div>
      <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all flex-shrink-0">
        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
    </div>
  );
}
