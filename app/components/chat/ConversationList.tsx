"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { SearchIcon, ChatIcon } from "@/app/components/ui/Icons";
import { onUserPresence, onTyping, offUserPresence, offTyping, onNewMessage, offNewMessage } from "@/app/services/socket";
import NewChatModal from "./NewChatModal";

interface Conversation {
  id: number;
  otherUser: {
    id: number;
    username: string;
    name: string;
    photoUrl: string | null;
    isOnline: boolean;
    lastSeenAt: string | null;
    isTyping: boolean;
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

interface ConversationListProps {
  selectedId: number | null;
  onSelect: (id: number, otherUser?: any) => void;
}

const CACHE_KEY = "chat:conversations";

// Run before the browser paints so a remount of /messages shows the cached
// list instead of a spinner (useEffect fires after paint → visible flash).
// Falls back to useEffect during SSR where layout effects are no-ops.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Cache is "last known good" with no TTL — WhatsApp shows the previous list
// instantly and revalidates in the background, never blocking on a spinner
// once you've loaded it at least once this session.
function getCached(): Conversation[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data } = JSON.parse(raw);
    return data ?? null;
  } catch { return null; }
}

function setCached(data: Conversation[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* ignore */ }
}

function bustCache() {
  try { sessionStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
}

export default function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchUsers, setSearchUsers] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // The currently-open conversation, mirrored into a ref so the socket
  // handlers (registered once on mount) can read the latest value without
  // re-subscribing.
  const selectedIdRef = useRef<number | null>(selectedId);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  // Opening a conversation reads it (ChatThread POSTs /read). Mirror that in
  // the list immediately so the unread badge clears the moment you open the
  // chat — WhatsApp behaviour — instead of lingering until the next refetch.
  // Keyed on selectedId so it fires for row clicks *and* deep links.
  useEffect(() => {
    if (selectedId == null) return;
    setConversations((prev) => {
      if (!prev.some((c) => c.id === selectedId && c.unreadCount > 0)) return prev;
      const next = prev.map((c) =>
        c.id === selectedId ? { ...c, unreadCount: 0 } : c
      );
      setCached(next); // keep the session cache in sync so a remount stays cleared
      return next;
    });
  }, [selectedId]);

  // Paint the cached list synchronously on (re)mount so reopening /messages
  // never flashes the loading spinner.
  useIsoLayoutEffect(() => {
    const cached = getCached();
    if (cached) {
      setConversations(cached);
      setFilteredConversations(cached);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();

    // Live presence — keeps the green dot + last-seen fresh without polling.
    const handlePresence = (data: { userId: number; isOnline: boolean; lastSeenAt: string | null }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.otherUser.id === data.userId
            ? {
                ...conv,
                otherUser: {
                  ...conv.otherUser,
                  isOnline: data.isOnline,
                  lastSeenAt: data.lastSeenAt,
                },
              }
            : conv
        )
      );
    };

    const handleTyping = (data: { conversationId: number; userId: number; isTyping: boolean }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === data.conversationId
            ? { ...conv, otherUser: { ...conv.otherUser, isTyping: data.isTyping } }
            : conv
        )
      );
    };

    // Move the conversation to the top + bump unread/preview when a new message
    // arrives, so the list reflects activity without re-fetching from the server.
    const handleNewMessage = (message: any) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === message.conversationId);
        if (idx === -1) {
          // Unknown conversation (newly created) — refetch the list.
          fetchConversations(true);
          return prev;
        }
        const conv = prev[idx];
        const myId = typeof window !== "undefined"
          ? parseInt(localStorage.getItem("ps_user_id") || "0")
          : 0;
        const isMine = message.senderId === myId;
        // A chat that's currently open is being read in real time, so it must
        // never accrue an unread badge (ChatThread marks it read on arrival).
        const isOpen = selectedIdRef.current === message.conversationId;
        const unreadCount = isOpen
          ? 0
          : isMine
          ? conv.unreadCount
          : (conv.unreadCount || 0) + 1;
        const updated: Conversation = {
          ...conv,
          lastMessage: {
            content: message.content,
            messageType: message.messageType,
            senderId: message.senderId,
            createdAt: message.createdAt,
          } as any,
          unreadCount,
          updatedAt: message.createdAt,
        };
        const next = prev.filter((_, i) => i !== idx);
        next.unshift(updated);
        return next;
      });
    };

    onUserPresence(handlePresence);
    onTyping(handleTyping);
    onNewMessage(handleNewMessage);

    return () => {
      offUserPresence(handlePresence);
      offTyping(handleTyping);
      offNewMessage(handleNewMessage);
    };
  }, []);

  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredConversations(conversations);
      setSearchUsers([]);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredConversations(
        conversations.filter(
          (conv) =>
            conv.otherUser.name.toLowerCase().includes(query) ||
            conv.otherUser.username.toLowerCase().includes(query)
        )
      );
      
      // Debounced user search in new chat mode
      if (showNewChat) {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
          searchForUsers(query);
        }, 400);
      }
    }
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery, conversations, showNewChat]);

  // Always revalidates against the server in the background. We never gate the
  // UI on this — the cached list (painted by the layout effect above) stays
  // visible and is swapped for fresh data when it arrives. The spinner only
  // shows on the very first load of the session (no cache yet).
  const fetchConversations = async (bustFirst = false) => {
    if (bustFirst) bustCache();
    try {
      const token = localStorage.getItem("ps_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCached(data);
        // The search effect ([searchQuery, conversations]) recomputes the
        // filtered list, so we don't set it here — that would clobber an
        // in-progress search when a background refresh lands.
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

    if (days > 6) {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
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
    return content.length > 50 ? content.substring(0, 50) + "..." : content;
  };

  const searchForUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchUsers([]);
      return;
    }
    
    setSearchingUsers(true);
    try {
      const token = localStorage.getItem("ps_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/search?q=${encodeURIComponent(query)}&type=users`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setSearchUsers(data.data?.users || []);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearchingUsers(false);
    }
  };

  const startConversation = async (userId: number) => {
    // Find user info from search results for immediate display
    const user = searchUsers.find((u: any) => u.id === userId);
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
        const otherUser = data.otherUser || user || { id: userId, username: '', name: '', photoUrl: null };
        onSelect(data.id, otherUser);
        setShowNewChat(false);
        setSearchQuery("");
        setSearchUsers([]);
        fetchConversations();
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div
        className="px-4 py-3 border-b"
        style={{ 
          borderColor: "rgba(232, 201, 106, 0.1)",
          background: "linear-gradient(180deg, #0F1629 0%, #0B1120 100%)"
        }}
      >
        <h1 className="text-xl font-semibold tracking-tight mb-3" style={{ color: "#E8C96A" }}>
          Chats
        </h1>

        {/* Search with New Chat Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
              size={16}
            />
            <input
              type="text"
              placeholder={showNewChat ? "Search users..." : "Search conversations..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg outline-none transition-all text-sm text-left"
              style={{
                backgroundColor: "#1A2332",
                border: "1px solid rgba(232, 201, 106, 0.08)",
                color: "#E8C96A"
              }}
            />
          </div>
          
          <button
            onClick={() => {
              setShowNewChat(!showNewChat);
              setSearchQuery("");
              setSearchUsers([]);
            }}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-105 flex-shrink-0"
            style={{
              backgroundColor: showNewChat ? "#1A2332" : "#E8C96A",
              color: showNewChat ? "#E8C96A" : "#01050D",
              border: showNewChat ? "1px solid #E8C96A" : "none"
            }}
            title={showNewChat ? "Back to Chats" : "New Chat"}
          >
            {showNewChat ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <path d="M9 10h6M12 7v6" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* List Content — transparent so the panel's doodle background shows
          through behind the conversation rows (rows are themselves
          transparent, only borders + hover tint). */}
      <div className="flex-1 overflow-y-auto">
        {showNewChat ? (
          // New Chat - User Search
          <div>
            {searchingUsers ? (
              <div className="p-8 text-center" style={{ color: "#6B7280" }}>
                <div className="inline-block w-6 h-6 rounded-full animate-spin" style={{ border: "2px solid rgba(232, 201, 106, 0.3)", borderTopColor: "#E8C96A" }}></div>
              </div>
            ) : searchUsers.length === 0 && searchQuery ? (
              <div className="p-8 text-center" style={{ color: "#6B7280" }}>
                <p className="text-sm">No users found</p>
              </div>
            ) : searchUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center" style={{ color: "#6B7280" }}>
                <div className="w-16 h-16 rounded-full mb-3 flex items-center justify-center" style={{ backgroundColor: "#1A2332" }}>
                  <SearchIcon size={32} className="opacity-30" />
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: "#E8C96A" }}>
                  Search for users
                </p>
                <p className="text-xs">Type a name or username to find people</p>
              </div>
            ) : (
              searchUsers.map((user) => (
                <button
                  key={user.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    (e.currentTarget as HTMLButtonElement).focus({ preventScroll: true });
                  }}
                  onClick={() => startConversation(user.id)}
                  className="w-full px-4 py-2.5 flex items-center gap-3 transition-all border-b hover:bg-white/3"
                  style={{ borderColor: "rgba(232, 201, 106, 0.05)" }}
                >
                  <div
                    className="w-11 h-11 rounded-md flex items-center justify-center text-base font-semibold overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: "#1A2332", color: "#E8C96A" }}
                  >
                    {user.photoUrl ? (
                      <img
                        src={user.photoUrl}
                        alt={user.name || user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (user.name || user.username).charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium text-sm truncate" style={{ color: "#E8C96A" }}>
                      {user.name || user.username}
                    </p>
                    <p className="text-xs truncate" style={{ color: "#6B7280" }}>
                      @{user.username}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          // Existing Conversations
          <div>
            {loading ? (
              <div className="p-8 text-center" style={{ color: "#6B7280" }}>
                <div className="inline-block w-6 h-6 rounded-full animate-spin" style={{ border: "2px solid rgba(232, 201, 106, 0.3)", borderTopColor: "#E8C96A" }}></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center" style={{ color: "#6B7280" }}>
                <div className="w-16 h-16 rounded-full mb-3 flex items-center justify-center" style={{ backgroundColor: "#1A2332" }}>
                  <ChatIcon size={32} className="opacity-30" />
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: "#E8C96A" }}>
                  {searchQuery ? "No conversations found" : "No messages yet"}
                </p>
                <p className="text-xs">
                  {searchQuery ? "Try a different search" : "Click the button above to start chatting"}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onMouseDown={(e) => {
                    // Firefox: clicking a button focuses it, and the browser
                    // walks up the DOM looking for a scrollable ancestor to
                    // bring it into view — that's what shifts the sidebar
                    // and the chat header off-screen. Re-focus with
                    // preventScroll, then run the click handler.
                    e.preventDefault();
                    (e.currentTarget as HTMLButtonElement).focus({ preventScroll: true });
                  }}
                  onClick={() => onSelect(conv.id, conv.otherUser)}
                  className={`w-full px-4 py-2.5 flex items-center gap-3 transition-all border-b ${
                    selectedId === conv.id
                      ? "bg-gradient-to-r from-[#E8C96A]/8 to-transparent"
                      : "hover:bg-white/3"
                  }`}
                  style={{ borderColor: "rgba(232, 201, 106, 0.05)" }}
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-11 h-11 rounded-md flex items-center justify-center text-base font-semibold overflow-hidden"
                      style={{ backgroundColor: "#1A2332", color: "#E8C96A" }}
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
                        style={{ backgroundColor: "#10B981", borderColor: "#0B1120" }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-medium truncate text-sm" style={{ color: "#E8C96A" }}>
                        {conv.otherUser.name}
                      </span>
                      {conv.lastMessage && (
                        <span
                          className="text-xs ml-2 flex-shrink-0"
                          style={{ color: conv.unreadCount > 0 ? "#E8C96A" : "#6B7280" }}
                        >
                          {formatTime(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    {conv.otherUser.isTyping ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium" style={{ color: "#E8C96A" }}>typing</span>
                        <span className="flex gap-0.5">
                          <span className="w-1 h-1 rounded-full animate-bounce" style={{ backgroundColor: "#E8C96A", animationDelay: "0ms" }}></span>
                          <span className="w-1 h-1 rounded-full animate-bounce" style={{ backgroundColor: "#E8C96A", animationDelay: "150ms" }}></span>
                          <span className="w-1 h-1 rounded-full animate-bounce" style={{ backgroundColor: "#E8C96A", animationDelay: "300ms" }}></span>
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className="text-xs truncate flex-1"
                          style={{
                            color: conv.unreadCount > 0 ? "#E8C96A" : "#6B7280",
                            fontWeight: conv.unreadCount > 0 ? 500 : 400
                          }}
                        >
                          {conv.lastMessage
                            ? truncateMessage(conv.lastMessage.content, conv.lastMessage.messageType)
                            : "Start a conversation"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span
                            className="flex-shrink-0 text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center"
                            style={{ backgroundColor: "#E8C96A", color: "#01050D" }}
                          >
                            {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
