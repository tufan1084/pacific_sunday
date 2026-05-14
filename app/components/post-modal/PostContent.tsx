"use client";

import { resolveMediaUrl } from "@/app/lib/constants";

interface PostContentProps {
  post: any;
}

export default function PostContent({ post }: PostContentProps) {
  const mediaUrls: string[] = Array.isArray(post?.mediaUrls) ? post.mediaUrls : [];
  const computedTags: string[] = Array.isArray(post?._computedTags) ? post._computedTags : [];

  return (
    <div>
      {/* Post text */}
      {post.content && (
        <p className="text-white text-[15px] md:text-base leading-[1.6] mb-4 whitespace-pre-wrap break-words">
          {post.content}
        </p>
      )}

      {/* Media */}
      {mediaUrls.length > 0 && (
        <div
          className={`grid gap-1 rounded-2xl overflow-hidden mb-4 ${
            mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          {mediaUrls.map((url: string, idx: number) => {
            const isVideo =
              /\.(mp4|mov|avi|mkv|webm)(\?|$)/i.test(url) || url.includes("/video/");
            const fullUrl = resolveMediaUrl(url);

            if (isVideo) {
              return (
                <div
                  key={idx}
                  className="relative bg-black aspect-video"
                >
                  <video
                    src={fullUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
              );
            }

            return (
              <div
                key={idx}
                className={`relative bg-black ${
                  mediaUrls.length === 1
                    ? "aspect-[4/3] max-h-[500px]"
                    : "aspect-square max-h-[300px]"
                }`}
              >
                <img
                  src={fullUrl}
                  alt="Post media"
                  className="w-full h-full object-cover"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Tags */}
      {computedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {computedTags.map((tag: string, i: number) => (
            <span
              key={i}
              className="text-xs md:text-sm text-[#E8C96A] bg-[#E8C96A]/10 px-3 py-1 rounded-full font-medium hover:bg-[#E8C96A]/15 transition-colors cursor-pointer"
            >
              #{tag.replace("_", " ")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
