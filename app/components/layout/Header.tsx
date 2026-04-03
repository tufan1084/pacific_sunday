"use client";

import Image from "next/image";
import { NotificationIcon, EditIcon, UserCircleIcon, MenuIcon } from "@/app/components/ui/Icons";

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 border-b border-ps-border w-full"
      style={{ backgroundColor: "#01050D", fontFamily: "var(--font-poppins), sans-serif" }}
    >
      <div className="flex items-center w-full" style={{ height: "clamp(60px, 8vw, 90px)" }}>

        {/* Logo area */}
        <div
          className="flex items-center flex-shrink-0"
          style={{ width: "clamp(200px, 22vw, 275px)", paddingLeft: "20px" }}
        >
          {/* Hamburger — mobile only */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden mr-3"
            style={{ color: "#E8C96A", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
            aria-label="Toggle menu"
          >
            <MenuIcon size={22} />
          </button>

          <div style={{ width: "clamp(120px, 14vw, 220px)", height: "clamp(36px, 5vw, 65px)", position: "relative", flexShrink: 0 }}>
            <Image src="/logo.png" alt="Pacific Sunday" fill style={{ objectFit: "contain", objectPosition: "left center" }} priority />
          </div>
        </div>

        {/* Team info — desktop only */}
        <div
          className="hidden lg:flex items-center gap-3 flex-1"
          style={{ paddingLeft: "20px", fontSize: "clamp(13px, 1.2vw, 18px)", fontWeight: 500 }}
        >
          <span style={{ color: "#E8C96A", fontWeight: 600 }}>Team Canada</span>
          <span style={{ color: "#FFFFFF", fontWeight: 400 }}>TC-2025-006</span>
          <span style={{ color: "#FFFFFF", fontWeight: 400 }}>✓ NFC Verified</span>
        </div>

        {/* Spacer on mobile */}
        <div className="flex-1 lg:hidden" />

        {/* Icons — always visible */}
        <div
          className="flex items-center"
          style={{ gap: "clamp(10px, 1.5vw, 20px)", paddingRight: "clamp(16px, 2vw, 30px)" }}
        >
          <button style={{ color: "#E8C96A", background: "none", border: "none", cursor: "pointer", display: "flex" }} aria-label="Notifications">
            <NotificationIcon size={24} />
          </button>
          <button style={{ color: "#E8C96A", background: "none", border: "none", cursor: "pointer", display: "flex" }} aria-label="Edit">
            <EditIcon size={24} />
          </button>
          <button style={{ color: "#E8C96A", background: "none", border: "none", cursor: "pointer", display: "flex" }} aria-label="Profile">
            <UserCircleIcon size={24} />
          </button>
        </div>

      </div>
    </header>
  );
}
