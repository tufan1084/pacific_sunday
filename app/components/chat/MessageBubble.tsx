"use client";

import { useState } from "react";
import { CheckIcon, TrashIcon, ReplyIcon } from "@/app/components/ui/Icons";

type MessageStatus = "pending" | "sent" | "delivered" | "read";

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
}

function StatusIcon({ status, isOwn }: { status: MessageStatus; isOwn: boolean }) {
  if (!isOwn) return null;

  const baseColor = "rgba(1, 5, 13, 0.5)";
  const blueColor = "#4A9EFF";

  if (status === "pending") {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: baseColor }}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    );
  }

  if (status === "sent") {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: baseColor }}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }

  const color = status === "read" ? blueColor : baseColor;
  return (
    <div className="relative" style={{ width: "16px", height: "12px" }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color, position: "absolute", left: 0 }}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color, position: "absolute", left: "5px" }}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  const handleReact = async (emoji: string) => {
    try {
      const token = localStorage.getItem("ps_token");
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/messages/${message.id}/react`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ emoji })
        }
      );
    } catch (error) {
      console.error("Error reacting to message:", error);
    }
  };

  return (
    <div
      className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"} group relative`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar (only for other user) */}
      {!isOwn && (
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold flex-shrink-0 overflow-hidden"
          style={{ backgroundColor: "#1A2332", color: "#E8C96A" }}
        >
          {message.sender.profile?.golfPassport?.photoUrl ? (
            <img
              src={message.sender.profile.golfPassport.photoUrl}
              alt={message.sender.username}
              className="w-full h-full object-cover"
            />
          ) : (
            (message.sender.profile?.name || message.sender.username).charAt(0).toUpperCase()
          )}
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        {/* Reply To */}
        {message.replyTo && (
          <div
            className="text-xs px-2.5 py-1.5 rounded-lg mb-1 border-l-2"
            style={{
              backgroundColor: isOwn ? "rgba(232, 201, 106, 0.08)" : "#1A2332",
              borderColor: "#E8C96A",
              color: "#6B7280"
            }}
          >
            <span className="font-semibold text-xs" style={{ color: "#E8C96A" }}>
              @{message.replyTo.sender.username}
            </span>
            <p className="truncate text-xs mt-0.5">
              {message.replyTo.messageType === "IMAGE"
                ? "📷 Photo"
                : message.replyTo.messageType === "VIDEO"
                ? "🎥 Video"
                : message.replyTo.content}
            </p>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-3 py-2 relative ${
            isOwn ? "rounded-tr-sm" : "rounded-tl-sm"
          }`}
          style={{
            backgroundColor: isOwn ? "#E8C96A" : "#1A2332",
            color: isOwn ? "#01050D" : "#E8E8E8"
          }}
        >
          {/* Media */}
          {message.mediaUrls && message.mediaUrls.length > 0 && (
            <div className="mb-2 space-y-2">
              {message.mediaUrls.map((url: string, idx: number) => (
                <div key={idx} className="rounded-lg overflow-hidden">
                  {message.messageType === "IMAGE" || url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img
                      src={url}
                      alt="Shared image"
                      className="max-w-full h-auto rounded-lg"
                      style={{ maxHeight: "280px" }}
                    />
                  ) : (
                    <video
                      src={url}
                      controls
                      className="max-w-full h-auto rounded-lg"
                      style={{ maxHeight: "280px" }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Text Content with Dynamic Time Position */}
          {message.content && (
            <div className="flex items-end gap-2">
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words flex-1">
                {message.content}
              </p>
              {/* Inline time for short messages */}
              {message.content.length <= 35 && (
                <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
                  <span
                    className="text-[10px] whitespace-nowrap"
                    style={{
                      color: isOwn ? "rgba(1, 5, 13, 0.5)" : "rgba(139, 154, 175, 0.7)"
                    }}
                  >
                    {formatTime(message.createdAt)}
                  </span>
                  <StatusIcon status={message.status || "sent"} isOwn={isOwn} />
                </div>
              )}
            </div>
          )}

          {/* Below time for long messages or media-only */}
          {(!message.content || message.content.length > 35) && (
            <div className="flex items-center gap-1 mt-1 justify-end">
              <span
                className="text-[10px]"
                style={{
                  color: isOwn ? "rgba(1, 5, 13, 0.5)" : "rgba(139, 154, 175, 0.7)"
                }}
              >
                {formatTime(message.createdAt)}
              </span>
              <StatusIcon status={message.status || "sent"} isOwn={isOwn} />
            </div>
          )}
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div
            className="flex gap-1 mt-1 px-2 py-0.5 rounded-full text-sm"
            style={{ backgroundColor: "#1A2332" }}
          >
            {message.reactions.map((reaction: any) => (
              <span key={reaction.id} className="text-xs">{reaction.emoji}</span>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {showActions && (
          <div
            className={`absolute flex gap-0.5 ${isOwn ? "right-0" : "left-0"}`}
            style={{ bottom: "-30px", zIndex: 10 }}
          >
            <button
              onClick={() => handleReact("❤️")}
              className="text-base px-1.5 py-0.5 rounded-full transition-all hover:scale-110"
              style={{ backgroundColor: "#1A2332" }}
              title="Love"
            >
              ❤️
            </button>
            <button
              onClick={() => handleReact("👍")}
              className="text-base px-1.5 py-0.5 rounded-full transition-all hover:scale-110"
              style={{ backgroundColor: "#1A2332" }}
              title="Like"
            >
              👍
            </button>
            <button
              onClick={() => handleReact("😂")}
              className="text-base px-1.5 py-0.5 rounded-full transition-all hover:scale-110"
              style={{ backgroundColor: "#1A2332" }}
              title="Laugh"
            >
              😂
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
