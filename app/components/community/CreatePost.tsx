"use client";

import { useState, useRef } from "react";
import { api } from "@/app/services/api";
import { useToast } from "@/app/context/ToastContext";

interface CreatePostProps {
  onPostCreated: () => void;
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const { showToast } = useToast();
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        ? (mediaFiles.some(f => f.type.startsWith('video/')) ? 'VIDEO' : 'IMAGE')
        : 'TEXT';

      const res = await api.posts.create({
        content: content.trim(),
        postType,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      });

      if (res.success) {
        showToast("Post created successfully!", "success");
        setContent("");
        setMediaFiles([]);
        mediaPreviews.forEach(url => URL.revokeObjectURL(url));
        setMediaPreviews([]);
        onPostCreated();
      } else {
        showToast(res.message || "Failed to create post", "error");
      }
    } catch (error) {
      showToast("Error creating post", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#13192A", borderRadius: "5px", padding: "16px", marginBottom: "16px", fontFamily: "var(--font-poppins), sans-serif" }}>
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          disabled={loading}
          style={{
            width: "100%",
            minHeight: "100px",
            backgroundColor: "#060D1F",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "5px",
            color: "#FFFFFF",
            fontSize: "14px",
            padding: "12px",
            resize: "vertical",
            fontFamily: "inherit",
            marginBottom: "12px",
          }}
        />

        {mediaPreviews.length > 0 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
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

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || mediaFiles.length >= 5}
              style={{
                backgroundColor: "transparent",
                border: "1px solid #E8C96A",
                borderRadius: "5px",
                color: "#E8C96A",
                padding: "8px 16px",
                fontSize: "14px",
                cursor: loading || mediaFiles.length >= 5 ? "not-allowed" : "pointer",
                opacity: loading || mediaFiles.length >= 5 ? 0.5 : 1,
              }}
            >
              📷 Add Media
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !content.trim()}
            style={{
              backgroundColor: "#E8C96A",
              color: "#060D1F",
              border: "none",
              borderRadius: "5px",
              padding: "8px 24px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: loading || !content.trim() ? "not-allowed" : "pointer",
              opacity: loading || !content.trim() ? 0.5 : 1,
            }}
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
