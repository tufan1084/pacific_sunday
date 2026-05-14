"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  leaving?: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const DURATION_MS = 3200;
const EXIT_MS = 220;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_MS);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss]
  );

  const success = useCallback((m: string) => showToast(m, "success"), [showToast]);
  const error = useCallback((m: string) => showToast(m, "error"), [showToast]);
  const info = useCallback((m: string) => showToast(m, "info"), [showToast]);
  const warning = useCallback((m: string) => showToast(m, "warning"), [showToast]);

  const containerStyle: React.CSSProperties = {
    position: "fixed",
    top: "clamp(58px, 6vw, 72px)",
    right: "16px",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    pointerEvents: "none",
    fontFamily: "var(--font-poppins), sans-serif",
    maxWidth: "calc(100vw - 32px)",
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <div style={containerStyle} role="status" aria-live="polite">
        {toasts.map((t) => {
          const accent =
            t.type === "success"
              ? "#4ADE80"
              : t.type === "error"
              ? "#EF4444"
              : t.type === "warning"
              ? "#E8C96A"
              : "#60A5FA";

          const icon = (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="6" y1="3" x2="6" y2="21" />
              <path d="M6 3l10 4-10 4" fill={accent} stroke={accent} />
            </svg>
          );

          const animName = t.leaving ? "ps-toast-desktop-out" : "ps-toast-desktop-in";

          return (
            <div
              key={t.id}
              onClick={() => dismiss(t.id)}
              style={{
                minWidth: "280px",
                maxWidth: "380px",
                backgroundColor: "#13192A",
                border: `1px solid ${accent}40`,
                borderLeft: `3px solid ${accent}`,
                borderRadius: "10px",
                padding: "14px 18px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                pointerEvents: "auto",
                cursor: "pointer",
                animation: `${animName} ${t.leaving ? EXIT_MS : 260}ms ease-out forwards`,
                width: "max-content",
              }}
            >
              <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{icon}</div>
              <p
                style={{
                  color: "#FFFFFF",
                  fontSize: "14px",
                  margin: 0,
                  flex: 1,
                  lineHeight: 1.4,
                  wordBreak: "break-word",
                }}
              >
                {t.message}
              </p>
            </div>
          );
        })}
      </div>
      <style jsx global>{`
        @keyframes ps-toast-desktop-in {
          from { opacity: 0; transform: translateX(30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes ps-toast-desktop-out {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(30px); }
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
