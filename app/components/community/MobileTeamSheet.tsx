"use client";

import { useEffect } from "react";
import { IoClose } from "react-icons/io5";

interface MobileTeamSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function MobileTeamSheet({ open, onClose, children }: MobileTeamSheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="lg:hidden"
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "flex-end",
        fontFamily: "var(--font-poppins), sans-serif",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          backgroundColor: "#060D1F",
          borderTopLeftRadius: "16px",
          borderTopRightRadius: "16px",
          maxHeight: "85vh",
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            width: "40px", height: "4px", borderRadius: "2px",
            backgroundColor: "rgba(255,255,255,0.25)",
            margin: "2px auto 6px",
          }}
        />
        <div className="flex items-center justify-between">
          <span style={{ color: "#E8C96A", fontSize: "15px", fontWeight: 500 }}>Team &amp; community</span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none", border: "none", color: "#fff",
              cursor: "pointer", padding: "4px",
            }}
          >
            <IoClose size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
