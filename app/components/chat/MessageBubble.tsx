"use client";

import { useEffect, useRef, useState } from "react";
import MessageActionMenu from "./MessageActionMenu";
import ReactionPicker from "./ReactionPicker";

type MessageStatus = "pending" | "sent" | "delivered" | "read" | "failed";

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  // Handlers for the WhatsApp-style action menu. Edit/delete-for-everyone are
  // gated to own messages by the menu itself, so the parent can pass these
  // unconditionally.
  onReply?: (message: any) => void;
  onEdit?: (messageId: number, newContent: string) => void | Promise<void>;
  onDeleteForMe?: (messageId: number) => void | Promise<void>;
  onDeleteForEveryone?: (messageId: number) => void | Promise<void>;
}

// Edit window matches the backend's enforcement so the menu doesn't tease an
// option the server will reject.
const EDIT_WINDOW_MS = 15 * 60 * 1000;

function StatusIcon({ status, isOwn, errorMessage }: { status: MessageStatus; isOwn: boolean; errorMessage?: string }) {
  if (!isOwn) return null;

  const baseColor = "rgba(1, 5, 13, 0.5)";
  const blueColor = "#4A9EFF";
  const redColor = "#EF4444";

  if (status === "failed") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ color: redColor }}>
        <title>{errorMessage || "Failed to send"}</title>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  }

  if (status === "pending") {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: baseColor }}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    );
  }

  if (status === "sent") {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: baseColor }}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }

  const color = status === "read" ? blueColor : baseColor;
  return (
    <div className="relative" style={{ width: "16px", height: "12px" }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color, position: "absolute", left: 0 }}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color, position: "absolute", left: "5px" }}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
}

