"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ConversationList from "./ConversationList";
import ChatThread from "./ChatThread";

export default function MessagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [selectedOtherUser, setSelectedOtherUser] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Lock the document so no browser (Firefox especially — it auto-scrolls
  // focused buttons into view following the spec strictly, Chrome silently
  // skips this) can scroll body/html while the chat page is mounted. Without
  // this, clicking a conversation row in Firefox scrolls the sidebar nav and
  // the chat header off the top of the viewport. We snapshot whatever
  // overflow value was there and restore it on unmount so other pages aren't
  // affected.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  useEffect(() => {
    const convId = searchParams.get("conversation");
    if (convId) {
      setSelectedConversationId(parseInt(convId));
    }
  }, [searchParams]);

  const handleSelect = (id: number, otherUser?: any) => {
    setSelectedConversationId(id);
    if (otherUser) setSelectedOtherUser(otherUser);
    router.replace(`/messages?conversation=${id}`, { scroll: false });
  };

  const handleBack = () => {
    setSelectedConversationId(null);
    setSelectedOtherUser(null);
    router.replace('/messages', { scroll: false });
  };

  const showList = !isMobile || !selectedConversationId;
  const showThread = !isMobile || selectedConversationId;

  return (
    <div
      className="flex min-h-0"
      style={{
        fontFamily: "var(--font-poppins), sans-serif",
        backgroundColor: "#01050D",
        height: "100%",
        overflow: "hidden"
      }}
    >
      {showList && (
        <div
          className={`${isMobile ? "w-full" : "w-96"} border-r flex-shrink-0 flex flex-col min-h-0`}
          style={{
            borderColor: "rgba(232, 201, 106, 0.15)",
            backgroundColor: "#0B1120",
            // Tiled WhatsApp-style doodle. The dark base colour shows through
            // the transparent SVG; the gold strokes are already baked at very
            // low opacity so the texture stays subtle.
            backgroundImage: "url('/data/chat-doodle.svg')",
            backgroundRepeat: "repeat",
            backgroundSize: "320px 320px",
          }}
        >
          <ConversationList
            selectedId={selectedConversationId}
            onSelect={handleSelect}
          />
        </div>
      )}

      {showThread && (
        <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: "#01050D", overflow: "hidden",
          backgroundImage: "url('/data/chat-doodle.svg')",
          backgroundRepeat: "repeat",
          backgroundSize: "320px 320px",
        }}>
          {selectedConversationId ? (
            <ChatThread
              conversationId={selectedConversationId}
              otherUserData={selectedOtherUser}
              onBack={handleBack}
              isMobile={isMobile}
            />
          ) : (
            <div
              className="flex-1 flex items-center justify-center"
              style={{ color: "#6B7280" }}
            >
              <div className="flex flex-col items-center justify-center text-center">
                <div
                  className="w-24 h-24 rounded-full mb-6 flex items-center justify-center"
                  style={{ backgroundColor: "#1A2332" }}
                >
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: "#E8C96A" }}>
                  Select a conversation
                </h3>
                <p className="text-sm">Choose a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
