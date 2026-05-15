"use client";

import { useState, useRef, useEffect } from "react";
import { ImageIcon, EmojiIcon } from "@/app/components/ui/Icons";
import { emitTyping } from "@/app/services/socket";
import EmojiGifPicker from "./EmojiGifPicker";
import ImagePreviewModal from "./ImagePreviewModal";

interface ReplyTarget {
  id: number;
  content: string;
  messageType: string;
  sender: {
    id: number;
    username: string;
    profile?: { name?: string | null } | null;
  };
}

interface MessageInputProps {
  onSend: (content: string, mediaFiles?: File[]) => void;
  conversationId?: number;
  replyTo?: ReplyTarget | null;
  onCancelReply?: () => void;
}

const MAX_FILES = 5;

export default function MessageInput({ onSend, conversationId, replyTo, onCancelReply }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  // selectedFiles is now used only as the in-flight list for the preview modal.
  // It is cleared as soon as the modal sends or the user cancels.
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // When the user picks a message to reply to, jump focus into the textarea
  // so they can start typing immediately.
  useEffect(() => {
    if (replyTo) {
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [replyTo]);

  const handleSend = () => {
    if (!content.trim()) return;
    onSend(content);
    setContent("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
    
    // Typing indicator
    if (conversationId) {
      const userId = parseInt(localStorage.getItem("ps_user_id") || "0");
      
      if (!isTyping) {
        setIsTyping(true);
        emitTyping(conversationId, userId, true);
      }
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing after 2 seconds
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        emitTyping(conversationId, userId, false);
      }, 2000);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    // Insert at the textarea's caret if one is focused, otherwise append.
    // The picker stays open — WhatsApp lets you tap multiple emojis in a row.
    const ta = textareaRef.current;
    if (ta && document.activeElement === ta) {
      const start = ta.selectionStart ?? content.length;
      const end = ta.selectionEnd ?? content.length;
      const next = content.slice(0, start) + emoji + content.slice(end);
      setContent(next);
      requestAnimationFrame(() => {
        ta.focus();
        const pos = start + emoji.length;
        ta.setSelectionRange(pos, pos);
      });
    } else {
      setContent((prev) => prev + emoji);
    }
  };

  // GIFs send immediately on pick — WhatsApp behavior. We bypass the
  // preview-row flow so the user doesn't have to tap send a second time.
  const handleGifSelect = (file: File) => {
    onSend("", [file]);
  };

  // Picking files opens the WhatsApp-style preview modal. The modal handles
  // caption + send; this component just opens it with the chosen files.
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setSelectedFiles(files.slice(0, MAX_FILES));
    setShowImagePreview(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddMoreImages = (extra: File[]) => {
    setSelectedFiles((prev) => [...prev, ...extra].slice(0, MAX_FILES));
  };

  const handleSendFromModal = (caption: string, files: File[]) => {
    onSend(caption, files);
    setShowImagePreview(false);
    setSelectedFiles([]);
  };

  const handleCancelPreview = () => {
    setShowImagePreview(false);
    setSelectedFiles([]);
  };

  return (
    <div
      className="border-t px-4 py-3"
      style={{
        borderColor: "rgba(232, 201, 106, 0.1)",
        backgroundColor: "#1A2332",
        boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.2)",
      }}
    >
      <ImagePreviewModal
        isOpen={showImagePreview}
        files={selectedFiles}
        onClose={handleCancelPreview}
        onSend={handleSendFromModal}
        onAddMore={handleAddMoreImages}
        maxFiles={MAX_FILES}
      />

      {/* Reply preview row — sits directly above the input pill when the user
          has tapped Reply on a message. X dismisses, send clears it. */}
      {replyTo && (
        <div
          className="flex items-stretch gap-2 mb-2 rounded-lg overflow-hidden"
          style={{
            backgroundColor: "rgba(232, 201, 106, 0.06)",
            border: "1px solid rgba(232, 201, 106, 0.15)",
          }}
        >
          <div style={{ width: "3px", backgroundColor: "#E8C96A", flexShrink: 0 }} />
          <div className="flex-1 min-w-0 py-2 px-2">
            <div className="text-[11px] font-semibold" style={{ color: "#E8C96A" }}>
              Replying to {replyTo.sender.profile?.name || replyTo.sender.username}
            </div>
            <div className="text-xs truncate mt-0.5" style={{ color: "#8B9AAF" }}>
              {replyTo.messageType === "IMAGE"
                ? "📷 Photo"
                : replyTo.messageType === "VIDEO"
                ? "🎥 Video"
                : replyTo.content}
            </div>
          </div>
          <button
            onClick={() => onCancelReply?.()}
            aria-label="Cancel reply"
            className="px-3 transition-colors hover:bg-white/5"
            style={{ color: "#8B9AAF" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Input Area — WhatsApp layout: a single rounded pill (emoji + textarea + image)
          with a separate circular send button on the right. */}
      <div className="flex items-end gap-2">
        {/* Pill containing emoji, textarea, image */}
        <div
          className="flex-1 flex items-end gap-1 rounded-3xl px-2 py-1.5"
          style={{
            backgroundColor: "#0F1629",
            border: "1px solid rgba(232, 201, 106, 0.15)",
            minHeight: "44px",
          }}
        >
          {/* Emoji/GIF Picker Button (inside pill, left) */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 rounded-full hover:bg-white/10 transition-all"
              style={{ color: showEmojiPicker ? "#E8C96A" : "#8B9AAF" }}
              aria-label="Insert emoji or GIF"
            >
              <EmojiIcon size={22} />
            </button>

            <EmojiGifPicker
              isOpen={showEmojiPicker}
              onClose={() => setShowEmojiPicker(false)}
              onSelectEmoji={handleEmojiClick}
              onSelectGif={handleGifSelect}
            />
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-1 py-1.5 bg-transparent outline-none resize-none"
            style={{
              color: "#E8E8E8",
              maxHeight: "100px",
              fontSize: "14px",
              lineHeight: "20px",
            }}
          />

          {/* Image Upload Button (inside pill, right) — opens the WhatsApp-style
              preview modal where the user adds a caption and confirms. */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-full hover:bg-white/10 transition-all flex-shrink-0"
            style={{ color: "#8B9AAF" }}
            aria-label="Attach image"
          >
            <ImageIcon size={22} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Send Button (outside pill, circular, gold) — text-only sends.
            Image sends are confirmed inside the preview modal. */}
        <button
          onClick={handleSend}
          disabled={!content.trim()}
          className="flex-shrink-0 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 disabled:hover:scale-100 flex items-center justify-center"
          style={{
            backgroundColor: "#E8C96A",
            color: "#01050D",
            width: "44px",
            height: "44px",
          }}
          aria-label="Send message"
        >
          {/* WhatsApp-style filled paper-plane glyph. Nudged 1px right + 1px up
              to optically center it inside the circle (the shape's mass leans
              upper-right). */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ transform: "translate(1px, -1px)" }}
          >
            <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
