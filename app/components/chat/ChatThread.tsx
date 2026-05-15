"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
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
  onTyping,
  offNewMessage,
  offMessageDeleted,
  offMessageReaction,
  offMessageEdited,
  offMessagesRead,
  offMessageStatus,
  offMessageStatusBulk,
  offUserPresence,
  offTyping
} from "@/app/services/socket";

// Per-conversation message cache (session-scoped). Lets a reopened thread
// paint its last-known messages instantly instead of a "Loading…" screen,
// the way WhatsApp does. Capped to the most recent slice so sessionStorage
// can't bloat; optimistic (negative-id) messages are never cached.
const MSG_CACHE_PREFIX = "chat:messages:";
const MSG_CACHE_LIMIT = 80;
const CONV_CACHE_KEY = "chat:conversations";

function getCachedMessages(cid: number): any[] | null {
  try {
    const raw = sessionStorage.getItem(MSG_CACHE_PREFIX + cid);
    const arr = raw ? JSON.parse(raw) : null;
    return Array.isArray(arr) && arr.length ? arr : null;
  } catch { return null; }
}

function setCachedMessages(cid: number, data: any[]) {
  try {
    const real = data.filter((m) => m && m.id > 0);
    if (!real.length) return;
    sessionStorage.setItem(
      MSG_CACHE_PREFIX + cid,
      JSON.stringify(real.slice(-MSG_CACHE_LIMIT))
    );
  } catch { /* quota / serialization — non-fatal, just skip caching */ }
}

// Pull the other participant out of the conversation-list cache so the header
// (name/avatar/presence) renders instantly on a deep-link/refresh instead of
// waiting on the /conversations round-trip.
function getCachedOtherUser(cid: number): any | null {
  try {
    const raw = sessionStorage.getItem(CONV_CACHE_KEY);
    if (!raw) return null;
    const { data } = JSON.parse(raw);
    const conv = (data || []).find((c: any) => c.id === cid);
    return conv?.otherUser ?? null;
  } catch { return null; }
}

