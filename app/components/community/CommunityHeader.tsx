"use client";

import { useEffect, useState } from "react";
import { IoSearchOutline, IoClose } from "react-icons/io5";
import { api } from "@/app/services/api";
import GlobalSearchBar from "@/app/components/layout/GlobalSearchBar";

export default function CommunityHeader() {
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.stats.community().then((res) => {
      if (cancelled) return;
      if (res.success) {
        setTotalUsers((res.data as any)?.totalUsers ?? 0);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const label = totalUsers === null
    ? "Members-only · verified bag owners"
    : `Members-only · ${totalUsers.toLocaleString()} verified bag owner${totalUsers === 1 ? "" : "s"}`;

  return (
    <div style={{ marginBottom: "10px" }}>
      <div className="flex items-center justify-between gap-3">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            className="tracking-wide"
            style={{
              fontSize: "clamp(17px, 2.5vw, 25px)",
              color: "#E8C96A",
              fontWeight: 400,
              fontFamily: "var(--font-poppins), sans-serif",
              lineHeight: 1.2,
            }}
          >
            Owners Community
          </div>
          <div
            style={{
              fontSize: "clamp(11px, 1.5vw, 16px)",
              color: "#FFFFFF",
              fontWeight: 400,
              fontFamily: "var(--font-poppins), sans-serif",
              marginTop: "2px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </div>
        </div>

        {/* Tablet only: inline search bar (desktop has its own in the right column) */}
        <div className="hidden sm:flex lg:hidden sm:flex-1 sm:max-w-[420px]">
          <GlobalSearchBar />
        </div>

        {/* Mobile: search icon toggle */}
        <button
          onClick={() => setMobileSearchOpen(v => !v)}
          className="sm:hidden flex items-center justify-center flex-shrink-0"
          aria-label={mobileSearchOpen ? "Close search" : "Open search"}
          style={{
            width: "36px", height: "36px",
            backgroundColor: "#13192A",
            border: "1px solid #1E2A47",
            borderRadius: "8px",
            color: "#E8C96A",
            cursor: "pointer",
          }}
        >
          {mobileSearchOpen ? <IoClose size={18} /> : <IoSearchOutline size={18} />}
        </button>
      </div>

      {/* Mobile: expandable search bar below header */}
      {mobileSearchOpen && (
        <div className="sm:hidden mt-3">
          <GlobalSearchBar />
        </div>
      )}
    </div>
  );
}
