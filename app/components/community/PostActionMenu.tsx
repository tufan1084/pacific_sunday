"use client";

import { useEffect, useRef } from "react";
import { IoEllipsisHorizontal } from "react-icons/io5";
import { BsPinAngle, BsPinAngleFill } from "react-icons/bs";
import { FiTrash2, FiFlag, FiUserX, FiShare2, FiBookmark, FiLink } from "react-icons/fi";

interface PostActionMenuProps {
  isOwner: boolean;
  isPinned: boolean;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onPin: () => void;
  onDelete: () => void;
  onShare: () => void;
  onReport: () => void;
  onBlock: () => void;
  onCopyLink: () => void;
  onSave: () => void;
  isSaved: boolean;
}

export default function PostActionMenu(props: PostActionMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!props.open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        props.onClose();
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [props.open, props]);

  const itemStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "10px",
    width: "100%", padding: "10px 14px",
    background: "none", border: "none",
    color: "#FFFFFF", fontSize: "13px", fontWeight: 400,
    cursor: "pointer", textAlign: "left", fontFamily: "inherit",
  };

  const dangerStyle: React.CSSProperties = { ...itemStyle, color: "#F87171" };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={props.onToggle}
        style={{
          background: "none", border: "none",
          color: "#888", cursor: "pointer",
          padding: "6px", borderRadius: "5px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        aria-label="Post options"
      >
        <IoEllipsisHorizontal size={20} />
      </button>

      {props.open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 30,
            backgroundColor: "#060D1F",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px", padding: "4px",
            minWidth: "200px", overflow: "hidden",
            boxShadow: "0 8px 28px rgba(0,0,0,0.6)",
            fontFamily: "var(--font-poppins), sans-serif",
          }}
        >
          <button style={itemStyle} onClick={props.onSave}>
            <FiBookmark size={16} color="#E8C96A" />
            <span>{props.isSaved ? "Unsave post" : "Save post"}</span>
          </button>

          <button style={itemStyle} onClick={props.onCopyLink}>
            <FiLink size={16} color="#E8C96A" />
            <span>Copy link</span>
          </button>

          <button style={itemStyle} onClick={props.onShare}>
            <FiShare2 size={16} color="#E8C96A" />
            <span>Share post</span>
          </button>

          {props.isOwner && (
            <>
              <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.08)", margin: "4px 0" }} />
              
              <button style={itemStyle} onClick={props.onPin}>
                {props.isPinned
                  ? <BsPinAngleFill size={16} color="#E8C96A" />
                  : <BsPinAngle size={16} color="#E8C96A" />
                }
                <span>{props.isPinned ? "Unpin post" : "Pin post"}</span>
              </button>

              <button style={dangerStyle} onClick={props.onDelete}>
                <FiTrash2 size={16} />
                <span>Delete post</span>
              </button>
            </>
          )}

          {!props.isOwner && (
            <>
              <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.08)", margin: "4px 0" }} />
              <button style={dangerStyle} onClick={props.onReport}>
                <FiFlag size={16} />
                <span>Report post</span>
              </button>
              <button style={dangerStyle} onClick={props.onBlock}>
                <FiUserX size={16} />
                <span>Block user</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
