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
      className="flex"
      style={{
        fontFamily: "var(--font-poppins), sans-serif",
        backgroundColor: "#01050D",
        height: "100%",
        maxHeight: "calc(100dvh - 60px)",
        overflow: "hidden"
      }}
    >
      {showList && (
        <div
          className={`${isMobile ? "w-full" : "w-96"} border-r flex-shrink-0 flex flex-col`}
          style={{ borderColor: "rgba(232, 201, 106, 0.15)", backgroundColor: "#0B1120", height: "100%" }}
        >
          <ConversationList
            selectedId={selectedConversationId}
            onSelect={handleSelect}
          />
        </div>
      )}

      {showThread && (
        <div className="flex-1 flex flex-col" style={{ backgroundColor: "#01050D", height: "100%", maxHeight: "100%", overflow: "hidden" }}>
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
