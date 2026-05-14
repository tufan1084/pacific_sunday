"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChatIcon } from "@/app/components/ui/Icons";

interface Conversation {
  id: number;
  otherUser: {
    id: number;
    username: string;
    name: string;
    photoUrl: string | null;
    isOnline: boolean;
  };
  lastMessage: {
    content: string;
    messageType: string;
    senderId: number;
    createdAt: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export default function ChatDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

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
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("ps_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes > 0) return `${minutes}m`;
    return "now";
  };

  const truncateMessage = (content: string, type: string) => {
    if (type === "IMAGE") return "📷 Photo";
    if (type === "VIDEO") return "🎥 Video";
    if (type === "MIXED") return "📎 Media";
    return content.length > 40 ? content.substring(0, 40) + "..." : content;
  };

  const handleConversationClick = (convId: number) => {
    setIsOpen(false);
    router.push(`/messages?conversation=${convId}`);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    router.push("/messages");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
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

      {isOpen && (
        <div
          className="absolute right-0 mt-2 rounded-lg shadow-2xl overflow-hidden z-50"
          style={{
            backgroundColor: "#0A1628",
            border: "1px solid rgba(232, 201, 106, 0.2)",
            width: "360px",
            maxHeight: "500px"
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 border-b flex items-center justify-between"
            style={{ borderColor: "rgba(232, 201, 106, 0.1)" }}
          >
            <h3 className="font-semibold" style={{ color: "#E8C96A" }}>
              Messages
            </h3>
            <button
              onClick={handleViewAll}
              className="text-sm hover:underline"
              style={{ color: "#E8C96A" }}
            >
              View All
            </button>
          </div>

          {/* Conversations List */}
          <div className="overflow-y-auto" style={{ maxHeight: "420px" }}>
            {loading ? (
              <div className="p-8 text-center" style={{ color: "#8B9AAF" }}>
                Loading...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center" style={{ color: "#8B9AAF" }}>
                <ChatIcon size={48} className="mx-auto mb-3 opacity-30" />
                <p>No messages yet</p>
                <p className="text-sm mt-1">Start a conversation!</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleConversationClick(conv.id)}
                  className="w-full px-4 py-3 flex items-start gap-3 transition-colors hover:bg-white/5 border-b"
                  style={{ borderColor: "rgba(232, 201, 106, 0.05)" }}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold overflow-hidden"
                      style={{
                        backgroundColor: "#1a2942",
                        color: "#E8C96A"
                      }}
                    >
                      {conv.otherUser.photoUrl ? (
                        <img
                          src={conv.otherUser.photoUrl}
                          alt={conv.otherUser.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        conv.otherUser.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    {conv.otherUser.isOnline && (
                      <div
                        className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                        style={{
                          backgroundColor: "#10B981",
                          borderColor: "#0A1628"
                        }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="font-medium truncate"
                        style={{ color: "#E8C96A" }}
                      >
                        {conv.otherUser.name}
                      </span>
                      {conv.lastMessage && (
                        <span
                          className="text-xs ml-2 flex-shrink-0"
                          style={{ color: "#8B9AAF" }}
                        >
                          {formatTime(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p
                        className="text-sm truncate"
                        style={{
                          color: conv.unreadCount > 0 ? "#E8C96A" : "#8B9AAF",
                          fontWeight: conv.unreadCount > 0 ? 600 : 400
                        }}
                      >
                        {conv.lastMessage
                          ? truncateMessage(conv.lastMessage.content, conv.lastMessage.messageType)
                          : "No messages yet"}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span
                          className="ml-2 flex-shrink-0 text-xs font-bold rounded-full px-2 py-0.5"
                          style={{
                            backgroundColor: "#E8C96A",
                            color: "#01050D"
                          }}
                        >
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
