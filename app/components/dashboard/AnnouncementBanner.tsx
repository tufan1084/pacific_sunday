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
        backgroundColor: "#262F46",
        borderRadius: "5px",
        margin: "16px 0",
        padding: "16px 12px 12px 12px",
        gap: "16px",
        width: "100%",
        fontFamily: "var(--font-poppins), sans-serif",
        position: "relative",
      }}
    >
      {/* Dismiss — top right corner */}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          background: "#262F46",
          border: "2px solid #E8C96A",
          borderRadius: "50%",
          width: "28px",
          height: "28px",
          cursor: "pointer",
          color: "#E8C96A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          flexShrink: 0,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Icon + Text */}
      <div className="flex items-start gap-3 sm:w-3/4">
        <Image src="/icons/announsment.svg" alt="Announcement" width={28} height={28} style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: "clamp(14px, 1.4vw, 18px)", color: "#E8C96A", fontWeight: 600, marginBottom: "6px" }}>
            {announcement.title}
          </div>
          <div style={{ fontSize: "clamp(12px, 1.2vw, 16px)", color: "#FFFFFF", fontWeight: 400, paddingRight: "32px" }}>
            {announcement.description}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex items-center sm:justify-end sm:w-1/4" style={{ paddingRight: "40px" }}>
        <a
          href={announcement.ctaHref}
          style={{ color: "#E8C96A", fontWeight: 600, textDecoration: "underline", fontSize: "clamp(12px, 1.2vw, 16px)" }}
        >
          {announcement.ctaText}
        </a>
      </div>
    </div>
  );
}
