"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface NewPostModalProps {
  onClose: () => void;
}

export default function NewPostModal({ onClose }: NewPostModalProps) {
  const [postType, setPostType] = useState("General Discussion");
  const [postText, setPostText] = useState("");
  const [location, setLocation] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    setPreview(URL.createObjectURL(f));
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

          {/* Post Type */}
          <div>
            <label style={labelStyle}>Post Type</label>
            <div style={{ position: "relative" }}>
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                style={{ ...inputStyle, padding: "10px 16px", appearance: "none", cursor: "pointer" }}
              >
                <option>General Discussion</option>
                <option>Team Update</option>
                <option>Achievement</option>
                <option>Question</option>
              </select>
              <div style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#FFFFFF" }}>▾</div>
            </div>
          </div>

          {/* Your Post textarea */}
          <div>
            <label style={labelStyle}>Your Post</label>
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="Sharing something with the owners club"
              rows={3}
              style={{ ...inputStyle, padding: "10px 16px", resize: "none", lineHeight: "1.6" }}
            />
          </div>

          {/* Upload */}
          <div>
            <label style={labelStyle}>Your Post</label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                ...inputStyle,
                padding: "20px 16px",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: "8px", cursor: "pointer", overflow: "hidden",
              }}
            >
              {preview ? (
                <>
                  <img src={preview} alt="preview" style={{ maxWidth: "100%", maxHeight: "120px", borderRadius: "4px", objectFit: "contain" }} />
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>{fileName}</span>
                </>
              ) : (
                <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span style={{ color: "#FFFFFF", fontSize: "13px" }}>Click or drag to upload</span>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleFile} />
          </div>

          {/* Tag Location */}
          <div>
            <label style={labelStyle}>Tag Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="eg. Pebble Beach, north side"
              style={{ ...inputStyle, padding: "10px 16px" }}
            />
          </div>

          {/* Submit */}
          <button
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
              cursor: "pointer",
            }}
          >
            Publish to Club
          </button>

        </div>
      </div>
    </div>
  );
}
