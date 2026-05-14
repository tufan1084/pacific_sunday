"use client";

import { useState, useRef } from "react";
import { FiMoreHorizontal, FiEdit2, FiTrash2, FiCamera } from "react-icons/fi";
import { IoImageOutline } from "react-icons/io5";
import { resolveMediaUrl } from "@/app/lib/constants";
import EditableInput from "../ui/EditableInput";

interface CommentItemProps {
  comment: any;
  currentUserId: number;
  isOwner: boolean;
  replyingTo: number | null;
  replyText: string;
  submittingComment: boolean;
  editingCommentId: number | null;
  editText: string;
  savingEdit: boolean;
  openCommentMenuId: number | null;
  onReplyClick: (commentId: number) => void;
  onReplySubmit: (parentId: number) => void;
  onReplyCancel: () => void;
  onReplyTextChange: (text: string) => void;
  onEditStart: (id: number, content: string) => void;
  onEditSave: (id: number) => void;
  onEditCancel: () => void;
  onEditTextChange: (text: string) => void;
  onMenuToggle: (id: number | null) => void;
  onDeleteRequest: (id: number, isReply: boolean, parentId?: number) => void;
  depth?: number;
  replyMedia?: File | null;
  replyMediaPreview?: string | null;
  onReplyMediaSelect?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReplyMediaRemove?: () => void;
  onReplyPaste?: (e: React.ClipboardEvent) => void;
  onReplyImagePaste?: (file: File) => void;
  onReplyGifInsert?: (file: File) => void;
}

function getTimeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function CommentItem({
  comment,
  currentUserId,
  isOwner,
  replyingTo,
  replyText,
  submittingComment,
  editingCommentId,
  editText,
  savingEdit,
  openCommentMenuId,
  onReplyClick,
  onReplySubmit,
  onReplyCancel,
  onReplyTextChange,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditTextChange,
  onMenuToggle,
  onDeleteRequest,
  depth = 0,
  replyMedia,
  replyMediaPreview,
  onReplyMediaSelect,
  onReplyMediaRemove,
  onReplyPaste,
  onReplyImagePaste,
  onReplyGifInsert,
}: CommentItemProps) {
  const avatarSize = Math.max(28 - depth * 2, 18);
  const fontSize = Math.max(14 - depth * 0.5, 11);
  const [showReplies, setShowReplies] = useState(false);
  const [showMediaSheet, setShowMediaSheet] = useState(false);
  const replyFileInputRef = useRef<HTMLInputElement>(null);
  const replyCameraInputRef = useRef<HTMLInputElement>(null);
  const isMobile = typeof window !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  const openReplyCamera = () => {
    setShowMediaSheet(false);
    if (isMobile) {
      replyCameraInputRef.current?.click();
    } else {
      replyFileInputRef.current?.click();
    }
  };

  return (
    <div style={{ marginBottom: "10px" }}>
      <div className="flex items-start gap-2">
        <div style={{ width: `${avatarSize}px`, height: `${avatarSize}px`, borderRadius: "4px", backgroundColor: "#060D1F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: `${fontSize - 3}px`, fontWeight: 700, color: "#E8C96A", flexShrink: 0, overflow: "hidden" }}>
          {comment.user?.profile?.golfPassport?.photoUrl ? (
            <img src={resolveMediaUrl(comment.user.profile.golfPassport.photoUrl)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            (comment.user?.profile?.name || comment.user?.username || "U").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-start" style={{ gap: "8px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ marginBottom: "4px" }}>
                <span style={{ color: "#E8C96A", fontSize: `${fontSize}px`, fontWeight: 600, display: "block", lineHeight: "1.2" }}>
                  {comment.user?.profile?.name || comment.user?.username || "Unknown"}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: "#888888", fontSize: `${fontSize - 2}px`, lineHeight: "1.2" }}>
                    @{comment.user?.username || "unknown"}
                  </span>
                  <span style={{ color: "#888888", fontSize: `${fontSize - 2}px` }}>
                    · {getTimeAgo(comment.createdAt)}
                    {comment.updatedAt && comment.updatedAt !== comment.createdAt && <span style={{ fontStyle: "italic" }}> · edited</span>}
                  </span>
                </div>
              </div>
              {editingCommentId === comment.id ? (
                <div className="flex items-start" style={{ gap: "4px", marginBottom: "4px", flexWrap: "wrap" }}>
                  <textarea
                    value={editText}
                    onChange={(e) => onEditTextChange(e.target.value)}
                    autoFocus
                    rows={2}
                    onKeyDown={(e) => { if (e.key === "Escape") onEditCancel(); }}
                    style={{ flex: "1 1 160px", minWidth: 0, backgroundColor: "#060D1F", border: "1px solid #1E2A47", borderRadius: "4px", padding: "5px 7px", color: "#FFFFFF", fontSize: `${fontSize}px`, fontFamily: "inherit", outline: "none", resize: "vertical", minHeight: "44px", maxHeight: "180px", lineHeight: "1.4" }}
                  />
                  <button onClick={() => onEditSave(comment.id)} disabled={savingEdit || !editText.trim()} style={{ backgroundColor: "#E8C96A", color: "#060D1F", border: "none", borderRadius: "4px", padding: "4px 9px", fontSize: `${fontSize - 1}px`, fontWeight: 600, cursor: savingEdit || !editText.trim() ? "not-allowed" : "pointer", opacity: savingEdit || !editText.trim() ? 0.5 : 1, flexShrink: 0 }}>
                    Save
                  </button>
                  <button onClick={onEditCancel} style={{ background: "transparent", color: "#888", border: "1px solid #1E2A47", borderRadius: "4px", padding: "4px 9px", fontSize: `${fontSize - 1}px`, cursor: "pointer", flexShrink: 0 }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <p style={{ color: "#FFFFFF", fontSize: `${fontSize}px`, lineHeight: "1.4", marginBottom: "4px", wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
                    {comment.content}
                  </p>
                  {comment.mediaUrl && (
                    <img src={comment.mediaUrl.startsWith("http") ? comment.mediaUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}${comment.mediaUrl}`} alt="" style={{ maxWidth: "200px", maxHeight: "150px", borderRadius: "8px", marginBottom: "6px", display: "block" }} />
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button onClick={() => onReplyClick(comment.id)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#E8C96A", fontSize: `${fontSize - 1}px` }}>
                      Reply
                    </button>
                  </div>
                </>
              )}
            </div>
            {(comment.user?.id === currentUserId || isOwner) && editingCommentId !== comment.id && (
              <div style={{ position: "relative", flexShrink: 0 }}>
                <button
                  onClick={() => onMenuToggle(openCommentMenuId === comment.id ? null : comment.id)}
                  aria-label="Comment actions"
                  style={{ background: "none", border: "none", padding: "2px 4px", cursor: "pointer", color: "rgba(255,255,255,0.5)", borderRadius: "4px" }}
                >
                  <FiMoreHorizontal size={14} />
                </button>
                {openCommentMenuId === comment.id && (
                  <div
                    onMouseLeave={() => onMenuToggle(null)}
                    style={{
                      position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 20,
                      backgroundColor: "#060D1F", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "5px", minWidth: "120px",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.5)", overflow: "hidden",
                    }}
                  >
                    {comment.user?.id === currentUserId && (
                      <button
                        onClick={() => onEditStart(comment.id, comment.content)}
                        className="flex items-center"
                        style={{ gap: "8px", width: "100%", padding: "8px 12px", background: "none", border: "none", color: "#FFF", fontSize: `${fontSize}px`, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
                      >
                        <FiEdit2 size={12} color="#E8C96A" /><span>Edit</span>
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteRequest(comment.id, depth > 0, comment.parentId)}
                      className="flex items-center"
                      style={{ gap: "8px", width: "100%", padding: "8px 12px", background: "none", border: "none", color: "#F87171", fontSize: `${fontSize}px`, cursor: "pointer", fontFamily: "inherit", textAlign: "left", borderTop: comment.user?.id === currentUserId ? "1px solid rgba(255,255,255,0.06)" : "none" }}
                    >
                      <FiTrash2 size={12} /><span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {replyingTo === comment.id && (
            <div style={{ marginTop: "8px" }}>
              {replyMediaPreview && (
                <div style={{ marginBottom: "8px", position: "relative", display: "inline-block" }}>
                  <img src={replyMediaPreview} alt="Preview" style={{ maxWidth: "150px", maxHeight: "100px", borderRadius: "6px" }} />
                  <button onClick={onReplyMediaRemove} style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", width: "18px", height: "18px", color: "#fff", cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    ✕
                  </button>
                </div>
              )}
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <EditableInput
                    value={replyText}
                    onChange={onReplyTextChange}
                    onImagePaste={onReplyImagePaste}
                    onGifInsert={onReplyGifInsert ?? onReplyImagePaste}
                    onEnter={() => onReplySubmit(comment.id)}
                    placeholder="Write a reply..."
                    ariaLabel="Write a reply"
                    autoFocus
                    style={{
                      width: "100%", backgroundColor: "#060D1F",
                      border: "1px solid #1E2A47", borderRadius: "18px",
                      padding: "9px 40px 9px 14px",
                      color: "#FFFFFF", fontSize: "16px",
                      fontFamily: "inherit",
                      minHeight: "38px", maxHeight: "180px",
                      lineHeight: "1.4",
                      overflowY: "auto",
                    }}
                  />
                  {onReplyMediaSelect && (
                    <>
                      <input type="file" accept="image/*,image/gif" onChange={onReplyMediaSelect} style={{ display: "none" }} ref={replyFileInputRef} />
                      <input type="file" accept="image/*" capture="environment" onChange={onReplyMediaSelect} style={{ position: "absolute", width: "1px", height: "1px", opacity: 0, pointerEvents: "none", overflow: "hidden", clip: "rect(0,0,0,0)" }} ref={replyCameraInputRef} />
                      <button
                        type="button"
                        onClick={() => setShowMediaSheet(true)}
                        style={{ position: "absolute", right: "12px", top: "10px", cursor: "pointer", display: "flex", alignItems: "center", color: "#E8C96A", background: "none", border: "none", padding: 0 }}
                      >
                        <IoImageOutline size={16} />
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => onReplySubmit(comment.id)}
                  disabled={submittingComment || (!replyText.trim() && !replyMedia)}
                  style={{
                    backgroundColor: "#E8C96A", color: "#060D1F",
                    border: "none", borderRadius: "999px",
                    width: "28px", height: "28px",
                    cursor: submittingComment || (!replyText.trim() && !replyMedia) ? "not-allowed" : "pointer",
                    opacity: submittingComment || (!replyText.trim() && !replyMedia) ? 0.5 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
                  aria-label="Send reply"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
                <button
                  onClick={onReplyCancel}
                  style={{
                    backgroundColor: "transparent",
                    color: "#888888",
                    border: "none",
                    borderRadius: "999px",
                    width: "28px",
                    height: "28px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: "16px",
                  }}
                  aria-label="Cancel reply"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Reply media sheet */}
          {showMediaSheet && (
            <div onClick={() => setShowMediaSheet(false)} style={{ position: "fixed", inset: 0, zIndex: 10000, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
              <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "420px", backgroundColor: "#13192A", borderRadius: "14px", padding: "8px", fontFamily: "var(--font-poppins), sans-serif" }}>
                <button type="button" onClick={openReplyCamera} style={{ width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", background: "none", border: "none", borderRadius: "10px", color: "#fff", fontSize: "15px", cursor: "pointer", fontFamily: "inherit" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                  <FiCamera size={20} color="#E8C96A" />Take Photo
                </button>
                <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.07)", margin: "0 16px" }} />
                <button type="button" onClick={() => { setShowMediaSheet(false); replyFileInputRef.current?.click(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", background: "none", border: "none", borderRadius: "10px", color: "#fff", fontSize: "15px", cursor: "pointer", fontFamily: "inherit" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>Choose from Gallery
                </button>
                <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.07)", margin: "0 16px" }} />
                <button type="button" onClick={() => setShowMediaSheet(false)} style={{ width: "100%", padding: "14px 16px", background: "none", border: "none", borderRadius: "10px", color: "#94A3B8", fontSize: "15px", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Replies render BELOW the parent row (not inside its content column).
          Each level adds a small fixed indent + a vertical threading line, so
          the parent-child relationship is visible but the avatar/content widths
          don't compound recursively. Indent budget per level: ~28px regardless
          of depth — five levels deep still leaves plenty of content width on a
          430px mobile viewport. */}
      {comment.replies && comment.replies.length > 0 && (
        <div style={{ marginTop: "8px", marginLeft: "16px", borderLeft: "1px solid #1E2A47", paddingLeft: "10px" }}>
          <button onClick={() => setShowReplies(!showReplies)} style={{ background: "none", border: "none", padding: "4px 0", cursor: "pointer", color: "#888888", fontSize: `${fontSize - 1}px`, marginBottom: showReplies ? "8px" : "0" }}>
            {showReplies ? "Hide" : "View"} {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
          </button>
          {showReplies && (
            <div>
              {comment.replies.map((reply: any) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  isOwner={isOwner}
                  replyingTo={replyingTo}
                  replyText={replyText}
                  submittingComment={submittingComment}
                  editingCommentId={editingCommentId}
                  editText={editText}
                  savingEdit={savingEdit}
                  openCommentMenuId={openCommentMenuId}
                  onReplyClick={onReplyClick}
                  onReplySubmit={onReplySubmit}
                  onReplyCancel={onReplyCancel}
                  onReplyTextChange={onReplyTextChange}
                  onEditStart={onEditStart}
                  onEditSave={onEditSave}
                  onEditCancel={onEditCancel}
                  onEditTextChange={onEditTextChange}
                  onMenuToggle={onMenuToggle}
                  onDeleteRequest={onDeleteRequest}
                  depth={depth + 1}
                  replyMedia={replyMedia}
                  replyMediaPreview={replyMediaPreview}
                  onReplyMediaSelect={onReplyMediaSelect}
                  onReplyMediaRemove={onReplyMediaRemove}
                  onReplyPaste={onReplyPaste}
                  onReplyImagePaste={onReplyImagePaste}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}




