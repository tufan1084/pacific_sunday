"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPick: (emoji: string) => void;
  side: "left" | "right";
}

const QUICK_EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🙏", "🔥", "👏"];

// Expanded set the user can scroll through after tapping "+". Curated to the
// common-reaction subset of the full emoji picker so it stays compact.
const EXPANDED_EMOJIS = [
  "❤️","🧡","💛","💚","💙","💜","🖤","🤍",
  "👍","👎","👌","✌️","🤞","🤟","🤘","🙏",
  "👏","💪","🤝","🫶","🙌","🤲","✋","🤚",
  "😀","😃","😄","😁","😆","😅","😂","🤣",
  "😊","😇","🙂","🙃","😉","😌","😍","🥰",
  "😘","😗","😙","😚","😋","😛","😝","😜",
  "🤪","🤨","🧐","🤓","😎","🥳","🤩","🥺",
  "😢","😭","😤","😠","😡","🤬","🤯","😳",
  "🥵","🥶","😱","😨","😰","😥","😓","🤗",
  "🤔","🤭","🤫","🤥","😶","😐","😑","😬",
  "🙄","😯","😦","😧","😮","😲","🥱","😴",
  "🤤","😪","😵","🤐","🥴","🤢","🤮","🤧",
  "😷","🤒","🤕","💀","👻","👽","🤖","💩",
  "🔥","💯","💢","💥","💫","💦","💨","✨",
];

export default function ReactionPicker({ isOpen, onClose, onPick, side }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!isOpen) { setExpanded(false); return; }
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

  const pick = (emoji: string) => {
    onPick(emoji);
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute z-50 rounded-full shadow-xl"
      style={{
        bottom: "100%",
        marginBottom: "6px",
        [side === "right" ? "right" : "left"]: 0,
        background: "#1A2332",
        border: "1px solid rgba(232, 201, 106, 0.25)",
        padding: expanded ? "8px" : "6px 10px",
        borderRadius: expanded ? "12px" : "999px",
        // Cap the expanded grid so it doesn't overflow narrow chat panels.
        maxWidth: "min(320px, calc(100vw - 24px))",
      }}
    >
      {!expanded ? (
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => pick(emoji)}
              style={{
                fontSize: "22px",
                lineHeight: "1",
                padding: "4px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                borderRadius: "50%",
                transition: "transform 0.1s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.25)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              {emoji}
            </button>
          ))}
          <button
            onClick={() => setExpanded(true)}
            aria-label="More emojis"
            style={{
              fontSize: "16px",
              fontWeight: 600,
              width: "30px",
              height: "30px",
              background: "rgba(232,201,106,0.12)",
              border: "none",
              color: "#E8C96A",
              cursor: "pointer",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            +
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            gap: "2px",
            maxHeight: "220px",
            overflowY: "auto",
            width: "min(304px, calc(100vw - 40px))",
          }}
        >
          {EXPANDED_EMOJIS.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              onClick={() => pick(emoji)}
              style={{
                fontSize: "20px",
                lineHeight: "1",
                padding: "4px 0",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                borderRadius: "4px",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(232,201,106,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
