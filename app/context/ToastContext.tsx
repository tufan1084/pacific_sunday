"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          pointerEvents: "none",
          fontFamily: "var(--font-poppins), sans-serif",
        }}
      >
        {toasts.map((t) => {
          const accent =
            t.type === "success" ? "#E8C96A" : t.type === "error" ? "#EF4444" : "#60A5FA";
          const icon =
            t.type === "success" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : t.type === "error" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            );

          return (
            <div
              key={t.id}
              style={{
                minWidth: "280px",
                maxWidth: "380px",
                backgroundColor: "#13192A",
                border: `1px solid ${accent}40`,
                borderLeft: `3px solid ${accent}`,
                borderRadius: "8px",
                padding: "14px 18px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                pointerEvents: "auto",
                animation: "ps-toast-in 0.25s ease-out",
              }}
            >
              <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{icon}</div>
              <p style={{ color: "#FFFFFF", fontSize: "14px", margin: 0, flex: 1, lineHeight: 1.4 }}>
                {t.message}
              </p>
            </div>
          );
        })}
      </div>
      <style jsx global>{`
        @keyframes ps-toast-in {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
