"use client";

import { useEffect, useState } from "react";
import { IoClose, IoLogoWhatsapp, IoLogoFacebook, IoMail, IoCopyOutline, IoChatbubbleOutline } from "react-icons/io5";
import { FiLink } from "react-icons/fi";
import { RiTwitterXFill } from "react-icons/ri";
import { useToast } from "@/app/context/ToastContext";

interface ShareSheetProps {
  postId: number;
  postContent: string;
  onClose: () => void;
  onShared: () => void;
}

export default function ShareSheet({ postId, postContent, onClose, onShared }: ShareSheetProps) {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

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

  const options = [
    { label: "WhatsApp", icon: <IoLogoWhatsapp size={24} />, color: "#25D366", bgColor: "#060D1F", onClick: () => openShare(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`) },
    { label: "X", icon: <RiTwitterXFill size={24} />, color: "#000000", bgColor: "#FFFFFF", onClick: () => openShare(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`) },
    { label: "Facebook", icon: <IoLogoFacebook size={24} />, color: "#1877F2", bgColor: "#060D1F", onClick: () => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`) },
    { label: "Email", icon: <IoMail size={24} />, color: "#E8C96A", bgColor: "#060D1F", onClick: () => openShare(`mailto:?subject=Check this out&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`) },
    { label: "Message", icon: <IoChatbubbleOutline size={24} />, color: "#E8C96A", bgColor: "#060D1F", onClick: () => openShare(`sms:?body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`) },
    { label: "Copy link", icon: <IoCopyOutline size={24} />, color: "#E8C96A", bgColor: "#060D1F", onClick: copyLink },
  ];

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed", inset: 0, zIndex: 999,
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

        {/* Link preview */}
        <div
          className="flex items-center gap-2"
          style={{
            backgroundColor: "#060D1F",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "999px",
            padding: "8px 14px",
            marginBottom: "16px",
          }}
        >
          <FiLink size={14} color="#888" />
          <span
            style={{
              color: "#888", fontSize: "12px",
              flex: 1, overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
          >
            {shareUrl}
          </span>
          <button
            onClick={copyLink}
            style={{
              background: "none", border: "none",
              color: "#E8C96A", fontSize: "12px",
              fontWeight: 500, cursor: "pointer", padding: 0,
            }}
          >
            Copy
          </button>
        </div>

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
    </div>
  );
}
