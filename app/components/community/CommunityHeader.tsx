"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/services/api";

export default function CommunityHeader() {
  const [totalUsers, setTotalUsers] = useState<number | null>(null);

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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <div
          className="tracking-wide"
          style={{
            fontSize: "clamp(18px, 2.5vw, 25px)",
            color: "#E8C96A",
            fontWeight: 400,
            fontFamily: "var(--font-poppins), sans-serif",
          }}
        >
          Owners Community
        </div>
        <div
          className="mt-1"
          style={{
            fontSize: "clamp(13px, 1.5vw, 16px)",
            color: "#FFFFFF",
            fontWeight: 400,
            fontFamily: "var(--font-poppins), sans-serif",
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}
