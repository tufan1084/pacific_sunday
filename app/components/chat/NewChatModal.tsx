"use client";

import { useState, useEffect, useRef } from "react";
import { CloseIcon, SearchIcon, ChatIcon } from "@/app/components/ui/Icons";

interface User {
  id: number;
  username: string;
  name: string;
  photoUrl: string | null;
}

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: number) => void;
}

export default function NewChatModal({ isOpen, onClose, onConversationCreated }: NewChatModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setUsers([]);
      setLoading(false);
      setCreating(false);
    }
  }, [isOpen]);

  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && searchQuery.trim().length >= 2) {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        searchUsers();
      }, 400);
    } else {
      setUsers([]);
    }
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery, isOpen]);

  const searchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("ps_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/search?q=${encodeURIComponent(searchQuery)}&type=users`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data?.users || []);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (userId: number) => {
    setCreating(true);
    try {
      const token = localStorage.getItem("ps_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/conversations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ otherUserId: userId })
      });

      if (res.ok) {
        const data = await res.json();
        // Reset modal state
        setSearchQuery("");
        setUsers([]);
        // Notify parent and close
        onConversationCreated(data.id);
        onClose();
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: "#0F1629" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 border-b"
          style={{ 
            borderColor: "rgba(232, 201, 106, 0.2)",
            background: "linear-gradient(180deg, #1A2332 0%, #0F1629 100%)"
          }}
        >
          <h2 className="text-2xl font-bold" style={{ color: "#E8C96A" }}>
            New Message
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/5 transition-all hover:scale-110"
            style={{ color: "#E8C96A" }}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-5">
          <div className="relative">
            <SearchIcon
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B9AAF]"
              size={18}
            />
            <input
              type="text"
              placeholder="Search users by name or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-11 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-2"
              style={{
                backgroundColor: "#1A2332",
                border: "1px solid rgba(232, 201, 106, 0.2)",
                color: "#E8C96A",
                fontSize: "15px"
              }}
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center" style={{ color: "#6B7280" }}>
              <div className="inline-block w-8 h-8 rounded-full animate-spin" style={{ border: "3px solid rgba(232, 201, 106, 0.3)", borderTopColor: "#E8C96A" }}></div>
            </div>
          ) : searchQuery.trim().length < 2 ? (
            <div className="p-12 text-center" style={{ color: "#6B7280" }}>
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#1A2332" }}>
                <SearchIcon size={32} className="opacity-40" />
              </div>
              <p className="font-medium">Type at least 2 characters to search</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center" style={{ color: "#6B7280" }}>
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#1A2332" }}>
                <SearchIcon size={32} className="opacity-40" />
              </div>
              <p className="font-semibold mb-1" style={{ color: "#E8C96A" }}>No users found</p>
              <p className="text-sm">Try a different search</p>
            </div>
          ) : (
            users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleStartChat(user.id)}
                disabled={creating}
                className="w-full px-5 py-4 flex items-center gap-3 hover:bg-white/5 transition-all border-b disabled:opacity-50 group"
                style={{ borderColor: "rgba(232, 201, 106, 0.05)" }}
              >
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold overflow-hidden ring-2 ring-transparent group-hover:ring-[#E8C96A]/30 transition-all"
                  style={{
                    backgroundColor: "#1A2332",
                    color: "#E8C96A"
                  }}
                >
                  {user.photoUrl ? (
                    <img
                      src={user.photoUrl}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 text-left">
                  <p className="font-semibold text-base" style={{ color: "#E8C96A" }}>
                    {user.name}
                  </p>
                  <p className="text-sm" style={{ color: "#6B7280" }}>
                    @{user.username}
                  </p>
                </div>

                {/* Chat Icon */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all group-hover:scale-110" style={{ backgroundColor: "#E8C96A" }}>
                  <ChatIcon size={18} className="text-[#01050D]" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
