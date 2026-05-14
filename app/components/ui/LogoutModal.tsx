"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiLogOut } from "react-icons/fi";

interface LogoutModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LogoutModal({ onConfirm, onCancel }: LogoutModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onCancel]);

  if (!mounted) return null;

  return createPortal(
    <div
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        backgroundColor: "rgba(0,0,0,0.65)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "360px",
          backgroundColor: "#13192A",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding: "28px 24px",
          fontFamily: "var(--font-poppins), sans-serif",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Icon */}
        <div style={{
          width: "52px", height: "52px", borderRadius: "50%",
          backgroundColor: "rgba(239,68,68,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
        }}>
          <FiLogOut size={24} color="#EF4444" />
        </div>

        {/* Title */}
        <h2 style={{
          color: "#FFFFFF", fontSize: "18px",
          fontWeight: 600, textAlign: "center", margin: "0 0 8px",
        }}>
          Sign Out
        </h2>

        {/* Message */}
        <p style={{
          color: "#94A3B8", fontSize: "14px",
          textAlign: "center", margin: "0 0 24px", lineHeight: 1.6,
        }}>
          Are you sure you want to sign out of your account?
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "11px",
              backgroundColor: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "8px", color: "#94A3B8",
              fontSize: "14px", fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit",
              transition: "border-color 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "#94A3B8"; }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: "11px",
              backgroundColor: "#EF4444",
              border: "1px solid #EF4444",
              borderRadius: "8px", color: "#fff",
              fontSize: "14px", fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
