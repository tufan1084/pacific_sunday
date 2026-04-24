"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/app/services/api";
import { resolveMediaUrl } from "@/app/lib/constants";
import { useToast } from "@/app/context/ToastContext";
import { IoImageOutline, IoVideocamOutline, IoClose, IoChevronDown, IoEarthOutline, IoLockClosedOutline, IoPeopleOutline, IoPricetagOutline } from "react-icons/io5";
import type { Team } from "@/app/types/community";
import type { TagOption } from "@/app/lib/community-data";

interface CreatePostInlineProps {
  onPostCreated: () => void;
  activeTeam: Team | null;
  userTeams: Team[];
  tagOptions?: TagOption[];
  onTeamChange: (filterName: string) => void;
}

export default function CreatePostInline({ onPostCreated, activeTeam, userTeams, tagOptions = [], onTeamChange }: CreatePostInlineProps) {
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [teamOpen, setTeamOpen] = useState(false);
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const teamDropdownRef = useRef<HTMLDivElement>(null);

  const currentUser = typeof window !== "undefined" ? localStorage.getItem("ps_username") || "You" : "You";
  const initials = currentUser.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "YO";
  const [myPhoto, setMyPhoto] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.profile.getGolfPassport().then((res: any) => {
      if (!cancelled && res?.success) {
        setMyPhoto(res?.data?.golfPassport?.photoUrl || null);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (expanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [expanded]);

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
    setExpanded(false);
  };

  const toggleTag = (slug: string) => {
    setSelectedTagSlugs(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
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
        ? (mediaFiles.some(f => f.type.startsWith("video/")) ? "VIDEO" : "IMAGE")
        : "TEXT";

      const res = await api.posts.create({
        content: content.trim(),
        postType,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        teamId: activeTeam?.id,
        tags: selectedTagSlugs.length > 0 ? selectedTagSlugs : undefined,
      });
      if (res.success) {
        showToast("Post created!", "success");
        reset();
        onPostCreated();
      } else {
        showToast(res.message || "Failed to create post", "error");
      }
    } catch {
      showToast("Error creating post", "error");
    } finally {
      setLoading(false);
    }
  };

  // Collapsed view — Facebook-style "What's on your mind?" bar
  if (!expanded) {
    return (
      <div
        style={{
          backgroundColor: "#13192A",
          borderRadius: "8px",
          padding: "12px 14px",
          marginBottom: "10px",
          fontFamily: "var(--font-poppins), sans-serif",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              width: "38px", height: "38px", borderRadius: "5px",
              backgroundColor: "#060D1F", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "12px", fontWeight: 700,
              color: "#E8C96A", flexShrink: 0, overflow: "hidden",
            }}
          >
            {myPhoto ? (
              <img src={resolveMediaUrl(myPhoto)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              initials
            )}
          </div>
          <button
            onClick={() => setExpanded(true)}
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
            {activeTeam ? `Share something with ${activeTeam.name}...` : "What's on your mind?"}
          </button>
          <button
            onClick={() => { setExpanded(true); setTimeout(() => fileRef.current?.click(), 100); }}
            className="hidden sm:flex items-center justify-center"
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

  return (
    <div
      style={{
        backgroundColor: "#13192A",
        borderRadius: "8px",
        padding: "14px",
        marginBottom: "16px",
        fontFamily: "var(--font-poppins), sans-serif",
        border: "1px solid rgba(232,201,106,0.25)",
      }}
    >
      {/* Header — avatar + posting context + close */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            style={{
              width: "38px", height: "38px", borderRadius: "5px",
              backgroundColor: "#060D1F", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "12px", fontWeight: 700,
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
            <div style={{ color: "#E8C96A", fontSize: "14px", fontWeight: 500 }}>
              {currentUser}
            </div>
            <div ref={teamDropdownRef} style={{ position: "relative", marginTop: "2px" }}>
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
        <button
          onClick={reset}
          disabled={loading}
          style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: "4px" }}
          aria-label="Close composer"
        >
          <IoClose size={22} />
        </button>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your thoughts, picks, or bag flex..."
        disabled={loading}
        rows={4}
        style={{
          width: "100%",
          backgroundColor: "transparent",
          border: "none",
          color: "#FFFFFF",
          fontSize: "15px",
          lineHeight: "1.5",
          padding: "4px 0",
          resize: "none",
          outline: "none",
          fontFamily: "inherit",
        }}
      />

      {/* Media previews */}
      {mediaPreviews.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: mediaPreviews.length === 1 ? "1fr" : "repeat(auto-fit, minmax(110px, 1fr))",
            gap: "6px",
            marginTop: "8px",
            marginBottom: "8px",
          }}
        >
          {mediaPreviews.map((preview, i) => (
            <div key={i} style={{ position: "relative", aspectRatio: mediaPreviews.length === 1 ? "16/9" : "1", borderRadius: "6px", overflow: "hidden", backgroundColor: "#060D1F" }}>
              {mediaFiles[i].type.startsWith("image/") ? (
                <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <video src={preview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
              <button
                onClick={() => removeMedia(i)}
                disabled={loading}
                style={{
                  position: "absolute", top: "6px", right: "6px",
                  width: "22px", height: "22px", borderRadius: "50%",
                  backgroundColor: "rgba(0,0,0,0.7)", color: "#fff",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
                aria-label="Remove media"
              >
                <IoClose size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Category picker — optional. Auto-tagging still runs on the server
          from the post content; these are manual overrides / additions. */}
      {tagOptions.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-2"
          style={{ marginTop: "10px" }}
        >
          <span
            className="flex items-center gap-1"
            style={{ color: "#888", fontSize: "11px" }}
          >
            <IoPricetagOutline size={12} />
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
                  fontSize: "11px",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Toolbar */}
      <div
        className="flex items-center justify-between flex-wrap gap-2"
        style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-1">
          <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={handleFile} style={{ display: "none" }} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={loading || mediaFiles.length >= 5}
            className="flex items-center gap-1"
            style={{
              background: "none", border: "none",
              color: "#E8C96A", padding: "6px 10px",
              borderRadius: "5px", cursor: loading || mediaFiles.length >= 5 ? "not-allowed" : "pointer",
              opacity: loading || mediaFiles.length >= 5 ? 0.5 : 1,
              fontSize: "13px", fontFamily: "inherit",
            }}
          >
            <IoImageOutline size={18} />
            <span className="hidden sm:inline">Photo</span>
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={loading || mediaFiles.length >= 5}
            className="flex items-center gap-1"
            style={{
              background: "none", border: "none",
              color: "#E8C96A", padding: "6px 10px",
              borderRadius: "5px", cursor: loading || mediaFiles.length >= 5 ? "not-allowed" : "pointer",
              opacity: loading || mediaFiles.length >= 5 ? 0.5 : 1,
              fontSize: "13px", fontFamily: "inherit",
            }}
          >
            <IoVideocamOutline size={18} />
            <span className="hidden sm:inline">Video</span>
          </button>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || !content.trim()}
          style={{
            backgroundColor: "#E8C96A", color: "#060D1F",
            border: "none", borderRadius: "5px",
            padding: "8px 22px", fontSize: "14px",
            fontWeight: 500, cursor: loading || !content.trim() ? "not-allowed" : "pointer",
            opacity: loading || !content.trim() ? 0.5 : 1,
            fontFamily: "inherit",
          }}
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}
