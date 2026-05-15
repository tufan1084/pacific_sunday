"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChatIcon } from "@/app/components/ui/Icons";

export default function ChatDropdown() {
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("ps_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // best-effort
    }
  };

  return (
    <button
      onClick={() => router.push("/messages")}
      className="relative p-2 rounded-lg transition-colors hover:bg-white/5"
      style={{ color: "#E8C96A" }}
      aria-label="Messages"
    >
      <ChatIcon size={22} />
      {unreadCount > 0 && (
        <span
          className="absolute -top-1 -right-1 flex items-center justify-center text-xs font-bold rounded-full"
          style={{
            backgroundColor: "#E8C96A",
            color: "#01050D",
            minWidth: "18px",
            height: "18px",
            padding: "0 4px"
          }}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}