export default function MessageBubble({ message, isOwn, onReply, onEdit, onDeleteForMe, onDeleteForEveryone }: MessageBubbleProps) {
  const [hover, setHover] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || "");
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  const isDeleted = !!message.deletedAt;
  const isEdited = !!message.editedAt;
  // Edit is allowed for own text messages within the window.
  const canEdit =
    isOwn &&
    !isDeleted &&
    message.messageType === "TEXT" &&
    typeof message.id === "number" &&
    message.id > 0 && // not an optimistic temp message
    Date.now() - new Date(message.createdAt).getTime() < EDIT_WINDOW_MS;

  useEffect(() => {
    if (isEditing) {
      setEditContent(message.content || "");
      requestAnimationFrame(() => {
        const ta = editInputRef.current;
        if (!ta) return;
        ta.focus();
        // Size the textarea to the existing content on open so long messages
        // get a tall edit box right away instead of scrolling inside 4 rows.
        ta.style.height = "auto";
        ta.style.height = Math.min(ta.scrollHeight, 220) + "px";
        // Put the caret at the end of the existing text, not the start.
        const end = ta.value.length;
        ta.setSelectionRange(end, end);
      });
    }
  }, [isEditing, message.content]);

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  const handleReact = async (emoji: string) => {
    try {
      const token = localStorage.getItem("ps_token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/messages/${message.id}/react`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
    } catch (error) {
      console.error("Error reacting to message:", error);
    }
  };

  const handleCopy = () => {
    if (message.content) navigator.clipboard?.writeText(message.content).catch(() => {});
  };

  const submitEdit = async () => {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === message.content) {
      setIsEditing(false);
      return;
    }
    await onEdit?.(message.id, trimmed);
    setIsEditing(false);
  };

  // Tombstone — bubble for a "deleted for everyone" message. Same alignment
  // (own vs other) but muted styling and no actions.
  if (isDeleted) {
    return (
      <div className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"} relative`}>
        {!isOwn && <div className="w-7 h-7 flex-shrink-0" />}
        <div className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
          <div
            className={`rounded-2xl px-3 py-2 ${isOwn ? "rounded-tr-sm" : "rounded-tl-sm"}`}
            style={{
              backgroundColor: "#1A2332",
              border: "1px dashed rgba(232, 201, 106, 0.18)",
              color: "#6B7280",
            }}
          >
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
              <p className="text-sm italic">
                {isOwn ? "You deleted this message" : "This message was deleted"}
              </p>
              <span className="text-[10px]" style={{ color: "rgba(139,154,175,0.6)" }}>
                {formatTime(message.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const menuSide = isOwn ? "right" : "left";

  return (
    <div
      className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"} group relative`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); }}
    >
      {/* Avatar (only for other user) */}
      {!isOwn && (
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold flex-shrink-0 overflow-hidden"
          style={{ backgroundColor: "#1A2332", color: "#E8C96A" }}
        >
          {message.sender?.profile?.golfPassport?.photoUrl ? (
            <img
              src={message.sender.profile.golfPassport.photoUrl}
              alt={message.sender.username}
              className="w-full h-full object-cover"
            />
          ) : (
            (message.sender?.profile?.name || message.sender?.username || "?").charAt(0).toUpperCase()
          )}
        </div>
      )}

      {/* Message Content column. min-w-0 lets the flex chain honour the
          max-w cap — without it a single very long token (URL, run-on word)
          would expand the column to its min-content width and break out of
          the chat area. Edit mode widens the cap so the inline editor has
          comfortable room to type. */}
      <div className={`flex flex-col ${isEditing ? "max-w-[90%]" : "max-w-[70%]"} min-w-0 ${isOwn ? "items-end" : "items-start"} relative`}>
        {/* Reply preview */}
        {message.replyTo && (
          <div
            className="text-xs px-2.5 py-1.5 rounded-lg mb-1 border-l-2"
            style={{
              backgroundColor: isOwn ? "rgba(232, 201, 106, 0.08)" : "#1A2332",
              borderColor: "#E8C96A",
              color: "#6B7280",
            }}
          >
            <span className="font-semibold text-xs" style={{ color: "#E8C96A" }}>
              {message.replyTo.sender?.profile?.name || message.replyTo.sender?.username || "user"}
            </span>
            <p className="truncate text-xs mt-0.5">
              {message.replyTo.messageType === "IMAGE"
                ? "📷 Photo"
                : message.replyTo.messageType === "VIDEO"
                ? "🎥 Video"
                : message.replyTo.content}
            </p>
          </div>
        )}

        {/* Bubble */}
        <div
          className={`rounded-2xl px-3 py-2 relative ${isOwn ? "rounded-tr-sm" : "rounded-tl-sm"}`}
          style={{
            backgroundColor: isOwn ? "#E8C96A" : "#1A2332",
            color: isOwn ? "#01050D" : "#E8E8E8",
            minWidth: isEditing ? "340px" : undefined,
            width: isEditing ? "100%" : undefined,
          }}
        >
          {/* Media */}
          {!isEditing && message.mediaUrls && message.mediaUrls.length > 0 && (
            <div className="mb-2 space-y-2">
              {message.mediaUrls.map((url: string, idx: number) => (
                <div key={idx} className="rounded-lg overflow-hidden">
                  {message.messageType === "IMAGE" || url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img src={url} alt="Shared image" className="max-w-full h-auto rounded-lg" style={{ maxHeight: "280px" }} />
                  ) : (
                    <video src={url} controls className="max-w-full h-auto rounded-lg" style={{ maxHeight: "280px" }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Edit-mode textarea — replaces the text/content area in place. */}
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                ref={editInputRef}
                value={editContent}
                onChange={(e) => {
                  setEditContent(e.target.value);
                  // Auto-grow up to a 220px cap — same idea as the main
                  // composer. Reset to "auto" first so the height shrinks
                  // when the user deletes lines, not just grows.
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 220) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitEdit(); }
                  if (e.key === "Escape") setIsEditing(false);
                }}
                rows={4}
                className="text-sm rounded-lg p-2.5 outline-none resize-none w-full"
                style={{
                  backgroundColor: "rgba(0,0,0,0.18)",
                  color: isOwn ? "#01050D" : "#E8E8E8",
                  minHeight: "84px",
                  maxHeight: "220px",
                  lineHeight: "20px",
                }}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-xs px-2 py-1 rounded"
                  style={{ background: "transparent", color: isOwn ? "rgba(1,5,13,0.7)" : "#8B9AAF" }}
                >
                  Cancel
                </button>
                <button
                  onClick={submitEdit}
                  className="text-xs px-2 py-1 rounded font-semibold"
                  style={{ background: isOwn ? "#01050D" : "#E8C96A", color: isOwn ? "#E8C96A" : "#01050D" }}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Text + inline time/status for short messages */}
              {message.content && (
                <div className="flex items-end gap-2 min-w-0">
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap flex-1 min-w-0"
                    // `overflowWrap: anywhere` forces a break mid-token when
                    // there's no other choice (long URL, run-on string).
                    // Tailwind's `break-words` (= overflow-wrap: break-word)
                    // only breaks at word boundaries, which leaves long
                    // unbroken strings overflowing the bubble.
                    style={{ overflowWrap: "anywhere" }}
                  >
                    {message.content}
                  </p>
                  {message.content.length <= 35 && (
                    <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
                      {isEdited && (
                        <span className="text-[10px] italic" style={{ color: isOwn ? "rgba(1, 5, 13, 0.45)" : "rgba(139, 154, 175, 0.6)" }}>
                          edited
                        </span>
                      )}
                      <span className="text-[10px] whitespace-nowrap" style={{ color: isOwn ? "rgba(1, 5, 13, 0.5)" : "rgba(139, 154, 175, 0.7)" }}>
                        {formatTime(message.createdAt)}
                      </span>
                      <StatusIcon status={message.status || "sent"} isOwn={isOwn} errorMessage={message.errorMessage} />
                    </div>
                  )}
                </div>
              )}

              {(!message.content || message.content.length > 35) && (
                <div className="flex items-center gap-1 mt-1 justify-end">
                  {isEdited && (
                    <span className="text-[10px] italic" style={{ color: isOwn ? "rgba(1, 5, 13, 0.45)" : "rgba(139, 154, 175, 0.6)" }}>
                      edited
                    </span>
                  )}
                  <span className="text-[10px]" style={{ color: isOwn ? "rgba(1, 5, 13, 0.5)" : "rgba(139, 154, 175, 0.7)" }}>
                    {formatTime(message.createdAt)}
                  </span>
                  <StatusIcon status={message.status || "sent"} isOwn={isOwn} errorMessage={message.errorMessage} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Reactions chip */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex gap-1 mt-1 px-2 py-0.5 rounded-full text-sm" style={{ backgroundColor: "#1A2332" }}>
            {message.reactions.map((reaction: any) => (
              <span key={reaction.id} className="text-xs">{reaction.emoji}</span>
            ))}
          </div>
        )}

        {/* Action triggers — only when hovering, not in edit mode. A smiley
            opens the reaction picker; the chevron opens the action menu.
            The pickers are siblings (not children) of their trigger buttons:
            nesting a <button> inside a <button> is invalid HTML and triggers
            React's hydration error. */}
        {!isEditing && (hover || showMenu || showReactions) && (
          <div
            className="absolute flex gap-1"
            style={{
              top: "-6px",
              [isOwn ? "left" : "right"]: "-46px",
              zIndex: 5,
            }}
          >
            <div style={{ position: "relative" }}>
              <button
                onClick={() => { setShowReactions((v) => !v); setShowMenu(false); }}
                aria-label="Add reaction"
                style={{
                  width: "26px", height: "26px",
                  borderRadius: "50%",
                  background: "#1A2332",
                  border: "1px solid rgba(232, 201, 106, 0.2)",
                  color: "#E8C96A",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px",
                }}
              >
                😊
              </button>
              <ReactionPicker
                isOpen={showReactions}
                onClose={() => setShowReactions(false)}
                onPick={handleReact}
                side={menuSide}
              />
            </div>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => { setShowMenu((v) => !v); setShowReactions(false); }}
                aria-label="More actions"
                style={{
                  width: "26px", height: "26px",
                  borderRadius: "50%",
                  background: "#1A2332",
                  border: "1px solid rgba(232, 201, 106, 0.2)",
                  color: "#E8C96A",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>
              <MessageActionMenu
                isOpen={showMenu}
                isOwn={isOwn}
                canEdit={canEdit}
                onClose={() => setShowMenu(false)}
                onReply={() => onReply?.(message)}
                onCopy={handleCopy}
                onEdit={() => setIsEditing(true)}
                onDeleteForMe={() => onDeleteForMe?.(message.id)}
                onDeleteForEveryone={() => onDeleteForEveryone?.(message.id)}
                side={menuSide}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
