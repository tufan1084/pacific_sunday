import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initializeSocket = (userId: number) => {
  if (socket?.connected) return socket;

  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
    socket?.emit("user:identify", { userId });
    socket?.emit("chat:online", { userId });
  });

  // Global auto-ACK: the moment any new_message lands on this socket, tell the
  // server it was delivered. This is the trigger that flips the sender's tick
  // from single grey (SENT) to double grey (DELIVERED). It must be on the
  // socket itself (not in a component) so it fires regardless of which page
  // the user is on, including the chat-icon dropdown.
  socket.on("new_message", (message: any) => {
    if (message?.id && message?.senderId !== userId) {
      socket?.emit("chat:message_received", { messageId: message.id });
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error("Socket not initialized. Call initializeSocket first.");
  }
  return socket;
};

export const disconnectSocket = (userId: number) => {
  if (socket) {
    socket.emit("chat:offline", { userId });
    socket.disconnect();
    socket = null;
  }
};

// Chat-specific socket functions
export const joinConversation = (conversationId: number) => {
  socket?.emit("chat:join", { conversationId });
};

export const leaveConversation = (conversationId: number) => {
  socket?.emit("chat:leave", { conversationId });
};

export const emitTyping = (conversationId: number, userId: number, isTyping: boolean) => {
  socket?.emit("chat:typing", { conversationId, userId, isTyping });
};

export const onNewMessage = (callback: (message: any) => void) => {
  socket?.on("new_message", callback);
};

export const onMessageDeleted = (callback: (data: any) => void) => {
  socket?.on("message_deleted", callback);
};

export const onMessageReaction = (callback: (data: any) => void) => {
  socket?.on("message_reaction", callback);
};

export const onMessageEdited = (callback: (data: any) => void) => {
  socket?.on("message_edited", callback);
};

export const onMessagesRead = (callback: (data: any) => void) => {
  socket?.on("messages_read", callback);
};

// Sender-side: recipient's delivery state changed for one message.
// Payload: { messageId, conversationId, userId, status: 'delivered' | 'read' }
export const onMessageStatus = (callback: (data: any) => void) => {
  socket?.on("message_status", callback);
};

// Sender-side: batched version emitted on reconnect-flush and on read receipts.
// Payload: { messageIds, userId, conversationId?, status: 'delivered' | 'read' }
export const onMessageStatusBulk = (callback: (data: any) => void) => {
  socket?.on("message_status_bulk", callback);
};

export const onUserOnline = (callback: (data: { userId: number; isOnline: boolean }) => void) => {
  socket?.on("user:online", callback);
};

// New presence event — includes lastSeenAt so the UI can show "last seen 2m ago".
export const onUserPresence = (
  callback: (data: { userId: number; isOnline: boolean; lastSeenAt: string | null }) => void
) => {
  socket?.on("user:presence", callback);
};

export const onTyping = (callback: (data: { conversationId: number; userId: number; isTyping: boolean }) => void) => {
  socket?.on("chat:typing", callback);
};

// All off* helpers accept an optional callback so component cleanup removes
// only its own listener — this prevents components from accidentally wiping
// the global auto-ACK handler registered inside initializeSocket().
export const offNewMessage = (cb?: (message: any) => void) => {
  cb ? socket?.off("new_message", cb) : socket?.off("new_message");
};

export const offMessageDeleted = (cb?: (data: any) => void) => {
  cb ? socket?.off("message_deleted", cb) : socket?.off("message_deleted");
};

export const offMessageReaction = (cb?: (data: any) => void) => {
  cb ? socket?.off("message_reaction", cb) : socket?.off("message_reaction");
};

export const offMessageEdited = (cb?: (data: any) => void) => {
  cb ? socket?.off("message_edited", cb) : socket?.off("message_edited");
};

export const offMessagesRead = (cb?: (data: any) => void) => {
  cb ? socket?.off("messages_read", cb) : socket?.off("messages_read");
};

export const offMessageStatus = (cb?: (data: any) => void) => {
  cb ? socket?.off("message_status", cb) : socket?.off("message_status");
};

export const offMessageStatusBulk = (cb?: (data: any) => void) => {
  cb ? socket?.off("message_status_bulk", cb) : socket?.off("message_status_bulk");
};

export const offUserOnline = (cb?: (data: any) => void) => {
  cb ? socket?.off("user:online", cb) : socket?.off("user:online");
};

export const offUserPresence = (cb?: (data: any) => void) => {
  cb ? socket?.off("user:presence", cb) : socket?.off("user:presence");
};

export const offTyping = (cb?: (data: any) => void) => {
  cb ? socket?.off("chat:typing", cb) : socket?.off("chat:typing");
};
