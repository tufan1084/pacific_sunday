"use client";

import { IoImageOutline } from "react-icons/io5";

interface CreatePostInlineProps {
  onOpenModal: () => void;
}

export default function CreatePostInline({ onOpenModal }: CreatePostInlineProps) {
  // Facebook-style "What's on your mind?" bar
  return (
    <div
      style={{
        backgroundColor: "#13192A",
        borderRadius: "8px",
        padding: "12px 14px",
        marginBottom: "12px",
        fontFamily: "var(--font-poppins), sans-serif",
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenModal}
          className="flex-1 text-left"
          style={{
            backgroundColor: "#060D1F",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "999px",
            padding: "10px 16px",
            color: "#888888",
            fontSize: "14px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          What's on your mind?
        </button>
        <button
          onClick={onOpenModal}
          className="flex items-center justify-center"
          style={{
            width: "38px", height: "38px", borderRadius: "5px",
            backgroundColor: "#060D1F",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#E8C96A",
            cursor: "pointer",
            flexShrink: 0,
          }}
          aria-label="Add media"
        >
          <IoImageOutline size={20} />
        </button>
      </div>
    </div>
  );
}
