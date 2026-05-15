"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// Layout effect on the client (measure before paint → no flicker), plain
// effect on the server where layout effects are no-ops.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface Props {
  isOpen: boolean;
  isOwn: boolean;
  canEdit: boolean; // own + text + within edit window
  onClose: () => void;
  onReply: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  // Anchor side — own messages align right, others align left, matching the
  // bubble side they sit next to.
  side: "left" | "right";
}

// Tiny inline SVG icons. Inlined rather than imported to keep this menu
// self-contained and tree-shakable.
const I = {
  reply: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  ),
  copy: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
};

export default function MessageActionMenu({
  isOpen, isOwn, canEdit, onClose,
  onReply, onCopy, onEdit, onDeleteForMe, onDeleteForEveryone, side,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  // Vertical flip only (top ↔ bottom): open downward by default, but if the
  // menu would be clipped below and there's more room above the trigger,
  // open upward instead. Horizontal side is left untouched.
  const [placeUp, setPlaceUp] = useState(false);

  useIsoLayoutEffect(() => {
    if (!isOpen) { setPlaceUp(false); return; }
    const el = ref.current;
    const anchor = el?.parentElement; // the relative wrapper around the trigger
    if (!el || !anchor) return;
    const a = anchor.getBoundingClientRect();
    const menuH = el.offsetHeight;
    const margin = 8;
    const spaceBelow = window.innerHeight - a.bottom;
    const spaceAbove = a.top;
    // Flip up only when it doesn't fit below *and* there's more room above.
    setPlaceUp(menuH + margin > spaceBelow && spaceAbove > spaceBelow);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const itemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    padding: "8px 14px",
    background: "transparent",
    border: "none",
    color: "#E8E8E8",
    fontSize: "13px",
    cursor: "pointer",
    textAlign: "left",
  };

  const dangerItemStyle: React.CSSProperties = {
    ...itemStyle,
    color: "#EF4444",
  };

  // Wrap every handler so the menu closes after the action runs — saves the
  // caller from calling onClose() in five separate places.
  const wrap = (fn: () => void) => () => { fn(); onClose(); };

  return (
    <div
      ref={ref}
      className="absolute z-50 rounded-lg shadow-xl"
      style={{
        ...(placeUp
          ? { bottom: "100%", marginBottom: "4px" }
          : { top: "100%", marginTop: "4px" }),
        [side === "right" ? "right" : "left"]: 0,
        minWidth: "180px",
        background: "#1A2332",
        border: "1px solid rgba(232, 201, 106, 0.2)",
        padding: "4px 0",
      }}
    >
      <button style={itemStyle} onClick={wrap(onReply)} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(232,201,106,0.08)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
        {I.reply}<span>Reply</span>
      </button>
      <button style={itemStyle} onClick={wrap(onCopy)} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(232,201,106,0.08)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
        {I.copy}<span>Copy</span>
      </button>
      {canEdit && (
        <button style={itemStyle} onClick={wrap(onEdit)} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(232,201,106,0.08)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
          {I.edit}<span>Edit</span>
        </button>
      )}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "4px 0" }} />
      <button style={dangerItemStyle} onClick={wrap(onDeleteForMe)} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
        {I.trash}<span>Delete for me</span>
      </button>
      {isOwn && (
        <button style={dangerItemStyle} onClick={wrap(onDeleteForEveryone)} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
          {I.trash}<span>Delete for everyone</span>
        </button>
      )}
    </div>
  );
}
