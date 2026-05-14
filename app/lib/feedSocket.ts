// Shared community-feed socket.
//
// Before: every PostCard called `io(SOCKET_URL)` in a useEffect, so a screen
// with 30 posts opened 30 Socket instances. On iOS Safari that consistently
// caused main-thread stalls when any one of them emitted (every Socket has
// its own buffered packet queue + event dispatch).
//
// Now: one Socket for the whole tab. Components register and unregister
// listeners through `subscribe()`. A ref count keeps the connection open
// while any consumer is mounted and tears it down when the last one
// unmounts.

import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "./constants";

let socket: Socket | null = null;
let refCount = 0;

function ensureSocket(): Socket {
  if (socket) return socket;
  socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    reconnection: true,
  });
  return socket;
}

/**
 * Subscribe to a feed event. Returns an unsubscribe function that also
 * decrements the connection ref-count.
 */
export function subscribeFeed<T = any>(
  event: string,
  handler: (payload: T) => void,
): () => void {
  refCount += 1;
  const s = ensureSocket();
  s.on(event, handler as any);

  let released = false;
  return () => {
    if (released) return;
    released = true;
    s.off(event, handler as any);
    refCount -= 1;
    if (refCount <= 0) {
      refCount = 0;
      s.disconnect();
      socket = null;
    }
  };
}

/** Get the shared socket if any, without opening one. */
export function getFeedSocket(): Socket | null {
  return socket;
}
