"use client";

import { useState, useEffect, useRef } from "react";
import { CloseIcon, SendIcon, ImageIcon, EmojiIcon, MoreVerticalIcon, ChatIcon } from "@/app/components/ui/Icons";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import {
  joinConversation,
  leaveConversation,
  onNewMessage,
  onMessageDeleted,
  onMessageReaction,
  onMessagesRead,
  offNewMessage,
  offMessageDeleted,
  offMessageReaction,
  offMessagesRead
} from "@/app/services/socket";

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  messageType: string;
  mediaUrls: string[] | null;
  createdAt: string;
  sender: {
    id: number;
    username: string;
    profile: {
      name: string;
      golfPassport: {
        photoUrl: string | null;
      } | null;
    } | null;
  };
  reactions: Array<{
    id: number;
    emoji: string;
    userId: number;
    user: {
      id: number;
      username: string;
    };
  }>;
  replyTo: {
    id: number;
    content: string;
    messageType: string;
    sender: {
      id: number;
      username: string;
    };
  } | null;
}

interface ChatThreadProps {
  conversationId: number;
  otherUserData?: any;
  onBack: () => void;
  isMobile: boolean;
}

export default function ChatThread({ conversationId, otherUserData, onBack, isMobile }: ChatThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'clear' | 'delete' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const deriveStatus = (msg: any) => {
    const deliveries = msg.deliveries || [];
    if (deliveries.length === 0) return 'sent';
    const allRead = deliveries.every((d: any) => d.status === 'READ');
    if (allRead) return 'read';
    return 'delivered';
  };

  useEffect(() => {
    const userId = localStorage.getItem("ps_user_id");
    if (userId) setCurrentUserId(parseInt(userId));
    
    // Close menu on outside click
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (conversationId && currentUserId) {
      // Use passed data or fetch if not available (e.g. page refresh)
      if (otherUserData) {
        setOtherUser(otherUserData);
      } else {
        fetchConversation();
      }
      fetchMessages();
      markAsRead(); // fire-and-forget
      
      // Join conversation room
      joinConversation(conversationId);
      
      // Listen for real-time events
      onNewMessage((message) => {
        if (message.conversationId === conversationId) {
          setMessages((prev) => {
            // Skip if message already exists (from optimistic update or duplicate)
            if (prev.some(m => m.id === message.id)) return prev;
            // Skip if this is our own message (already shown optimistically)
            if (message.senderId === currentUserId) return prev;
            return [...prev, message];
          });
          markAsRead();
        }
      });
      
      onMessageDeleted((data) => {
        if (data.conversationId === conversationId) {
          setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
        }
      });
      
      onMessageReaction((data) => {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === data.messageId) {
              // Remove any existing reaction from this user and add the new one
              const filteredReactions = (m.reactions || []).filter(
                (r) => r.userId !== data.reaction.userId
              );
              return { ...m, reactions: [...filteredReactions, data.reaction] };
            }
            return m;
          })
        );
      });
      
      onMessagesRead((data) => {
        if (data.conversationId === conversationId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.senderId === currentUserId ? { ...m, status: 'read' } : m
            )
          );
        }
      });
      
      // Listen for reaction removal
      const handleReactionRemoved = (data: any) => {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === data.messageId) {
              return {
                ...m,
                reactions: (m.reactions || []).filter((r) => r.userId !== data.userId)
              };
            }
            return m;
          })
        );
      };
      
      // Add listener for reaction removal
      const socket = (window as any).socket;
      if (socket) {
        socket.on('reaction_removed', handleReactionRemoved);
      }
      
      return () => {
        leaveConversation(conversationId);
        offNewMessage();
        offMessageDeleted();
        offMessageReaction();
        offMessagesRead();
        if (socket) {
          socket.off('reaction_removed', handleReactionRemoved);
        }
      };
    }
  }, [conversationId, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversation = async () => {
    try {
      const token = localStorage.getItem("ps_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (res.ok) {
        const conversations = await res.json();
        const currentConv = conversations.find((c: any) => c.id === conversationId);
        if (currentConv && currentConv.otherUser) {
          setOtherUser({
            id: currentConv.otherUser.id,
            username: currentConv.otherUser.username,
            name: currentConv.otherUser.name,
            photoUrl: currentConv.otherUser.photoUrl
          });
        }
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("ps_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${conversationId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (res.ok) {
        const data = await res.json();
        const withStatus = data.map((msg: any) => {
          if (msg.senderId !== currentUserId) return msg;
          return { ...msg, status: deriveStatus(msg) };
        });
        setMessages(withStatus);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      const token = localStorage.getItem("ps_token");
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${conversationId}/read`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        }
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (content: string, mediaFiles?: File[]) => {
    if (!content.trim() && !mediaFiles?.length) return;

    const tempId = -(Date.now());
    const token = localStorage.getItem("ps_token");

    // Optimistic UI: show message instantly with pending status
    const optimisticMessage: any = {
      id: tempId,
      conversationId,
      senderId: currentUserId!,
      content: content.trim(),
      messageType: mediaFiles?.length ? 'IMAGE' : 'TEXT',
      mediaUrls: mediaFiles ? mediaFiles.map(f => URL.createObjectURL(f)) : null,
      createdAt: new Date().toISOString(),
      sender: {
        id: currentUserId!,
        username: '',
        profile: null
      },
      reactions: [],
      replyTo: null,
      status: 'pending'
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      if (mediaFiles && mediaFiles.length > 0) {
        const formData = new FormData();
        mediaFiles.forEach((file) => formData.append("media", file));
        if (content.trim()) formData.append("content", content);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${conversationId}/media`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData
          }
        );
        if (res.ok) {
          const real = await res.json();
          real.status = deriveStatus(real);
          setMessages((prev) => prev.map(m => m.id === tempId ? real : m));
        }
      } else {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${conversationId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ content })
          }
        );
        if (res.ok) {
          const real = await res.json();
          real.status = deriveStatus(real);
          setMessages((prev) => prev.map(m => m.id === tempId ? real : m));
        }
      }
    } catch (error) {
      // Keep message with pending status (clock icon) — indicates no internet
      setMessages((prev) => prev.map(m => m.id === tempId ? { ...m, status: 'pending' } : m));
      console.error("Error sending message:", error);
    }
  };

  const handleViewProfile = () => {
    if (otherUser) {
      window.location.href = `/user/${otherUser.id}`;
    }
  };

  const handleDeleteConversation = () => {
    setConfirmAction('delete');
    setShowConfirmModal(true);
    setShowMenu(false);
  };

  const handleClearHistory = () => {
    setConfirmAction('clear');
    setShowConfirmModal(true);
    setShowMenu(false);
  };

  const executeConfirmAction = async () => {
    if (confirmAction === 'clear') {
      try {
        const token = localStorage.getItem("ps_token");
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${conversationId}/clear`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages([]);
      } catch (error) {
        console.error("Error clearing chat:", error);
      }
    } else if (confirmAction === 'delete') {
      try {
        const token = localStorage.getItem("ps_token");
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${conversationId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        onBack();
      } catch (error) {
        console.error("Error deleting conversation:", error);
      }
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: "#8B9AAF" }}>
        Loading messages...
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: "100%", maxHeight: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div
        className="px-4 py-2.5 border-b flex items-center gap-3"
        style={{ 
          borderColor: "rgba(232, 201, 106, 0.1)",
          backgroundColor: "#1A2332"
        }}
      >
        {isMobile && (
          <button
            onClick={onBack}
            className="p-1.5 rounded-full hover:bg-white/5 transition-all"
            style={{ color: "#E8C96A" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {otherUser && (
          <>
            <div
              className="w-9 h-9 rounded-md flex items-center justify-center text-sm font-semibold overflow-hidden"
              style={{ backgroundColor: "#1A2332", color: "#E8C96A" }}
            >
              {otherUser.photoUrl ? (
                <img
                  src={otherUser.photoUrl}
                  alt={otherUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                otherUser.name.charAt(0).toUpperCase()
              )}
            </div>

            <div className="flex-1">
              <h2 className="font-semibold text-sm" style={{ color: "#E8C96A" }}>
                {otherUser.name}
              </h2>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                @{otherUser.username}
              </p>
            </div>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-full hover:bg-white/5 transition-all"
                style={{ color: "#E8C96A" }}
              >
                <MoreVerticalIcon size={18} />
              </button>

              {showMenu && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg border z-50"
                  style={{
                    backgroundColor: "#1A2332",
                    borderColor: "rgba(232, 201, 106, 0.2)"
                  }}
                >
                  <button
                    onClick={handleViewProfile}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-all flex items-center gap-2 border-b"
                    style={{ color: "#E8C96A", borderColor: "rgba(232, 201, 106, 0.1)" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    View Profile
                  </button>
                  <button
                    onClick={handleClearHistory}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-all flex items-center gap-2 border-b"
                    style={{ color: "#E8C96A", borderColor: "rgba(232, 201, 106, 0.1)" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Clear Chat
                  </button>
                  <button
                    onClick={handleDeleteConversation}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-all flex items-center gap-2 rounded-b-lg"
                    style={{ color: "#EF4444" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                    Delete Conversation
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div 
        className="flex-1 p-4"
        style={{
          overflowY: "auto",
          overflowX: "hidden",
          maxHeight: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center" style={{ color: "#6B7280" }}>
            <div className="w-20 h-20 rounded-full mb-4 flex items-center justify-center" style={{ backgroundColor: "#1A2332" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-lg font-semibold mb-2" style={{ color: "#E8C96A" }}>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUserId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={handleSendMessage} conversationId={conversationId} />

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="w-full max-w-md rounded-lg p-6"
            style={{ backgroundColor: "#1A2332" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-3" style={{ color: "#E8C96A" }}>
              {confirmAction === 'clear' ? 'Clear Chat' : 'Delete Conversation'}
            </h3>
            <p className="text-sm mb-6" style={{ color: "#E8E8E8" }}>
              {confirmAction === 'clear'
                ? 'Are you sure you want to clear all messages? This cannot be undone.'
                : 'Are you sure you want to delete this conversation? This cannot be undone.'}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid #E8C96A",
                  color: "#E8C96A"
                }}
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmAction}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: "#EF4444",
                  color: "#FFF"
                }}
              >
                {confirmAction === 'clear' ? 'Clear' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
