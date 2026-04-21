"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

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

  const containerStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        left: "12px",
        right: "12px",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column-reverse",
        gap: "8px",
        pointerEvents: "none",
        fontFamily: "var(--font-poppins), sans-serif",
      }
    : {
        position: "fixed",
        top: "24px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        pointerEvents: "none",
        fontFamily: "var(--font-poppins), sans-serif",
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
            ) : t.type === "warning" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            );

          const animName = isMobile
            ? t.leaving
              ? "ps-toast-mobile-out"
              : "ps-toast-mobile-in"
            : t.leaving
            ? "ps-toast-desktop-out"
            : "ps-toast-desktop-in";

          return (
            <div
              key={t.id}
              onClick={() => dismiss(t.id)}
              style={{
                width: isMobile ? "100%" : undefined,
                minWidth: isMobile ? undefined : "280px",
                maxWidth: isMobile ? undefined : "380px",
                backgroundColor: "#13192A",
                border: `1px solid ${accent}40`,
                borderLeft: `3px solid ${accent}`,
                borderRadius: "10px",
                padding: isMobile ? "12px 14px" : "14px 18px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                pointerEvents: "auto",
                cursor: "pointer",
                animation: `${animName} ${t.leaving ? EXIT_MS : 260}ms ease-out forwards`,
              }}
            >
              <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{icon}</div>
              <p
                style={{
                  color: "#FFFFFF",
                  fontSize: isMobile ? "13.5px" : "14px",
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
        @keyframes ps-toast-mobile-in {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ps-toast-mobile-out {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(16px) scale(0.98); }
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
