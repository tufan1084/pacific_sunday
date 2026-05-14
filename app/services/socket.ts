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

export const onMessagesRead = (callback: (data: any) => void) => {
  socket?.on("messages_read", callback);
};

export const onUserOnline = (callback: (data: { userId: number; isOnline: boolean }) => void) => {
  socket?.on("user:online", callback);
};

export const onTyping = (callback: (data: { conversationId: number; userId: number; isTyping: boolean }) => void) => {
  socket?.on("chat:typing", callback);
};

export const offNewMessage = () => {
  socket?.off("new_message");
};

export const offMessageDeleted = () => {
  socket?.off("message_deleted");
};

export const offMessageReaction = () => {
  socket?.off("message_reaction");
};

export const offMessagesRead = () => {
  socket?.off("messages_read");
};

export const offUserOnline = () => {
  socket?.off("user:online");
};

export const offTyping = () => {
  socket?.off("chat:typing");
};
