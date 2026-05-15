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
  // WhatsApp-style source chooser: tapping the image icon on mobile asks
  // "Take Photo" vs "Choose from Gallery" instead of jumping straight to the
  // gallery (which is why there was no way to use the camera before).
  const [showSourceSheet, setShowSourceSheet] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Camera capture is a mobile affordance (the <input capture> attribute opens
  // the device camera). On desktop there's no camera, so the icon goes
  // straight to the file picker — same as WhatsApp Web.
  const isMobile =
    typeof window !== "undefined" &&
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

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
      // Keep the textarea focused so the mobile keyboard stays open after
      // sending — WhatsApp behaviour. (Paired with preventDefault on the send
      // button's mousedown so the tap never blurs the textarea to begin with.)
      textareaRef.current.focus();
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
    // NOTE: do NOT clear e.target.value here. The preview modal materialises
    // the blob (URL.createObjectURL) later in an effect; on mobile a
    // camera-captured file is ephemeral and clearing the input before that
    // happens drops the data — that's why "Take Photo" lost the picture.
    // We reset the input *before* opening it instead (openCamera/openGallery).
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setSelectedFiles(files.slice(0, MAX_FILES));
    setShowImagePreview(true);
    setShowSourceSheet(false);
  };

  // Reset value before opening so re-selecting the same file still fires
  // onChange, while never touching a freshly-captured file afterwards.
  const openGallery = () => {
    setShowSourceSheet(false);
    const el = fileInputRef.current;
    if (el) { el.value = ""; el.click(); }
  };

  const openCamera = () => {
    setShowSourceSheet(false);
    const el = cameraInputRef.current;
    if (el) { el.value = ""; el.click(); }
  };

  // Image icon tap: on mobile offer Camera vs Gallery (WhatsApp behaviour);
  // on desktop go straight to the file picker.
  const handleImageButtonClick = () => {
    if (isMobile) setShowSourceSheet(true);
    else openGallery();
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
      className="border-t px-3 py-1.5 flex-shrink-0 relative"
      style={{
        borderColor: "rgba(232, 201, 106, 0.1)",
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

      {/* Emoji/GIF picker — mounted at the input-bar root (not inside the small
          emoji button) so it can span the bar's full width and render as a
          proper full-width sheet on mobile. */}
      <EmojiGifPicker
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelectEmoji={handleEmojiClick}
        onSelectGif={handleGifSelect}
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
      <div className="flex items-end gap-2 min-w-0">
        {/* Pill containing emoji, textarea, image. min-w-0 lets the flex
            pill shrink below its content width on narrow phones — without it
            the textarea's intrinsic min-width pushes the send button off the
            edge and the whole row overflows. */}
        <div
          className="flex-1 min-w-0 flex items-center gap-1 rounded-3xl px-2 py-1"
          style={{
            backgroundColor: "#0F1629",
            border: "1px solid rgba(232, 201, 106, 0.15)",
            minHeight: "44px",
          }}
        >
          {/* Emoji/GIF Picker Button (inside pill, left) — the picker itself
              is mounted at the input-bar root above so it can be full-width. */}
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 rounded-full hover:bg-white/10 transition-all"
              style={{ color: showEmojiPicker ? "#E8C96A" : "#8B9AAF" }}
              aria-label="Insert emoji or GIF"
            >
              <EmojiIcon size={22} />
            </button>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 min-w-0 w-full px-1 py-1.5 bg-transparent outline-none resize-none"
            style={{
              color: "#E8E8E8",
              maxHeight: "100px",
              // 16px (not 14) — iOS Safari auto-zooms the whole viewport when
              // a focused input is < 16px, which is what made the composer
              // "not fit" on mobile.
              fontSize: "16px",
              lineHeight: "22px",
            }}
          />

          {/* Image Upload Button (inside pill, right) — opens the WhatsApp-style
              preview modal where the user adds a caption and confirms. */}
          <button
            type="button"
            onClick={handleImageButtonClick}
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
          {/* Camera capture — `capture` opens the rear camera directly on
              mobile. Single shot only (capture implies one file).
              Must be hidden exactly like the gallery input above
              (display:none via `hidden`). An absolutely-positioned, opacity-0,
              pointer-events:none clipped input makes some Android WebViews drop
              the captured file and cold-reload the page on return — which is
              why "Take Photo" lost the picture and refreshed the app. */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Send Button (outside pill, circular, gold) — text-only sends.
            Image sends are confirmed inside the preview modal. */}
        <button
          type="button"
          onClick={handleSend}
          // Don't let the tap move focus off the textarea — that blur is what
          // closed the keyboard after every send. Click still fires.
          onMouseDown={(e) => e.preventDefault()}
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

      {/* Source chooser (mobile) — WhatsApp-style: Camera or Gallery. */}
      {showSourceSheet && (
        <div
          onClick={() => setShowSourceSheet(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "420px",
              backgroundColor: "#1A2332",
              borderRadius: "16px",
              padding: "8px",
              border: "1px solid rgba(232, 201, 106, 0.15)",
            }}
          >
            <button
              type="button"
              onClick={openCamera}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl hover:bg-white/5 transition-colors"
              style={{ background: "none", border: "none", color: "#E8E8E8", fontSize: "15px", cursor: "pointer" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Take Photo
            </button>
            <div style={{ height: "1px", backgroundColor: "rgba(232, 201, 106, 0.08)", margin: "0 16px" }} />
            <button
              type="button"
              onClick={openGallery}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl hover:bg-white/5 transition-colors"
              style={{ background: "none", border: "none", color: "#E8E8E8", fontSize: "15px", cursor: "pointer" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Choose from Gallery
            </button>
            <div style={{ height: "1px", backgroundColor: "rgba(232, 201, 106, 0.08)", margin: "0 16px" }} />
            <button
              type="button"
              onClick={() => setShowSourceSheet(false)}
              className="w-full px-4 py-3.5 rounded-xl"
              style={{ background: "none", border: "none", color: "#8B9AAF", fontSize: "15px", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
