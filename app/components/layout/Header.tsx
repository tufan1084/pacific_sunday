"use client";

import Image from "next/image";
import Link from "next/link";
import { MenuIcon } from "@/app/components/ui/Icons";
import NotificationsDropdown from "@/app/components/layout/NotificationsDropdown";
import ProfileDropdown from "@/app/components/layout/ProfileDropdown";

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 border-b border-ps-border w-full"
      style={{ 
        backgroundColor: "#01050D", 
        fontFamily: "var(--font-poppins), sans-serif",
        WebkitTransform: "translateZ(0)",
        transform: "translateZ(0)",
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      <div className="flex items-center w-full" style={{ height: "clamp(50px, 5vw, 60px)", padding: "0 12px" }}>

        {/* Logo area */}
        <div className="flex items-center flex-shrink-0">
          <button
            onClick={onMenuToggle}
            className="lg:hidden mr-2"
            style={{ color: "#E8C96A", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
            aria-label="Toggle menu"
          >
            <MenuIcon size={22} />
          </button>

          <Link href="/" style={{ display: "block", width: "clamp(100px, 14vw, 220px)", height: "clamp(28px, 4.5vw, 55px)", position: "relative", flexShrink: 0 }}>
            <Image src="/data/LOGO-PHOTO.png" alt="Pacific Sunday" fill style={{ objectFit: "contain", objectPosition: "left center" }} priority />
          </Link>
        </div>

        <div className="flex-1" />

        {/* Right Icons */}
        <div
          className="flex items-center flex-shrink-0"
          style={{ gap: "clamp(8px, 1.5vw, 20px)" }}
        >
          <NotificationsDropdown />
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}