// Layout effect on the client (runs before paint → no spinner flash),
// plain effect on the server where layout effects are no-ops.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
  // True while the other participant is typing in this conversation. Drives
  // the "typing…" line in the header. Auto-clears on a safety timeout in case
  // the stop event is missed.
  const [otherTyping, setOtherTyping] = useState(false);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // Hydrate this conversation's thread from cache *before paint*, keyed on the
  // conversation id so switching chats swaps content with no loading screen
  // and no flash of the previous chat's messages. The network refresh in the
  // effect below then reconciles silently.
  useIsoLayoutEffect(() => {
    if (!conversationId) return;
    const uidRaw = typeof window !== "undefined" ? localStorage.getItem("ps_user_id") : null;
    const uid = currentUserId ?? (uidRaw ? parseInt(uidRaw) : null);
    const cached = getCachedMessages(conversationId);
    if (cached) {
      setMessages(
        cached.map((msg: any) =>
          msg.senderId !== uid ? msg : { ...msg, status: deriveStatus(msg) }
        )
      );
      setLoading(false);
    } else {
      // No cache for this chat yet — clear the previous chat's messages so
      // they don't linger, and show the loader until the fetch lands.
      setMessages([]);
      setLoading(true);
    }
  }, [conversationId, currentUserId]);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    if (otherUserData) {
      setOtherUser(otherUserData);
    } else {
      fetchConversation();
    }
    // Silent (no loader) when we already painted cached messages — the fetch
    // just reconciles in the background. Loud (loader) only on a cold thread.
    fetchMessages(!!getCachedMessages(conversationId));
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

    // Typing indicator from the other participant. We ignore our own echo and
    // anything for a different conversation. A 4s safety timer clears the
    // state if the matching "stopped typing" event never arrives.
    const handleTyping = (data: { conversationId: number; userId: number; isTyping: boolean }) => {
      if (data.conversationId !== conversationId) return;
      if (data.userId === currentUserId) return;
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      if (data.isTyping) {
        setOtherTyping(true);
        typingClearRef.current = setTimeout(() => setOtherTyping(false), 4000);
      } else {
        setOtherTyping(false);
      }
    };

    onNewMessage(handleNewMessage);
    onMessageDeleted(handleDeleted);
    onMessageEdited(handleEdited);
    onMessageReaction(handleReaction);
    onMessagesRead(handleMessagesRead);
    onMessageStatus(handleMessageStatus);
    onMessageStatusBulk(handleMessageStatusBulk);
    onUserPresence(handlePresence);
    onTyping(handleTyping);

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
      offTyping(handleTyping);
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      setOtherTyping(false);
      if (socket) socket.off('reaction_removed', handleReactionRemoved);
    };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Keep the session cache in lock-step with the live thread (new messages,
  // edits, reactions, tombstones) so reopening it is always instant *and*
  // up to date. Optimistic temp messages are filtered out by setCachedMessages.
  useEffect(() => {
    if (!conversationId || messages.length === 0) return;
    setCachedMessages(conversationId, messages);
  }, [messages, conversationId]);

  const fetchConversation = async () => {
    // Paint the header from the conversation-list cache first (no flicker on
    // refresh / deep-link), then refresh from the network.
    const cachedOther = getCachedOtherUser(conversationId);
    if (cachedOther) {
      setOtherUser({
        id: cachedOther.id,
        username: cachedOther.username,
        name: cachedOther.name,
        photoUrl: cachedOther.photoUrl,
        isOnline: cachedOther.isOnline,
        lastSeenAt: cachedOther.lastSeenAt,
      });
    }
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
            photoUrl: currentConv.otherUser.photoUrl,
            // Carry presence through — without these the header status line
            // (online / last seen) stayed blank on page refresh.
            isOnline: currentConv.otherUser.isOnline,
            lastSeenAt: currentConv.otherUser.lastSeenAt,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
    }
  };

  const fetchMessages = async (silent = false) => {
    if (!silent) setLoading(true);
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
        // Warm the cache so the next open of this thread is instant.
        setCachedMessages(conversationId, data);
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

  // Optimistic reaction toggle — mirrors the backend's logic so the emoji
  // appears the instant you tap it instead of after the HTTP+socket round
  // trip. The socket events (message_reaction / reaction_removed) reconcile
  // afterwards and are idempotent (they replace/remove by userId), so a
  // double-apply is harmless.
  const handleReactMessage = async (messageId: number, emoji: string) => {
    const token = localStorage.getItem("ps_token");
    let removed = false;

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = m.reactions || [];
        const mine = reactions.find((r) => r.userId === currentUserId);
        const others = reactions.filter((r) => r.userId !== currentUserId);
        // Tapping the same emoji you already reacted with toggles it off.
        if (mine && mine.emoji === emoji) {
          removed = true;
          return { ...m, reactions: others };
        }
        const optimistic = {
          id: -Date.now(),
          emoji,
          userId: currentUserId!,
          user: { id: currentUserId!, username: "" },
        };
        return { ...m, reactions: [...others, optimistic] };
      })
    );

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/messages/${messageId}/react`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      // No state work on success — the socket event is the source of truth and
      // will overwrite our optimistic entry with the real one (correct id).
    } catch (err) {
      console.error("[chat] react error", err);
      // Roll back the optimistic change on network failure.
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const reactions = m.reactions || [];
          if (removed) return m; // can't cheaply restore; socket will resync
          return { ...m, reactions: reactions.filter((r) => r.userId !== currentUserId) };
        })
      );
    }
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

  // Only block on the loader for a genuinely cold thread (no cache, nothing
  // painted yet). If we have cached messages the thread renders immediately
  // and the background fetch reconciles silently — WhatsApp-style.
  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center" style={{ color: "#8B9AAF" }}>
        Loading messages...
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ overflow: "hidden", minWidth: 0, height: "100%" }}>
      {/* Header */}
      <div
        className="px-3 py-2 sm:px-4 sm:py-2.5 border-b flex items-center gap-2 sm:gap-3 flex-shrink-0"
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
              onClick={handleViewProfile}
              className="w-9 h-9 rounded-md flex items-center justify-center text-sm font-semibold overflow-hidden flex-shrink-0 cursor-pointer"
              style={{
                backgroundColor: "#1A2332",
                color: "#E8C96A",
                border: "1px solid #E8C96A",
              }}
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
              {/* Status line — priority: typing… > online > last seen. The
                  @username line was removed (it leaked the login id). When we
                  have no presence info at all the line is simply omitted
                  rather than falling back to the username. */}
              {otherTyping ? (
                <p className="text-xs" style={{ color: "#10B981" }}>
                  typing…
                </p>
              ) : otherUser.isOnline ? (
                <p className="text-xs" style={{ color: "#10B981" }}>
                  online
                </p>
              ) : otherUser.lastSeenAt ? (
                <p className="text-xs" style={{ color: "#6B7280" }}>
                  last seen {formatLastSeen(otherUser.lastSeenAt)}
                </p>
              ) : null}
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
        className="flex-1 min-h-0 p-2 sm:p-4"
        style={{
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          WebkitOverflowScrolling: "touch",
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
              currentUserId={currentUserId}
              onReact={handleReactMessage}
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
