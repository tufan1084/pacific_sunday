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
  onReact?: (messageId: number, emoji: string) => void | Promise<void>;
  currentUserId?: number | null;
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

export default function MessageBubble({ message, isOwn, onReply, onEdit, onDeleteForMe, onDeleteForEveryone, onReact, currentUserId }: MessageBubbleProps) {
  const [hover, setHover] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || "");
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  const isDeleted = !!message.deletedAt;
  const isEdited = !!message.editedAt;
  const hasMedia = !isDeleted && Array.isArray(message.mediaUrls) && message.mediaUrls.length > 0;
  const hasText = !!message.content;
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

  // Delegates to ChatThread so the reaction is applied optimistically (instant
  // UI) and the socket event reconciles. The old version POSTed here and only
  // updated after the round-trip — that's the lag the user reported.
  const handleReact = (emoji: string) => {
    onReact?.(message.id, emoji);
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
      <div className={`flex ${isOwn ? "flex-row-reverse" : "flex-row"} relative`}>
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

        {/* Bubble. WhatsApp media bubbles have almost no padding (a ~3px
            inset of the bubble colour) and NO border around the image —
            text-only bubbles keep the normal padding. */}
        <div
          className={`relative ${isOwn ? "rounded-tr-sm" : "rounded-tl-sm"} ${
            isEditing ? "rounded-2xl px-3 py-2" : hasMedia ? "rounded-xl p-[3px]" : "rounded-2xl px-3 py-2"
          }`}
          style={{
            backgroundColor: isOwn ? "#E8C96A" : "#1A2332",
            color: isOwn ? "#01050D" : "#E8E8E8",
            minWidth: isEditing ? "340px" : undefined,
            width: isEditing ? "100%" : undefined,
          }}
        >
          {/* Media. When there's a caption the image's BOTTOM corners are flat
              so it merges into the caption block (WhatsApp behaviour) — only
              the top corners are rounded. Media-only rounds all four. The
              radius (~9px) ≈ bubble radius (12px) minus the 3px inset so the
              curves line up. */}
          {!isEditing && hasMedia && (
            <div className={`space-y-1 overflow-hidden ${hasText ? "rounded-t-[9px]" : "rounded-[9px]"}`}>
              {message.mediaUrls.map((url: string, idx: number) => (
                <div
                  key={idx}
                  className={`overflow-hidden ${hasText ? "rounded-t-[9px]" : "rounded-[9px]"}`}
                >
                  {message.messageType === "IMAGE" || url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img
                      src={url}
                      alt="Shared image"
                      className="block w-full h-auto"
                      style={{ maxHeight: "320px", objectFit: "cover" }}
                    />
                  ) : (
                    <video
                      src={url}
                      controls
                      className="block w-full h-auto"
                      style={{ maxHeight: "320px" }}
                    />
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
            // When media is present the bubble has only 3px padding, so the
            // caption / time row needs its own inset. Text-only bubbles
            // already get px-3 py-2 from the bubble itself.
            <div className={hasMedia ? (hasText ? "px-2 pt-1 pb-0.5" : "px-1.5 pb-0.5") : ""}>
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
            </div>
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
              // Sit beside the bubble, vertically centred, on the side that
              // faces the chat centre (left of own messages, right of
              // others) — not floating over the top corner. The message row
              // is full-width, so this empty inner area is always within the
              // hover surface and never clips off-screen the way the old
              // outer-edge placement did.
              top: "50%",
              transform: "translateY(-50%)",
              [isOwn ? "right" : "left"]: "100%",
              [isOwn ? "marginRight" : "marginLeft"]: "8px",
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
