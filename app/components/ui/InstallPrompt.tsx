"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1024px)");
    setIsMobileOrTablet(mediaQuery.matches);

    const handleResize = (e: MediaQueryListEvent) => {
      setIsMobileOrTablet(e.matches);
    };
    mediaQuery.addEventListener("change", handleResize);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

    const wasDismissed = sessionStorage.getItem("pwa-install-dismissed");
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      const timer = setTimeout(() => setShowModal(true), 1500);
      return () => {
        clearTimeout(timer);
        mediaQuery.removeEventListener("change", handleResize);
      };
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowModal(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setDeferredPrompt(null);
      setShowModal(false);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      mediaQuery.removeEventListener("change", handleResize);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) {
      console.log('No install prompt available');
      alert('Installation is not available. Please use your browser\'s menu to install this app.');
      return;
    }
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('Install outcome:', outcome);
      if (outcome === "accepted") {
        setShowModal(false);
        sessionStorage.setItem("pwa-install-dismissed", "true");
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Install error:', error);
      alert('Unable to install. Please try using your browser\'s menu.');
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowModal(false);
    setDismissed(true);
    sessionStorage.setItem("pwa-install-dismissed", "true");
  }, []);

  if (isStandalone || dismissed || !showModal || !isMobileOrTablet) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(6, 13, 31, 0.9)",
        backdropFilter: "blur(8px)",
        padding: "20px",
        animation: "fadeIn 0.3s ease-out",
        fontFamily: "var(--font-poppins), sans-serif",
      }}
      onClick={handleDismiss}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "360px",
          backgroundColor: "#13192A",
          borderRadius: "20px",
          border: "2px solid #E8C96A",
          overflow: "hidden",
          animation: "scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Content */}
        <div style={{ padding: "40px 28px 32px", textAlign: "center" }}>
          {/* App icon */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, rgba(232, 201, 106, 0.15), rgba(232, 201, 106, 0.05))",
                border: "2px solid rgba(232, 201, 106, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src="/logo.png"
                alt="Pacific Sunday"
                style={{ width: "60px", height: "60px", borderRadius: "16px", objectFit: "contain" }}
              />
            </div>
          </div>

          {/* Title */}
          <h2
            style={{
              color: "#E8C96A",
              fontSize: "22px",
              fontWeight: 700,
              margin: "0 0 12px",
              letterSpacing: "-0.5px",
            }}
          >
            Install Pacific Sunday
          </h2>
          <p
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: "15px",
              margin: "0 0 32px",
              lineHeight: 1.5,
            }}
          >
            Add to your home screen for quick access
          </p>

          {/* Actions */}
          {isIOS ? (
            <>
              <div
                style={{
                  backgroundColor: "rgba(232, 201, 106, 0.1)",
                  border: "1px solid rgba(232, 201, 106, 0.3)",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "16px",
                  fontSize: "14px",
                  color: "rgba(255, 255, 255, 0.9)",
                  lineHeight: 1.6,
                }}
              >
                Tap{" "}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#E8C96A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ display: "inline", verticalAlign: "middle", margin: "0 4px" }}
                >
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>{" "}
                then{" "}
                <span style={{ color: "#E8C96A", fontWeight: 700 }}>
                  &quot;Add to Home Screen&quot;
                </span>
              </div>
              <button
                onClick={handleDismiss}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  backgroundColor: "transparent",
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.color = "#FFFFFF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                onClick={handleInstall}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #E8C96A 0%, #f0d78a 100%)",
                  color: "#0A0F1E",
                  fontSize: "16px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(232, 201, 106, 0.3)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 24px rgba(232, 201, 106, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(232, 201, 106, 0.3)";
                }}
              >
                Install Now
              </button>
              <button
                onClick={handleDismiss}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  backgroundColor: "transparent",
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.color = "#FFFFFF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                }}
              >
                Maybe Later
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0; 
            transform: scale(0.85) translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }
      `}</style>
    </div>
  );
}
