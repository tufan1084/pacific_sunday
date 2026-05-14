"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let _prompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    _prompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event("pwa-ready"));
  });
  window.addEventListener("appinstalled", () => {
    _prompt = null;
    try {
      localStorage.setItem(KEY_NATIVE, "1");
      localStorage.setItem(KEY_IOS, "1");
      localStorage.setItem(KEY_ANDROID_MANUAL, "1");
    } catch {}
  });
}

const KEY_NATIVE = "pwa-dismissed-native-v1";
const KEY_IOS = "pwa-dismissed-ios-v1";
const KEY_ANDROID_MANUAL = "pwa-dismissed-android-manual-v1";

type Mode = "native" | "ios" | "android-manual" | null;

export default function InstallPrompt() {
  const { user, loading } = useAuth();
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((window.navigator as any).standalone === true) return;

    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroid = /Android/i.test(ua);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome/i.test(ua);

    if (isIOS) {
      if (!isSafari) return;
      if (localStorage.getItem(KEY_IOS)) return;
      setMode("ios");
      setShow(true);
      return;
    }

    if (!isAndroid) return;

    const showNative = (p: BeforeInstallPromptEvent) => {
      if (localStorage.getItem(KEY_NATIVE)) return;
      setPrompt(p);
      setMode("native");
      setShow(true);
    };

    if (_prompt) {
      showNative(_prompt);
      return;
    }

    // Android: only show the popup when Chrome offers a real install dialog
    // (beforeinstallprompt). If Chrome never offers it (rate-limited,
    // engagement criteria unmet, etc.) we show nothing — no manual card —
    // because the user asked for the button-or-nothing experience.
    const onReady = () => {
      if (_prompt) showNative(_prompt);
    };
    window.addEventListener("pwa-ready", onReady);

    return () => {
      window.removeEventListener("pwa-ready", onReady);
    };
  }, [loading, user]);

  const handleInstall = useCallback(async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    _prompt = null;
    setPrompt(null);
    setShow(false);
    if (outcome === "accepted") localStorage.setItem(KEY_NATIVE, "1");
  }, [prompt]);

  const handleDismiss = useCallback(() => {
    setShow(false);
    if (mode === "ios") localStorage.setItem(KEY_IOS, "1");
    else if (mode === "android-manual") localStorage.setItem(KEY_ANDROID_MANUAL, "1");
    else localStorage.setItem(KEY_NATIVE, "1");
  }, [mode]);

  if (!show || !user) return null;
  if (mode === "native" && !prompt) return null;

  const isInstructional = mode === "ios" || mode === "android-manual";

  return (
    <div
      onClick={handleDismiss}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: "rgba(6,13,31,0.96)",
        padding: "20px", fontFamily: "var(--font-poppins), sans-serif",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: "340px",
          backgroundColor: "#13192A", borderRadius: "20px",
          border: "2px solid #E8C96A",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          padding: "36px 24px 28px", textAlign: "center",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "18px",
            background: "linear-gradient(135deg,rgba(232,201,106,0.15),rgba(232,201,106,0.05))",
            border: "2px solid rgba(232,201,106,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <img src="/data/LOGO-PHOTO.png" alt="Pacific Sunday" style={{ width: "54px", height: "54px", borderRadius: "14px", objectFit: "contain" }} />
          </div>
        </div>

        <h2 style={{ color: "#E8C96A", fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>
          Install Pacific Sunday
        </h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: "0 0 24px", lineHeight: 1.5 }}>
          Add to your home screen for quick access
        </p>

        {mode === "ios" && (
          <div style={{
            textAlign: "left", color: "rgba(255,255,255,0.88)", fontSize: "14px",
            background: "rgba(232,201,106,0.06)", border: "1px solid rgba(232,201,106,0.18)",
            borderRadius: "12px", padding: "14px 16px", marginBottom: "14px",
            lineHeight: 1.7,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <span>1. Tap the</span>
              <strong style={{ color: "#E8C96A" }}>Share</strong>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 16V4" />
                <path d="M8 8l4-4 4 4" />
                <path d="M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4" />
              </svg>
              <span>icon in Safari</span>
            </div>
            <div>2. Scroll and tap <strong style={{ color: "#E8C96A" }}>Add to Home Screen</strong></div>
            <div>3. Tap <strong style={{ color: "#E8C96A" }}>Add</strong> in the top right</div>
          </div>
        )}

        {mode === "android-manual" && (
          <div style={{
            textAlign: "left", color: "rgba(255,255,255,0.88)", fontSize: "14px",
            background: "rgba(232,201,106,0.06)", border: "1px solid rgba(232,201,106,0.18)",
            borderRadius: "12px", padding: "14px 16px", marginBottom: "14px",
            lineHeight: 1.7,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <span>1. Tap the</span>
              <strong style={{ color: "#E8C96A" }}>menu</strong>
              <span style={{ display: "inline-flex", flexDirection: "column", gap: "2px" }} aria-hidden>
                <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#E8C96A" }} />
                <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#E8C96A" }} />
                <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#E8C96A" }} />
              </span>
              <span>icon in Chrome</span>
            </div>
            <div>2. Tap <strong style={{ color: "#E8C96A" }}>Install app</strong> or <strong style={{ color: "#E8C96A" }}>Add to Home screen</strong></div>
            <div>3. Tap <strong style={{ color: "#E8C96A" }}>Install</strong> to confirm</div>
          </div>
        )}

        {mode === "native" ? (
          <>
            <button
              onClick={handleInstall}
              style={{
                width: "100%", padding: "15px", marginBottom: "10px",
                borderRadius: "12px", border: "none",
                background: "linear-gradient(135deg,#E8C96A,#f0d78a)",
                color: "#0A0F1E", fontSize: "16px", fontWeight: 700, cursor: "pointer",
              }}
            >
              Add to Home Screen
            </button>
            <button
              onClick={handleDismiss}
              style={{
                width: "100%", padding: "13px",
                borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)",
                backgroundColor: "transparent", color: "rgba(255,255,255,0.6)",
                fontSize: "14px", fontWeight: 600, cursor: "pointer",
              }}
            >
              Maybe Later
            </button>
          </>
        ) : (
          <button
            onClick={handleDismiss}
            style={{
              width: "100%", padding: "15px",
              borderRadius: "12px", border: "none",
              background: "linear-gradient(135deg,#E8C96A,#f0d78a)",
              color: "#0A0F1E", fontSize: "16px", fontWeight: 700, cursor: "pointer",
            }}
          >
            {isInstructional ? "Got it" : "Close"}
          </button>
        )}
      </div>
    </div>
  );
}
