"use client";

import { useEffect, useState } from "react";

interface LockConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  selectedCount: number;
  totalPicks: number;
}

export default function LockConfirmModal({ onConfirm, onCancel, selectedCount, totalPicks }: LockConfirmModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    setTimeout(() => setIsVisible(true), 10);
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleCancel = () => {
    setIsVisible(false);
    setTimeout(onCancel, 200);
  };

  const handleConfirm = () => {
    setIsVisible(false);
    setTimeout(onConfirm, 200);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.2s ease",
      }}
      onClick={handleCancel}
    >
      <div
        style={{
          backgroundColor: "#13192A",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "420px",
          fontFamily: "var(--font-poppins), sans-serif",
          overflow: "hidden",
          transform: isVisible ? "scale(1) translateY(0)" : "scale(0.9) translateY(20px)",
          opacity: isVisible ? 1 : 0,
          transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon Header */}
        <div
          style={{
            padding: "24px 24px 16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "rgba(232,201,106,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#E8C96A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <div style={{ textAlign: "center" }}>
            <h3
              style={{
                color: "#E8C96A",
                fontSize: "20px",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              Lock Your Picks?
            </h3>
            <p
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              You're about to lock {selectedCount}/{totalPicks} picks permanently.
              <br />
              You won't be able to change them after this.
            </p>
          </div>
        </div>

        {/* Warning Box */}
        <div
          style={{
            margin: "0 24px 20px",
            padding: "12px 16px",
            backgroundColor: "rgba(255,107,107,0.1)",
            border: "1px solid rgba(255,107,107,0.3)",
            borderRadius: "8px",
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FF6B6B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, marginTop: "2px" }}
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <div
              style={{
                color: "#FF6B6B",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              This action is permanent
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: "12px",
                lineHeight: "1.4",
              }}
            >
              Once locked, you cannot modify your player selections until the next tournament.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            padding: "0 24px 24px",
            display: "flex",
            gap: "12px",
            flexDirection: "column",
          }}
        >
          <button
            onClick={handleConfirm}
            style={{
              width: "100%",
              backgroundColor: "#E8C96A",
              color: "#060D1F",
              border: "none",
              borderRadius: "8px",
              padding: "14px",
              fontSize: "15px",
              fontWeight: 600,
              fontFamily: "var(--font-poppins), sans-serif",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#F0D580";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#E8C96A";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Yes, Lock My Picks
          </button>
          <button
            onClick={handleCancel}
            style={{
              width: "100%",
              backgroundColor: "transparent",
              color: "rgba(255,255,255,0.7)",
              border: "1.5px solid rgba(255,255,255,0.2)",
              borderRadius: "8px",
              padding: "14px",
              fontSize: "15px",
              fontWeight: 500,
              fontFamily: "var(--font-poppins), sans-serif",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
              e.currentTarget.style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
              e.currentTarget.style.color = "rgba(255,255,255,0.7)";
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(232, 201, 106, 0.4);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(232, 201, 106, 0);
          }
        }
      `}</style>
    </div>
  );
}
