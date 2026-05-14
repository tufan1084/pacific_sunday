"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/app/services/api";
import { resolveMediaUrl } from "@/app/lib/constants";
import EditableInput, { type EditableInputHandle } from "../ui/EditableInput";
import { useToast } from "@/app/context/ToastContext";
import { IoImageOutline, IoClose, IoChevronDown, IoEarthOutline, IoLockClosedOutline, IoPeopleOutline, IoPricetagOutline } from "react-icons/io5";
import type { Team } from "@/app/types/community";
import type { TagOption } from "@/app/lib/community-data";

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

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  activeTeam: Team | null;
  userTeams: Team[];
  tagOptions?: TagOption[];
  onTeamChange: (filterName: string) => void;
}

export default function CreatePostModal({ isOpen, onClose, onPostCreated, activeTeam, userTeams, tagOptions = [], onTeamChange }: CreatePostModalProps) {
  const { showToast } = useToast();
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [teamOpen, setTeamOpen] = useState(false);
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [showMediaSheet, setShowMediaSheet] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<EditableInputHandle>(null);
  const teamDropdownRef = useRef<HTMLDivElement>(null);

  const currentUser = typeof window !== "undefined" ? localStorage.getItem("ps_username") || "" : "";
  const [myPhoto, setMyPhoto] = useState<string | null>(null);
  const [myName, setMyName] = useState<string>(currentUser);
  
  const displayName = myName || currentUser;
  const initials = displayName ? displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

  useEffect(() => {
    let cancelled = false;
    api.profile.getGolfPassport().then((res: any) => {
      if (!cancelled && res?.success) {
        setMyPhoto(res?.data?.golfPassport?.photoUrl || null);
        const name = res?.data?.golfPassport?.name || res?.data?.username || "";
        setMyName(name);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (teamDropdownRef.current && !teamDropdownRef.current.contains(e.target as Node)) {
        setTeamOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addFiles = (files: File[]) => {
    if (files.length + mediaFiles.length > 5) {
      showToast("Maximum 5 media files allowed", "error");
      return;
    }
    setMediaFiles([...mediaFiles, ...files]);
    setMediaPreviews([...mediaPreviews, ...files.map(f => URL.createObjectURL(f))]);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
    e.target.value = "";
  };

  const removeMedia = (index: number) => {
    URL.revokeObjectURL(mediaPreviews[index]);
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    setMediaPreviews(mediaPreviews.filter((_, i) => i !== index));
  };

  const reset = () => {
    mediaPreviews.forEach(url => URL.revokeObjectURL(url));
    setContent("");
    setMediaFiles([]);
    setMediaPreviews([]);
    setSelectedTagSlugs([]);
    setBlockedMessage(null);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith("image/"));
    if (imageItems.length === 0) return;
    const files = imageItems
      .map(item => item.getAsFile())
      .filter(Boolean)
      .map(f => normalizeImageFile(f as File));
    if (files.length > 0) { e.preventDefault(); addFiles(files); }
  };

  const toggleTag = (slug: string) => {
    setSelectedTagSlugs(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) {
      showToast("Please add text or media", "error");
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
        ? (mediaFiles.some(f => f.type.startsWith("video/")) ? "VIDEO" : "IMAGE")
        : "TEXT";

      const res = await api.posts.create({
        content: content.trim() || "",
        postType,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        teamId: activeTeam?.id,
        tags: selectedTagSlugs.length > 0 ? selectedTagSlugs : undefined,
      });
      if (res.success) {
        showToast("Post created!", "success");
        reset();
        onPostCreated();
        onClose();
      } else if ((res as any).code === "POSTING_BLOCKED" || /not allowed to post|blocked/i.test(res.message || "")) {
        setBlockedMessage(res.message || "Your community posting access has been suspended.");
      } else {
        showToast(res.message || "Failed to create post", "error");
      }
    } catch {
      showToast("Error creating post", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.8)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
      }}
      className="lg:p-5"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="lg:rounded-xl lg:max-w-[680px] lg:max-h-[90vh]"
        style={{
          backgroundColor: "#13192A",
          width: "100%",
          height: "100%",
          fontFamily: "var(--font-poppins), sans-serif",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header - Fixed */}
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <h2 style={{ color: "#E8C96A", fontSize: "20px", fontWeight: 600, margin: 0 }}>
            Create post
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: "4px" }}
            aria-label="Close"
          >
            <IoClose size={26} />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", minHeight: 0 }}>
          {/* User info */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: "44px", height: "44px", borderRadius: "8px",
                  backgroundColor: "#060D1F", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "14px", fontWeight: 700,
                  color: "#E8C96A", flexShrink: 0, overflow: "hidden",
                }}
              >
                {myPhoto ? (
                  <img src={resolveMediaUrl(myPhoto)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  initials
                )}
              </div>
              <div>
                <div style={{ color: "#E8C96A", fontSize: "15px", fontWeight: 600 }}>
                  {displayName}
                </div>
                <div ref={teamDropdownRef} style={{ position: "relative", marginTop: "4px" }}>
                  <button
                    onClick={() => setTeamOpen(v => !v)}
                    className="flex items-center gap-1"
                    style={{
                      background: "none", border: "none", padding: 0,
                      color: "#888", fontSize: "12px", cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                    disabled={loading}
                  >
                    {activeTeam ? (
                      <>
                        {activeTeam.imageUrl ? (
                          <img
                            src={resolveMediaUrl(activeTeam.imageUrl)}
                            alt=""
                            style={{ width: "14px", height: "14px", borderRadius: "3px", objectFit: "cover", flexShrink: 0 }}
                          />
                        ) : activeTeam.privacy === "public" ? (
                          <IoEarthOutline size={11} />
                        ) : (
                          <IoLockClosedOutline size={11} />
                        )}
                        <span>Posting to · {activeTeam.name}</span>
                      </>
                    ) : (
                      <>
                        <IoPeopleOutline size={12} />
                        <span>Posting to · Owners Community</span>
                      </>
                    )}
                    <IoChevronDown size={10} />
                  </button>
                  {teamOpen && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 20,
                      backgroundColor: "#060D1F", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "6px", padding: "4px", minWidth: "200px",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
                    }}>
                      <button
                        onClick={() => { onTeamChange("All Owners"); setTeamOpen(false); }}
                        className="flex items-center gap-2"
                        style={{
                          width: "100%", textAlign: "left", padding: "8px 10px",
                          borderRadius: "4px", border: "none",
                          backgroundColor: !activeTeam ? "rgba(232,201,106,0.15)" : "transparent",
                          color: "#FFFFFF", fontSize: "12px", cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        <IoPeopleOutline size={12} />
                        <span>Owners Community</span>
                      </button>
                      {userTeams.length === 0 ? (
                        <div style={{ color: "#888", fontSize: "11px", padding: "8px 10px" }}>
                          Join or create a team to post to it.
                        </div>
                      ) : userTeams.map(t => (
                        <button
                          key={t.id}
                          onClick={() => { onTeamChange(t.name); setTeamOpen(false); }}
                          className="flex items-center gap-2"
                          style={{
                            width: "100%", textAlign: "left", padding: "8px 10px",
                            borderRadius: "4px", border: "none",
                            backgroundColor: activeTeam?.id === t.id ? "rgba(232,201,106,0.15)" : "transparent",
                            color: "#FFFFFF", fontSize: "12px", cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          {t.imageUrl ? (
                            <img
                              src={resolveMediaUrl(t.imageUrl)}
                              alt=""
                              style={{ width: "18px", height: "18px", borderRadius: "4px", objectFit: "cover", flexShrink: 0 }}
                            />
                          ) : t.privacy === "public" ? (
                            <IoEarthOutline size={11} />
                          ) : (
                            <IoLockClosedOutline size={11} />
                          )}
                          <span>{t.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {blockedMessage && (
            <div
              role="alert"
              className="flex items-start"
              style={{
                gap: "10px",
                padding: "12px 14px",
                margin: "0 0 12px",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.30)",
                borderRadius: "8px",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FCA5A5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#FCA5A5", fontSize: "12.5px", fontWeight: 600, marginBottom: "2px" }}>
                  Posting suspended
                </div>
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "12.5px", lineHeight: 1.55 }}>
                  {blockedMessage}
                </div>
              </div>
              <button
                onClick={() => setBlockedMessage(null)}
                aria-label="Dismiss"
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: "2px", flexShrink: 0 }}
              >
                <IoClose size={16} />
              </button>
            </div>
          )}

          <EditableInput
            ref={textareaRef}
            value={content}
            onChange={(v) => setContent(v.slice(0, 500))}
            onImagePaste={(file) => addFiles([normalizeImageFile(file)])}
            placeholder={blockedMessage ? "You can't post right now." : "Share your thoughts, picks, or bag flex..."}
            disabled={loading || !!blockedMessage}
            multiline
            maxLength={500}
            ariaLabel="Post content"
            className="text-base lg:text-[15px]"
            style={{
              width: "100%",
              backgroundColor: "transparent",
              color: "#FFFFFF",
              lineHeight: "1.6",
              padding: "4px 0",
              fontFamily: "inherit",
              minHeight: "120px",
            }}
          />
          <div style={{ textAlign: "right", fontSize: "12px", color: content.length >= 450 ? (content.length >= 500 ? "#EF4444" : "#E8C96A") : "#555", marginTop: "4px" }}>
            {content.length}/500
          </div>

          {mediaPreviews.length > 0 && (
            <div
              className="mt-4 mb-4"
              style={{
                display: "grid",
                gridTemplateColumns: 
                  mediaPreviews.length === 1 ? "1fr" :
                  mediaPreviews.length === 2 ? "repeat(2, 1fr)" :
                  mediaPreviews.length === 3 ? "repeat(3, 1fr)" :
                  mediaPreviews.length === 4 ? "repeat(2, 1fr)" :
                  "repeat(3, 1fr)",
                gridTemplateRows:
                  mediaPreviews.length === 1 ? "auto" :
                  mediaPreviews.length === 2 ? "1fr" :
                  mediaPreviews.length === 3 ? "1fr" :
                  mediaPreviews.length === 4 ? "repeat(2, 1fr)" :
                  "repeat(2, 1fr)",
                gap: "2px",
                maxHeight: mediaPreviews.length === 1 ? "450px" : "350px",
                borderRadius: "4px",
                overflow: "hidden",
                backgroundColor: "#000",
              }}
            >
              {mediaPreviews.map((preview, i) => {
                // Layout logic for different image counts
                const gridStyle: React.CSSProperties = {};
                
                if (mediaPreviews.length === 3) {
                  // First image spans full height on left, 2 images stacked on right
                  if (i === 0) {
                    gridStyle.gridColumn = "1 / 3";
                    gridStyle.gridRow = "1 / 2";
                  }
                } else if (mediaPreviews.length === 5) {
                  // First 2 images span top row, 3 smaller on bottom
                  if (i === 0) {
                    gridStyle.gridColumn = "1 / 3";
                  } else if (i === 1) {
                    gridStyle.gridColumn = "3 / 4";
                  }
                }
                
                return (
                <div 
                  key={i} 
                  style={{ 
                    position: "relative", 
                    overflow: "hidden", 
                    backgroundColor: "#000",
                    minHeight: mediaPreviews.length === 1 ? "300px" : "100px",
                    height: "100%",
                    ...gridStyle,
                  }}>
                  {mediaFiles[i].type.startsWith("image/") ? (
                    <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <video src={preview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                  <button
                    onClick={() => removeMedia(i)}
                    disabled={loading}
                    style={{
                      position: "absolute", top: "8px", right: "8px",
                      width: "30px", height: "30px", borderRadius: "50%",
                      backgroundColor: "rgba(0,0,0,0.8)", color: "#fff",
                      border: "1px solid rgba(255,255,255,0.2)",
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s ease",
                      zIndex: 10,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.95)";
                      e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.8)";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                    aria-label="Remove media"
                  >
                    <IoClose size={16} />
                  </button>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.08)", flexShrink: 0, backgroundColor: "#13192A", marginTop: "auto" }}>
          {tagOptions.length > 0 && (
            <div
              className="flex flex-wrap items-center gap-2"
              style={{ marginBottom: "12px" }}
            >
              <span
                className="flex items-center gap-1"
                style={{ color: "#888", fontSize: "12px" }}
              >
                <IoPricetagOutline size={13} />
                Category
              </span>
              {tagOptions.map((tag) => {
                const active = selectedTagSlugs.includes(tag.slug);
                return (
                  <button
                    key={tag.slug}
                    type="button"
                    onClick={() => toggleTag(tag.slug)}
                    disabled={loading}
                    style={{
                      border: active ? "1px solid #E8C96A" : "1px solid rgba(255,255,255,0.1)",
                      backgroundColor: active ? "rgba(232,201,106,0.15)" : "transparent",
                      color: active ? "#E8C96A" : "#888",
                      fontSize: "12px",
                      padding: "6px 12px",
                      borderRadius: "999px",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => !loading && !active && (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")}
                    onMouseLeave={(e) => !loading && !active && (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          )}
          
          <div
            style={{
              padding: "10px 14px",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <span style={{ color: "#FFFFFF", fontSize: "13px", fontWeight: 500 }}>
              Add to your post
            </span>
            <div className="flex items-center gap-2">
              {/* Gallery input */}
              <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={handleFile} style={{ display: "none" }} />
              {/* Camera input — no `multiple` (Android ignores `capture` when multiple
                  is set), no `display:none` (some Android intents fail to deliver the
                  captured file to a fully-hidden input). */}
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ position: "absolute", width: "1px", height: "1px", opacity: 0, pointerEvents: "none", overflow: "hidden", clip: "rect(0,0,0,0)" }} />
              <button
                onClick={() => setShowMediaSheet(true)}
                disabled={loading || mediaFiles.length >= 5}
                style={{
                  background: "none", border: "none",
                  color: "#E8C96A", padding: "6px",
                  borderRadius: "6px", cursor: loading || mediaFiles.length >= 5 ? "not-allowed" : "pointer",
                  opacity: loading || mediaFiles.length >= 5 ? 0.5 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => !loading && mediaFiles.length < 5 && (e.currentTarget.style.backgroundColor = "rgba(232,201,106,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                aria-label="Add photo"
              >
                <IoImageOutline size={20} />
              </button>
            </div>

            {/* Media source sheet */}
            {showMediaSheet && (
              <div
                onClick={() => setShowMediaSheet(false)}
                style={{ position: "fixed", inset: 0, zIndex: 10000, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: "100%", maxWidth: "420px", backgroundColor: "#13192A", borderRadius: "14px", padding: "8px", fontFamily: "var(--font-poppins), sans-serif" }}
                >
                  <button
                    onClick={() => { cameraRef.current?.click(); setShowMediaSheet(false); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", background: "none", border: "none", borderRadius: "10px", color: "#fff", fontSize: "15px", cursor: "pointer", fontFamily: "inherit" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    Take Photo
                  </button>
                  <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.07)", margin: "0 16px" }} />
                  <button
                    onClick={() => { fileRef.current?.click(); setShowMediaSheet(false); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", background: "none", border: "none", borderRadius: "10px", color: "#fff", fontSize: "15px", cursor: "pointer", fontFamily: "inherit" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    Choose from Device
                  </button>
                  <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.07)", margin: "0 16px" }} />
                  <button
                    onClick={() => setShowMediaSheet(false)}
                    style={{ width: "100%", padding: "14px 16px", background: "none", border: "none", borderRadius: "10px", color: "#94A3B8", fontSize: "15px", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || (!content.trim() && mediaFiles.length === 0) || !!blockedMessage}
            className="text-base lg:text-[15px]"
            style={{
              width: "100%",
              backgroundColor: "#E8C96A", color: "#060D1F",
              border: "none", borderRadius: "10px",
              padding: "14px 22px",
              fontWeight: 600,
              cursor: loading || (!content.trim() && mediaFiles.length === 0) || blockedMessage ? "not-allowed" : "pointer",
              opacity: loading || (!content.trim() && mediaFiles.length === 0) || blockedMessage ? 0.5 : 1,
              fontFamily: "inherit",
              transition: "opacity 0.2s ease",
            }}
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
