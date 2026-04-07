"use client";

import { useState } from "react";
import Image from "next/image";
import type { Announcement } from "@/app/types";

interface AnnouncementBannerProps {
  announcement: Announcement;
}

export default function AnnouncementBanner({ announcement }: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-stretch"
      style={{
        backgroundColor: "#262F46", borderRadius: "5px", margin: "16px 0",
        padding: "16px", gap: "16px", width: "100%",
        fontFamily: "var(--font-poppins), sans-serif", position: "relative",
      }}
    >
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{
          position: "absolute", top: "-8px", right: "-8px", background: "#262F46",
          border: "none", borderRadius: "50%", width: "35px", height: "35px",
          cursor: "pointer", color: "#E8C96A", display: "flex", alignItems: "center",
          justifyContent: "center", padding: "3px", flexShrink: 0,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)", zIndex: 10,
        }}
      >
        <div style={{
          width: "100%", height: "100%", borderRadius: "50%",
          border: "2px solid #E8C96A", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
      </button>

      <div className="flex items-start gap-3 sm:w-3/4" style={{ paddingRight: "20px" }}>
        <Image src="/icons/announsment.svg" alt="Announcement" width={28} height={28} style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: "clamp(15px, 1.8vw, 18px)", color: "#E8C96A", fontWeight: 600, marginBottom: "6px" }}>
            {announcement.title}
          </div>
          <div style={{ fontSize: "clamp(13px, 1.5vw, 16px)", color: "#FFFFFF", fontWeight: 400 }}>
            {announcement.description}
          </div>
        </div>
      </div>

      <div className="flex items-center sm:justify-end sm:w-1/4" style={{ paddingLeft: "40px", paddingRight: "40px" }}>
        <a href={announcement.ctaHref} style={{ color: "#E8C96A", fontWeight: 600, textDecoration: "underline", fontSize: "clamp(13px, 1.5vw, 16px)" }}>
          {announcement.ctaText}
        </a>
      </div>
    </div>
  );
}
