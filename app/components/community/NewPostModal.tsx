"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { api } from "@/app/services/api";
import { useToast } from "@/app/context/ToastContext";

interface NewPostModalProps {
  onClose: () => void;
  onPostCreated: () => void;
}

export default function NewPostModal({ onClose, onPostCreated }: NewPostModalProps) {
  const { showToast } = useToast();
  const [postText, setPostText] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + mediaFiles.length > 5) {
      showToast("Maximum 5 media files allowed", "error");
      return;
    }

    const newFiles = [...mediaFiles, ...files];
    setMediaFiles(newFiles);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setMediaPreviews([...mediaPreviews, ...newPreviews]);
  };

  const removeMedia = (index: number) => {
    URL.revokeObjectURL(mediaPreviews[index]);
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    setMediaPreviews(mediaPreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!postText.trim()) {
      showToast("Please write something", "error");
      return;
    }

    setLoading(true);

    try {
      let mediaUrls: string[] = [];

      if (mediaFiles.length > 0) {
        const uploadRes = await api.posts.uploadMedia(mediaFiles);
        if (uploadRes.success) {
          mediaUrls = uploadRes.data.mediaUrls;
        } else {
          showToast("Failed to upload media", "error");
          setLoading(false);
          return;
        }
      }

      const postType = mediaUrls.length > 0 
        ? (mediaFiles.some(f => f.type.startsWith('video/')) ? 'VIDEO' : 'IMAGE')
        : 'TEXT';

      const res = await api.posts.create({
        content: postText.trim(),
        postType,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      });

      if (res.success) {
        showToast("Post created successfully!", "success");
        mediaPreviews.forEach(url => URL.revokeObjectURL(url));
        onPostCreated();
        onClose();
      } else {
        showToast(res.message || "Failed to create post", "error");
      }
    } catch (error) {
      showToast("Error creating post", "error");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    backgroundColor: "#182037",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "5px",
    color: "#FFFFFF",
    fontFamily: "var(--font-poppins), sans-serif",
    fontSize: "14px",
    fontWeight: 400,
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    color: "rgba(255,255,255,0.6)",
    fontSize: "14px",
    fontWeight: 400,
    fontFamily: "var(--font-poppins), sans-serif",
    marginBottom: "6px",
    display: "block",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#13192A",
          borderRadius: "8px",
          width: "100%",
          maxWidth: "560px",
          maxHeight: "calc(100vh - 32px)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "var(--font-poppins), sans-serif",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}
        >
          <div className="flex items-center gap-2">
            <Image src="/icons/community.svg" alt="community" width={20} height={20} style={{ filter: "brightness(0) saturate(100%) invert(82%) sepia(30%) saturate(800%) hue-rotate(5deg) brightness(100%)" }} />
            <span style={{ color: "#E8C96A", fontSize: "18px", fontWeight: 500 }}>New Community Post</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#FFFFFF", fontSize: "18px", lineHeight: 1, padding: 0 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Your Post textarea */}
          <div>
            <label style={labelStyle}>Your Post</label>
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="Share something with the owners club..."
              rows={5}
              disabled={loading}
              style={{ ...inputStyle, padding: "10px 16px", resize: "vertical", lineHeight: "1.6" }}
            />
          </div>

          {/* Media Previews */}
          {mediaPreviews.length > 0 && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {mediaPreviews.map((preview, index) => (
                <div key={index} style={{ position: "relative", width: "100px", height: "100px" }}>
                  {mediaFiles[index].type.startsWith('image/') ? (
                    <img src={preview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "5px" }} />
                  ) : (
                    <video src={preview} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "5px" }} />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    disabled={loading}
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(0,0,0,0.7)",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload */}
          <div>
            <label style={labelStyle}>Add Media (Optional)</label>
            <div
              onClick={() => !loading && mediaFiles.length < 5 && fileRef.current?.click()}
              style={{
                ...inputStyle,
                padding: "20px 16px",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: "8px", cursor: loading || mediaFiles.length >= 5 ? "not-allowed" : "pointer",
                opacity: loading || mediaFiles.length >= 5 ? 0.5 : 1,
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span style={{ color: "#FFFFFF", fontSize: "13px" }}>
                {mediaFiles.length >= 5 ? "Maximum 5 files" : "Click to upload images/videos"}
              </span>
            </div>
            <input ref={fileRef} type="file" accept="image/*,video/*" multiple style={{ display: "none" }} onChange={handleFile} disabled={loading} />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !postText.trim()}
            style={{
              width: "100%",
              backgroundColor: "#E8C96A",
              color: "#060D1F",
              border: "none",
              borderRadius: "5px",
              padding: "12px",
              fontSize: "16px",
              fontWeight: 500,
              fontFamily: "var(--font-poppins), sans-serif",
              cursor: loading || !postText.trim() ? "not-allowed" : "pointer",
              opacity: loading || !postText.trim() ? 0.5 : 1,
            }}
          >
            {loading ? "Publishing..." : "Publish to Club"}
          </button>

        </div>
      </div>
    </div>
  );
}
