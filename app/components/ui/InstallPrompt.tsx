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
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  useEffect(() => {
    // Only show on mobile/tablet (max-width: 1024px)
    const mediaQuery = window.matchMedia("(max-width: 1024px)");
    setIsMobileOrTablet(mediaQuery.matches);

    const handleResize = (e: MediaQueryListEvent) => {
      setIsMobileOrTablet(e.matches);
    };
    mediaQuery.addEventListener("change", handleResize);

    // Check if already installed (standalone mode)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

    // Check if previously dismissed
    const wasDismissed = sessionStorage.getItem("pwa-install-dismissed");
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Detect iOS
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Show iOS instructions after a short delay
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => {
        clearTimeout(timer);
        mediaQuery.removeEventListener("change", handleResize);
      };
    }

    // Chrome/Android: capture beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Listen for successful install
    window.addEventListener("appinstalled", () => {
      setDeferredPrompt(null);
      setShowBanner(false);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      mediaQuery.removeEventListener("change", handleResize);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setDismissed(true);
    sessionStorage.setItem("pwa-install-dismissed", "true");
  }, []);

  // Don't render if already installed, dismissed, banner not ready, or desktop
  if (isStandalone || dismissed || !showBanner || !isMobileOrTablet) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] animate-slide-up">
      <div className="mx-auto max-w-lg px-4 pb-6">
        <div
          className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
          style={{ background: "linear-gradient(135deg, #0b1326 0%, #111a33 100%)" }}
        >
          {/* Glow accent */}
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#E6C36A]/10 blur-3xl" />

          <div className="relative p-5">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E6C36A]/10">
                  <img
                    src="/logo.png"
                    alt="Pacific Sunday"
                    className="h-8 w-8 rounded-lg object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-white">
                    Add Pacific Sunday
                  </h3>
                  <p className="text-[13px] text-[#94A3B8]">
                    Install for the best experience
                  </p>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#64748B] transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Dismiss"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M1 1l12 12M13 1L1 13"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Features */}
            <div className="mt-4 flex gap-4 text-[12px] text-[#94A3B8]">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80]" />
                Offline access
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80]" />
                Fast &amp; native feel
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80]" />
                Home screen
              </span>
            </div>

            {/* Action */}
            <div className="mt-4">
              {isIOS ? (
                <div className="rounded-xl bg-white/5 px-4 py-3 text-[13px] leading-relaxed text-[#94A3B8]">
                  Tap the{" "}
                  <span className="inline-flex items-center gap-1 text-white">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="inline"
                    >
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                    Share
                  </span>{" "}
                  button, then{" "}
                  <span className="font-medium text-white">
                    &quot;Add to Home Screen&quot;
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleInstall}
                  className="w-full rounded-xl py-3 text-[14px] font-semibold text-[#0B1120] transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #E6C36A 0%, #f0d48a 100%)",
                  }}
                >
                  Install App
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
