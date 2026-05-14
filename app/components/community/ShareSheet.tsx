"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IoClose, IoLogoWhatsapp, IoLogoFacebook, IoMail, IoCopyOutline, IoChatbubbleOutline } from "react-icons/io5";
import { FiLink, FiRepeat } from "react-icons/fi";
import { RiTwitterXFill } from "react-icons/ri";
import { useToast } from "@/app/context/ToastContext";
import { api } from "@/app/services/api";

interface ShareSheetProps {
  postId: number;
  postContent: string;
  onClose: () => void;
  onShared: () => void;
  onReshared?: () => void;
}

export default function ShareSheet({ postId, postContent, onClose, onShared, onReshared }: ShareSheetProps) {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showReshareInput, setShowReshareInput] = useState(false);
  const [reshareComment, setReshareComment] = useState("");
  const [resharing, setResharing] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/post/${postId}` : "";
  const shareText = postContent.slice(0, 120) + (postContent.length > 120 ? "..." : "");

  const openShare = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
    onShared();
    handleClose();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast("Link copied!", "success");
      onShared();
      handleClose();
    } catch {
      showToast("Could not copy link", "error");
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Pacific Sunday", text: shareText, url: shareUrl });
        onShared();
        handleClose();
      } catch {
        /* user cancelled */
      }
    }
  };

  const handleReshare = async () => {
    setResharing(true);
    try {
      const res = await api.posts.reshare(postId, reshareComment.trim() || undefined);
      if (res.success) {
        showToast("Post reshared to your feed", "success");
        onReshared?.();
        handleClose();
      } else {
        showToast(res.message || "Failed to reshare", "error");
      }
    } catch {
      showToast("Failed to reshare", "error");
    } finally {
      setResharing(false);
    }
  };

  const options = [
    { label: "WhatsApp", icon: <IoLogoWhatsapp size={24} />, color: "#25D366", bgColor: "#060D1F", onClick: () => openShare(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`) },
    { label: "X", icon: <RiTwitterXFill size={24} />, color: "#000000", bgColor: "#FFFFFF", onClick: () => openShare(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`) },
    { label: "Facebook", icon: <IoLogoFacebook size={24} />, color: "#1877F2", bgColor: "#060D1F", onClick: () => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`) },
    { label: "Email", icon: <IoMail size={24} />, color: "#E8C96A", bgColor: "#060D1F", onClick: () => openShare(`mailto:?subject=Check this out&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`) },
    { label: "Message", icon: <IoChatbubbleOutline size={24} />, color: "#E8C96A", bgColor: "#060D1F", onClick: () => openShare(`sms:?body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`) },
    { label: "Copy link", icon: <IoCopyOutline size={24} />, color: "#E8C96A", bgColor: "#060D1F", onClick: copyLink },
  ];

  if (!mounted) return null;

  return createPortal(
    <div
      onClick={handleClose}
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        backgroundColor: mounted && !closing ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-poppins), sans-serif",
        transition: "background-color 0.3s ease",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "#13192A",
          borderRadius: "18px",
          padding: "20px",
          transform: mounted && !closing ? "scale(1) translateY(0)" : "scale(0.7) translateY(20px)",
          opacity: mounted && !closing ? 1 : 0,
          transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: "14px" }}>
          <span style={{ color: "#E8C96A", fontSize: "16px", fontWeight: 500 }}>Share this post</span>
          <button
            onClick={handleClose}
            style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: 0 }}
            aria-label="Close"
          >
            <IoClose size={22} />
          </button>
        </div>

        {/* Reshare to Feed */}
        {!showReshareInput ? (
          <button
            onClick={() => setShowReshareInput(true)}
            style={{
              width: "100%",
              backgroundColor: "rgba(232,201,106,0.1)",
              border: "1px solid rgba(232,201,106,0.3)",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              cursor: "pointer",
              color: "#E8C96A",
              fontSize: "14px",
              fontWeight: 500,
              fontFamily: "inherit",
            }}
          >
            <FiRepeat size={18} />
            <span>Reshare to your feed</span>
          </button>
        ) : (
          <div style={{ marginBottom: "16px" }}>
            <textarea
              value={reshareComment}
              onChange={(e) => setReshareComment(e.target.value)}
              placeholder="Add a comment (optional)..."
              rows={3}
              style={{
                width: "100%",
                backgroundColor: "#060D1F",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                padding: "10px",
                color: "#FFFFFF",
                fontSize: "13px",
                fontFamily: "inherit",
                outline: "none",
                resize: "vertical",
                marginBottom: "8px",
              }}
              maxLength={500}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleReshare}
                disabled={resharing}
                style={{
                  flex: 1,
                  backgroundColor: "#E8C96A",
                  color: "#060D1F",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: resharing ? "not-allowed" : "pointer",
                  opacity: resharing ? 0.5 : 1,
                  fontFamily: "inherit",
                }}
              >
                {resharing ? "Resharing..." : "Reshare"}
              </button>
              <button
                onClick={() => { setShowReshareInput(false); setReshareComment(""); }}
                style={{
                  flex: 1,
                  backgroundColor: "transparent",
                  color: "#888",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "6px",
                  padding: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Share options grid */}
        <div className="grid grid-cols-4 gap-3">
          {options.map(opt => (
            <button
              key={opt.label}
              onClick={opt.onClick}
              className="flex flex-col items-center gap-2"
              style={{
                background: "none", border: "none",
                padding: "8px 4px", cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <div
                style={{
                  width: "52px", height: "52px",
                  borderRadius: "50%",
                  backgroundColor: opt.bgColor || "#060D1F",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: opt.color,
                }}
              >
                {opt.icon}
              </div>
              <span style={{ color: "#FFFFFF", fontSize: "11px", textAlign: "center" }}>{opt.label}</span>
            </button>
          ))}
        </div>

        {typeof window !== "undefined" && "share" in navigator && (
          <button
            onClick={nativeShare}
            style={{
              width: "100%", marginTop: "16px",
              backgroundColor: "#E8C96A", color: "#060D1F",
              border: "none", borderRadius: "8px",
              padding: "12px", fontSize: "14px",
              fontWeight: 500, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            More share options
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
