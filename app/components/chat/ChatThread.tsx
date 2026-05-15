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
  onMessageEdited,
  onMessagesRead,
  onMessageStatus,
  onMessageStatusBulk,
  onUserPresence,
  offNewMessage,
  offMessageDeleted,
  offMessageReaction,
  offMessageEdited,
  offMessagesRead,
  offMessageStatus,
  offMessageStatusBulk,
  offUserPresence
} from "@/app/services/socket";

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  messageType: string;
  mediaUrls: string[] | null;
  createdAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
  status?: "pending" | "sent" | "delivered" | "read" | "failed";
  errorMessage?: string;
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
  // Reply state — when set, the next message we send becomes a reply to this
  // one. MessageInput renders a small preview row, send POSTs replyToId,
  // then we clear this back to null.
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [confirmAction, setConfirmAction] = useState<'clear' | 'delete' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Buffer for status events that arrive *before* the sender's HTTP response
  // returns with the real message id (recipient can ACK faster than HTTP
  // round-trips on a fast LAN). When the optimistic message is replaced with
  // the real one, we drain the buffer onto it.
  const statusBufferRef = useRef<Map<number, 'delivered' | 'read'>>(new Map());

  // WhatsApp tick semantics, derived from server-side MessageDelivery rows
  // (one per recipient, excluding sender):
  //   no deliveries (1:1 self chat, edge case)  → sent
  //   any recipient still 'SENT'                → sent     (single grey)
  //   all recipients DELIVERED or READ          → delivered (double grey)
  //   all recipients READ                       → read     (double blue)
  const formatLastSeen = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
  };

  const deriveStatus = (msg: any): 'sent' | 'delivered' | 'read' => {
    const deliveries = msg.deliveries || [];
    if (deliveries.length === 0) return 'sent';
    if (deliveries.some((d: any) => d.status === 'SENT')) return 'sent';
    if (deliveries.every((d: any) => d.status === 'READ')) return 'read';
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
    if (!conversationId || !currentUserId) return;

    if (otherUserData) {
      setOtherUser(otherUserData);
    } else {
      fetchConversation();
    }
    fetchMessages();
    markAsRead();

    joinConversation(conversationId);

    // Each handler is captured in a local const so its corresponding off-call
    // removes only this component's listener (not the global auto-ACK in socket.ts).
    const handleNewMessage = (message: any) => {
      if (message.conversationId !== conversationId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        if (message.senderId === currentUserId) return prev;
        return [...prev, message];
      });
      markAsRead();
    };

    // "Delete for everyone" — keep the bubble in the list so MessageBubble
    // can render the WhatsApp-style tombstone ("This message was deleted").
    // Mark with deletedAt; clear content + media so the bubble doesn't show
    // them even briefly during the transition.
    const handleDeleted = (data: any) => {
      if (data.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId
            ? { ...m, deletedAt: data.deletedAt || new Date().toISOString(), content: "", mediaUrls: null, reactions: [] }
            : m
        )
      );
    };

    // Edit broadcast — replace content and stamp editedAt on the matching
    // message in our list.
    const handleEdited = (data: any) => {
      if (data.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId
            ? { ...m, content: data.content, editedAt: data.editedAt }
            : m
        )
      );
    };

    const handleReaction = (data: any) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== data.messageId) return m;
          const filtered = (m.reactions || []).filter((r) => r.userId !== data.reaction.userId);
          return { ...m, reactions: [...filtered, data.reaction] };
        })
      );
    };

    // Server flips a single message's tick (one recipient ACK'd / read).
    const handleMessageStatus = (data: any) => {
      if (data.conversationId && data.conversationId !== conversationId) return;
      let matched = false;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== data.messageId) return m;
          matched = true;
          if (m.senderId !== currentUserId) return m;
          const order = { sent: 0, delivered: 1, read: 2 } as const;
          const next = data.status as 'delivered' | 'read';
          if (order[next] <= order[(m as any).status as keyof typeof order]) return m;
          return { ...m, status: next };
        })
      );
      if (!matched) {
        // HTTP response hasn't returned the real id yet — buffer it.
        const existing = statusBufferRef.current.get(data.messageId);
        if (existing !== 'read') {
          statusBufferRef.current.set(data.messageId, data.status);
        }
      }
    };

    // Batched version: emitted on reconnect-flush + read receipts.
    const handleMessageStatusBulk = (data: any) => {
      if (data.conversationId && data.conversationId !== conversationId) return;
      const ids = new Set<number>(data.messageIds || []);
      const matched = new Set<number>();
      setMessages((prev) =>
        prev.map((m) => {
          if (!ids.has(m.id)) return m;
          matched.add(m.id);
          if (m.senderId !== currentUserId) return m;
          const order = { sent: 0, delivered: 1, read: 2 } as const;
          const next = data.status as 'delivered' | 'read';
          if (order[next] <= order[(m as any).status as keyof typeof order]) return m;
          return { ...m, status: next };
        })
      );
      for (const id of ids) {
        if (!matched.has(id)) {
          const existing = statusBufferRef.current.get(id);
          if (existing !== 'read') statusBufferRef.current.set(id, data.status);
        }
      }
    };

    // Legacy room-scoped read receipt — still fires for clients viewing the
    // thread. Marks all of my outgoing messages as read.
    const handleMessagesRead = (data: any) => {
      if (data.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) => (m.senderId === currentUserId ? { ...m, status: 'read' as any } : m))
      );
    };

    // Live online/offline updates for the chat header (online dot + last seen).
    const handlePresence = (data: any) => {
      setOtherUser((prev: any) =>
        prev && prev.id === data.userId
          ? { ...prev, isOnline: data.isOnline, lastSeenAt: data.lastSeenAt }
          : prev
      );
    };

    onNewMessage(handleNewMessage);
    onMessageDeleted(handleDeleted);
    onMessageEdited(handleEdited);
    onMessageReaction(handleReaction);
    onMessagesRead(handleMessagesRead);
    onMessageStatus(handleMessageStatus);
    onMessageStatusBulk(handleMessageStatusBulk);
    onUserPresence(handlePresence);

    const socket = (window as any).socket;
    const handleReactionRemoved = (data: any) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== data.messageId) return m;
          return { ...m, reactions: (m.reactions || []).filter((r) => r.userId !== data.userId) };
        })
      );
    };
    if (socket) socket.on('reaction_removed', handleReactionRemoved);

    return () => {
      leaveConversation(conversationId);
      offNewMessage(handleNewMessage);
      offMessageDeleted(handleDeleted);
      offMessageEdited(handleEdited);
      offMessageReaction(handleReaction);
      offMessagesRead(handleMessagesRead);
      offMessageStatus(handleMessageStatus);
      offMessageStatusBulk(handleMessageStatusBulk);
      offUserPresence(handlePresence);
      if (socket) socket.off('reaction_removed', handleReactionRemoved);
    };
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
    // Don't use scrollIntoView — it walks up the DOM and scrolls every
    // scrollable ancestor it finds, which pushes the sidebar nav and the
    // conversation-list header off the top of the viewport. Drive scrollTop
    // directly so only this messages container moves.
    const el = messagesScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  // Optimistic edit — patch the message immediately, then PATCH the server.
  // If the server rejects (edit window expired, etc.), revert to the original.
  const handleEditMessage = async (messageId: number, newContent: string) => {
    const token = localStorage.getItem("ps_token");
    const original = messages.find((m) => m.id === messageId);
    if (!original) return;

    const editedAt = new Date().toISOString();
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, content: newContent, editedAt } : m))
    );

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/messages/${messageId}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ content: newContent }),
        }
      );
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error("[chat] edit failed", res.status, body);
        // Revert
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, content: original.content, editedAt: original.editedAt } : m
          )
        );
      }
    } catch (err) {
      console.error("[chat] edit error", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, content: original.content, editedAt: original.editedAt } : m
        )
      );
    }
  };

  // Hide locally + fire-and-forget the server call. We don't bother awaiting
  // since failure here is invisible to other participants anyway.
  const handleDeleteForMe = async (messageId: number) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    try {
      const token = localStorage.getItem("ps_token");
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/messages/${messageId}/hide`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("[chat] delete-for-me error", err);
    }
  };

  // "Delete for everyone" — relies on the existing DELETE route. Socket
  // event from the server will flip the bubble to a tombstone for both
  // sides; we don't need to mutate state here optimistically because the
  // server's message_deleted event handler does it.
  const handleDeleteForEveryone = async (messageId: number) => {
    try {
      const token = localStorage.getItem("ps_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/messages/${messageId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error("[chat] delete-for-everyone failed", res.status, body);
      }
    } catch (err) {
      console.error("[chat] delete-for-everyone error", err);
    }
  };

  const handleReply = (message: Message) => {
    setReplyTo(message);
  };

  const handleSendMessage = async (content: string, mediaFiles?: File[]) => {
    if (!content.trim() && !mediaFiles?.length) return;

    const tempId = -(Date.now());
    const token = localStorage.getItem("ps_token");
    // Snapshot reply target BEFORE clearing — we'll send it with the POST and
    // attach a preview to the optimistic message. Clearing now (rather than
    // after the await) keeps the input UI responsive.
    const replyToSnapshot = replyTo;
    const replyToId = replyToSnapshot?.id;
    if (replyTo) setReplyTo(null);

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
      replyTo: replyToSnapshot
        ? {
            id: replyToSnapshot.id,
            content: replyToSnapshot.content,
            messageType: replyToSnapshot.messageType,
            sender: { id: replyToSnapshot.sender.id, username: replyToSnapshot.sender.username },
          }
        : null,
      status: 'pending'
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    // Marks a single message in state. Used by both success and failure paths
    // so we don't repeat the prev.map plumbing four times below.
    const updateById = (id: number, patch: any) =>
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));

    // Reads the server's error body in a tolerant way — backends return JSON
    // most of the time but multer/proxy errors come back as plain text.
    const readError = async (res: Response) => {
      const text = await res.text().catch(() => "");
      try {
        const j = JSON.parse(text);
        return j.message || j.error || text || `HTTP ${res.status}`;
      } catch {
        return text || `HTTP ${res.status}`;
      }
    };

    try {
      let res: Response;
      if (mediaFiles && mediaFiles.length > 0) {
        const formData = new FormData();
        mediaFiles.forEach((file) => formData.append("media", file));
        if (content.trim()) formData.append("content", content);
        if (replyToId) formData.append("replyToId", String(replyToId));
        res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${conversationId}/media`,
          { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData }
        );
      } else {
        res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${conversationId}/messages`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ content, ...(replyToId ? { replyToId } : {}) }),
          }
        );
      }

      if (res.ok) {
        const real = await res.json();
        const buffered = statusBufferRef.current.get(real.id);
        real.status = buffered || deriveStatus(real);
        statusBufferRef.current.delete(real.id);
        setMessages((prev) => prev.map((m) => (m.id === tempId ? real : m)));
        return;
      }

      // HTTP error (4xx / 5xx). fetch doesn't throw for these, so we surface
      // the body explicitly. Without this the bubble would sit on the clock
      // icon forever with no clue why — exactly the bug the user just hit.
      const errMsg = await readError(res);
      console.error(
        `[chat] send failed (HTTP ${res.status})`,
        { conversationId, hadMedia: !!mediaFiles?.length, body: errMsg }
      );
      updateById(tempId, { status: "failed", errorMessage: errMsg });
    } catch (error) {
      // Network / fetch threw — likely offline or DNS failure. We keep the
      // clock icon since this state can recover on its own when connectivity
      // returns; the user might retry by hand anyway.
      console.error("[chat] send error (network):", error);
      updateById(tempId, { status: "pending" });
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
      <div className="flex-1 min-h-0 flex items-center justify-center" style={{ color: "#8B9AAF" }}>
        Loading messages...
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ overflow: "hidden" }}>
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
              <p className="text-xs" style={{ color: otherUser.isOnline ? "#10B981" : "#6B7280" }}>
                {otherUser.isOnline
                  ? "online"
                  : otherUser.lastSeenAt
                    ? `last seen ${formatLastSeen(otherUser.lastSeenAt)}`
                    : `@${otherUser.username}`}
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
        ref={messagesScrollRef}
        className="flex-1 min-h-0 p-4"
        style={{
          overflowY: "auto",
          overflowX: "hidden",
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
              onReply={handleReply}
              onEdit={handleEditMessage}
              onDeleteForMe={handleDeleteForMe}
              onDeleteForEveryone={handleDeleteForEveryone}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSendMessage}
        conversationId={conversationId}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />

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
