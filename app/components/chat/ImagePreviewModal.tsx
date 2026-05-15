"use client";

import { useEffect, useRef, useState } from "react";
import { CloseIcon, EmojiIcon } from "@/app/components/ui/Icons";
import EmojiGifPicker from "./EmojiGifPicker";

interface Props {
  isOpen: boolean;
  files: File[];
  initialCaption?: string;
  onClose: () => void;
  // Caption goes to the FIRST image only — same as WhatsApp. The send button
  // ships all selected images plus the caption in one go.
  onSend: (caption: string, files: File[]) => void;
  onAddMore?: (extraFiles: File[]) => void;
  maxFiles?: number;
}

export default function ImagePreviewModal({
  isOpen,
  files,
  initialCaption = "",
  onClose,
  onSend,
  onAddMore,
  maxFiles = 5,
}: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [caption, setCaption] = useState(initialCaption);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const addMoreRef = useRef<HTMLInputElement>(null);
  const captionRef = useRef<HTMLInputElement>(null);

  // Build object URLs once per file set. Revoke on cleanup so we don't leak
  // memory across repeated open/close cycles.
  useEffect(() => {
    if (!isOpen) return;
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [isOpen, files]);

  // Reset state when opening; focus the caption.
  useEffect(() => {
    if (isOpen) {
      setCaption(initialCaption);
      setCurrentIdx(0);
      const t = setTimeout(() => captionRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen, initialCaption]);

  // Esc closes the modal.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleAddMore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;
    const room = maxFiles - files.length;
    const adding = picked.slice(0, room);
    onAddMore?.(adding);
    if (addMoreRef.current) addMoreRef.current.value = "";
  };

  const handleSend = () => {
    if (files.length === 0) return;
    onSend(caption, files);
  };

  if (!isOpen || files.length === 0) return null;

  const current = previewUrls[currentIdx];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        // Solid near-black backdrop matches WhatsApp mobile's image-preview
        // backdrop — the chat panel disappears entirely behind it.
        backgroundColor: "#0B141A",
        zIndex: 100,
        fontFamily: "var(--font-poppins), sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Image area — takes ALL available vertical space above the thumbnail
          strip and caption row. Close (X) is an overlay anchored to the top
          left of this area, exactly like WhatsApp mobile. */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          overflow: "hidden",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close preview"
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            zIndex: 2,
            background: "rgba(0, 0, 0, 0.55)",
            border: "none",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            cursor: "pointer",
          }}
        >
          <CloseIcon size={18} />
        </button>

        {current && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={current}
            alt={`Selected ${currentIdx + 1}`}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
          />
        )}
      </div>

      {/* Thumbnail strip + "+" add-more button. Hidden when there's only one
          image and no room for more. */}
      {(files.length > 1 || files.length < maxFiles) && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            padding: "8px 12px",
            display: "flex",
            gap: "6px",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          {previewUrls.map((url, idx) => {
            const isActive = idx === currentIdx;
            return (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                style={{
                  width: "48px",
                  height: "48px",
                  padding: 0,
                  border: isActive ? "2px solid #E8C96A" : "2px solid transparent",
                  borderRadius: "6px",
                  overflow: "hidden",
                  background: "transparent",
                  cursor: "pointer",
                  opacity: isActive ? 1 : 0.55,
                  transition: "opacity 0.15s, border-color 0.15s",
                }}
                aria-label={`Image ${idx + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </button>
            );
          })}
          {files.length < maxFiles && (
            <>
              <button
                onClick={() => addMoreRef.current?.click()}
                aria-label="Add more images"
                style={{
                  width: "48px",
                  height: "48px",
                  padding: 0,
                  border: "1.5px dashed rgba(232, 201, 106, 0.4)",
                  borderRadius: "6px",
                  background: "transparent",
                  color: "#E8C96A",
                  fontSize: "22px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                +
              </button>
              <input
                ref={addMoreRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleAddMore}
                style={{ display: "none" }}
              />
            </>
          )}
        </div>
      )}

      {/* Caption + send row. position:relative so the emoji/GIF picker
          anchors to this full-width row (and spans the viewport on mobile)
          instead of the ~20px emoji-button wrapper. */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: "10px 12px 14px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexShrink: 0,
          maxWidth: "600px",
          width: "100%",
          margin: "0 auto",
          position: "relative",
        }}
      >
        <EmojiGifPicker
          isOpen={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
          onSelectEmoji={(emoji) => {
            setCaption((prev) => prev + emoji);
            captionRef.current?.focus();
          }}
          onSelectGif={() => {}}
        />

        {/* Caption pill */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 14px",
            borderRadius: "999px",
            backgroundColor: "#1A2332",
            border: "1px solid rgba(232, 201, 106, 0.15)",
            position: "relative",
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <button
              onClick={() => setShowEmojiPicker((v) => !v)}
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: showEmojiPicker ? "#E8C96A" : "#8B9AAF", padding: 0 }}
              aria-label="Insert emoji"
            >
              <EmojiIcon size={20} />
            </button>
          </div>
          <input
            ref={captionRef}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Add a caption..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#E8E8E8",
              // 16px — anything smaller makes iOS Safari zoom the whole
              // viewport on focus, which is what broke this page on mobile.
              fontSize: "16px",
              minWidth: 0,
            }}
          />
        </div>

        {/* Send button with image-count badge */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={handleSend}
            aria-label="Send"
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              border: "none",
              backgroundColor: "#E8C96A",
              color: "#01050D",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ transform: "translate(1px, -1px)" }}
            >
              <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
          {files.length > 1 && (
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                minWidth: "20px",
                height: "20px",
                padding: "0 5px",
                borderRadius: "999px",
                background: "#1A2332",
                color: "#E8C96A",
                fontSize: "11px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #0B141A",
                pointerEvents: "none",
              }}
            >
              {files.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
