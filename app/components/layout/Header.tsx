"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, MenuIcon } from "@/app/components/ui/Icons";
import NotificationsDropdown from "@/app/components/layout/NotificationsDropdown";
import ProfileDropdown from "@/app/components/layout/ProfileDropdown";

interface HeaderProps {
  onMenuToggle: () => void;
  showBack?: boolean;
}

export default function Header({ onMenuToggle, showBack = false }: HeaderProps) {
  const router = useRouter();

  // iOS standalone PWAs have no browser chrome and no hardware back button,
  // so we need an in-app back affordance. window.history.length is reliable
  // for "did I arrive here from inside the app or as the first page" — if it's
  // 1 the user opened this URL directly and there's nothing to pop, so we
  // route them to home instead of leaving them stranded.
  const handleBack = () => {
    if (typeof window === "undefined") return;
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

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

          {showBack && (
            <button
              onClick={handleBack}
              style={{
                color: "#E8C96A",
                background: "none",
                border: "none",
                cursor: "pointer",
                flexShrink: 0,
                marginRight: "8px",
                padding: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "6px",
              }}
              aria-label="Go back"
            >
              <ArrowLeftIcon size={22} />
            </button>
          )}

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
