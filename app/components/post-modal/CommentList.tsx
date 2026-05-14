"use client";

import { resolveMediaUrl } from "@/app/lib/constants";

interface CommentListProps {
  comments: any[];
  loading: boolean;
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function CommentList({ comments, loading }: CommentListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-white/10 rounded w-1/4" />
              <div className="h-3 bg-white/10 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-sm">No comments yet</p>
        <p className="text-xs mt-1">Be the first to share your thoughts</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 -mr-2">
      {comments.map((comment) => {
        const author =
          comment.user?.profile?.name || comment.user?.username || "Unknown";
        const authorPhoto = comment.user?.profile?.golfPassport?.photoUrl;
        const initials = author
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return (
          <div key={comment.id} className="flex gap-3 group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E8C96A] to-[#d4b558] p-[2px] flex-shrink-0">
              <div className="w-full h-full rounded-full bg-[#0f172a] flex items-center justify-center text-[#E8C96A] font-bold text-xs overflow-hidden">
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
              <div className="bg-white/5 rounded-2xl px-4 py-2.5 group-hover:bg-white/[0.07] transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-semibold text-sm">
                    {author}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {timeAgo(comment.createdAt)}
                  </span>
                </div>
                <p className="text-gray-200 text-sm leading-relaxed break-words">
                  {comment.content}
                </p>
              </div>
              <div className="flex items-center gap-4 mt-2 px-2">
                <button className="text-xs text-gray-400 hover:text-white font-medium transition-colors">Reply</button>
                <button className="text-xs text-gray-400 hover:text-red-400 font-medium transition-colors">Like</button>
              </div>
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-6 mt-3 space-y-3">
                  {comment.replies.map((reply: any) => {
                    const replyAuthor =
                      reply.user?.profile?.name || reply.user?.username || "Unknown";
                    const replyPhoto = reply.user?.profile?.golfPassport?.photoUrl;
                    const replyInitials = replyAuthor
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <div key={reply.id} className="flex gap-2 group/reply">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E8C96A] to-[#d4b558] p-[1.5px] flex-shrink-0">
                          <div className="w-full h-full rounded-full bg-[#0f172a] flex items-center justify-center text-[#E8C96A] font-bold text-[10px] overflow-hidden">
                            {replyPhoto ? (
                              <img
                                src={resolveMediaUrl(replyPhoto)}
                                alt={replyAuthor}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              replyInitials
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="bg-white/5 rounded-2xl px-3 py-2 group-hover/reply:bg-white/[0.07] transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-semibold text-xs">
                                {replyAuthor}
                              </span>
                              <span className="text-gray-500 text-[10px]">
                                {timeAgo(reply.createdAt)}
                              </span>
                            </div>
                            <p className="text-gray-200 text-xs leading-relaxed break-words">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
