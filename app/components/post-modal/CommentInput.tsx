"use client";

import { useRef, useState } from "react";
import { IoMdSend } from "react-icons/io";
import { IoImageOutline, IoClose } from "react-icons/io5";
import { FiCamera } from "react-icons/fi";
import EditableInput from "../ui/EditableInput";
import GifPicker from "@/app/components/ui/GifPicker";

const MIME_EXT: Record<string, string> = {
  "image/gif": ".gif",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "image/heif": ".heif",
};

function normalizeImageFile(file: File): File {
  const hasExt = /\.[a-z0-9]{2,5}$/i.test(file.name);
  if (hasExt) return file;
  const ext = MIME_EXT[file.type.toLowerCase()] || ".png";
  const base = file.name || `pasted-${Date.now()}`;
  return new File([file], `${base}${ext}`, { type: file.type || "image/png", lastModified: file.lastModified });
}

interface CommentInputProps {
  onSubmit: (content: string, media?: File) => Promise<void>;
}

export default function CommentInput({ onSubmit }: CommentInputProps) {
  const [comment, setComment] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const isMobile = typeof window !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  const openCamera = () => {
    setShowSheet(false);
    if (isMobile) {
      cameraRef.current?.click();
    } else {
      fileRef.current?.click();
    }
  };

  const attachFile = (file: File) => {
    const looksLikeImage =
      file.type.startsWith("image/") ||
      /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(file.name);
    if (!looksLikeImage) {
      console.warn("CommentInput: skipped non-image file", { name: file.name, type: file.type, size: file.size });
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setMedia(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeMedia = () => {
    if (preview) URL.revokeObjectURL(preview);
    setMedia(null);
    setPreview(null);
  };

  const doSubmit = async () => {
    if ((!comment.trim() && !media) || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(comment, media ?? undefined);
      setComment("");
      removeMedia();
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await doSubmit();
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="p-3 md:p-4">
      {preview && (
        <div className="mb-2 relative inline-block">
          <img src={preview} alt="" className="max-w-[120px] max-h-[80px] rounded-lg object-cover" />
          <button type="button" onClick={removeMedia} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-white border border-white/20">
            <IoClose size={12} />
          </button>
        </div>
      )}
      <div className="flex items-center gap-2 md:gap-3">
        <EditableInput
          value={comment}
          onChange={setComment}
          onImagePaste={(file) => attachFile(normalizeImageFile(file))}
          onEnter={doSubmit}
          placeholder="Add a comment..."
          ariaLabel="Add a comment"
          disabled={submitting}
          className="flex-1 bg-white/5 border border-white/10 rounded-3xl px-4 md:px-5 py-2.5 md:py-3 text-white text-sm md:text-base focus:border-[#E8C96A]/50 focus:bg-white/10 transition-all"
          style={{ minHeight: "44px", maxHeight: "120px", lineHeight: "1.4", overflowY: "auto" }}
        />
        {/* Hidden inputs */}
        <input ref={fileRef} type="file" accept="image/*,image/gif" onChange={(e) => { const f = e.target.files?.[0]; if (f) attachFile(f); e.target.value = ""; }} style={{ display: "none" }} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={(e) => { const f = e.target.files?.[0]; if (f) attachFile(f); e.target.value = ""; }} style={{ position: "absolute", width: "1px", height: "1px", opacity: 0, pointerEvents: "none", overflow: "hidden", clip: "rect(0,0,0,0)" }} />
        <button
          type="button"
          onClick={() => setShowGif(true)}
          disabled={submitting}
          aria-label="Add GIF"
          className="h-7 px-2 flex items-center justify-center rounded-md text-[11px] font-bold tracking-wide text-[#E8C96A] border border-[#E8C96A]/40 hover:bg-[#E8C96A]/10 transition-all flex-shrink-0 disabled:opacity-40"
        >
          GIF
        </button>
        <button type="button" onClick={() => setShowSheet(true)} disabled={submitting} className="w-10 h-10 flex items-center justify-center rounded-full text-[#E8C96A] hover:bg-[#E8C96A]/10 transition-all flex-shrink-0 disabled:opacity-40">
          <IoImageOutline size={20} />
        </button>
        <button
          type="submit"
          disabled={(!comment.trim() && !media) || submitting}
          className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full bg-[#E8C96A] text-[#0f172a] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#d4b558] active:scale-95 transition-all flex-shrink-0 shadow-lg"
          aria-label="Send comment"
        >
          <IoMdSend size={20} />
        </button>
      </div>

      {/* Media source sheet */}
      {showSheet && (
        <div onClick={() => setShowSheet(false)} style={{ position: "fixed", inset: 0, zIndex: 10000, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "420px", backgroundColor: "#13192A", borderRadius: "14px", padding: "8px", fontFamily: "var(--font-poppins), sans-serif" }}>
            <button
              type="button"
              onClick={openCamera}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", background: "none", border: "none", borderRadius: "10px", color: "#fff", fontSize: "15px", cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <FiCamera size={20} color="#E8C96A" />
              Take Photo
            </button>
            <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.07)", margin: "0 16px" }} />
            <button
              type="button"
              onClick={() => { setShowSheet(false); fileRef.current?.click(); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", background: "none", border: "none", borderRadius: "10px", color: "#fff", fontSize: "15px", cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              Choose from Gallery
            </button>
            <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.07)", margin: "0 16px" }} />
            <button
              type="button"
              onClick={() => setShowSheet(false)}
              style={{ width: "100%", padding: "14px 16px", background: "none", border: "none", borderRadius: "10px", color: "#94A3B8", fontSize: "15px", cursor: "pointer", fontFamily: "inherit" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </form>

    {/* Rendered OUTSIDE the <form> on purpose: GifPicker's internal buttons
        have no type attribute, so inside a form they'd act as submit buttons
        and fire the comment off when you tap a GIF / close. */}
    <GifPicker
      isOpen={showGif}
      onClose={() => setShowGif(false)}
      onSelect={({ file }) => attachFile(file)}
    />
    </>
  );
}



