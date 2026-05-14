"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/app/context/AuthContext";
import {
  getRememberedLogin,
  clearRememberedLogin,
  type RememberedLogin,
} from "@/app/utils/rememberedLogin";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";
// Mirrors the seed in backend/prisma/seed.js. Used by the dev tap simulator
// so a developer without a physical NFC chip can still walk through /n.
const DEV_BAG_OPTIONS = [
  "DEV-UID-A001", "DEV-UID-A002", "DEV-UID-A003", "DEV-UID-A004", "DEV-UID-A005",
  "DEV-UID-B001", "DEV-UID-B002", "DEV-UID-B003", "DEV-UID-B004", "DEV-UID-B005",
];

/**
 * /login behaviour:
 *
 *   1. If `ps_remembered_login` exists in localStorage (set on every prior
 *      successful login), show a "Welcome back, j***@example.com" form
 *      where the user just enters their PIN. Server-side, /auth/quick-login
 *      verifies the device fingerprint is still trusted; if it isn't (e.g.
 *      the user revoked it from another session), we drop back to (2).
 *   2. Otherwise — first-time visit, or after "Sign in as a different user"
 *      — show the "tap your bag to sign in" landing.
 *   3. Dev mode adds a small panel that simulates an NFC tap on a seeded
 *      DEV-UID-* bag, so the team can develop without a physical chip.
 */
function LoginGate() {
  const router = useRouter();
  const { quickLogin } = useAuth();

  const [remembered, setRemembered] = useState<RememberedLogin | null>(null);
  const [mpin, setMpin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [devBagUid, setDevBagUid] = useState(DEV_BAG_OPTIONS[0]);
  const [devCustom, setDevCustom] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Forward any in-flight NFC session back to /n (mid-login refresh case).
    try {
      const raw = sessionStorage.getItem("ps_nfc_login");
      if (raw) {
        const data = JSON.parse(raw);
        if (data?.bag?.uid && data?.expiresAt && new Date(data.expiresAt) > new Date()) {
          router.replace(`/n?iykRef=${encodeURIComponent(data.bag.uid)}`);
          return;
        }
        sessionStorage.removeItem("ps_nfc_login");
      }
    } catch { /* ignore */ }

    setRemembered(getRememberedLogin());
    setHydrated(true);
  }, [router]);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remembered) return;
    setError("");
    if (mpin.length !== 4) { setError("PIN must be 4 digits."); return; }
    setLoading(true);
    try {
      const res = await quickLogin(remembered.userId, mpin);
      if (res.success) {
        router.push("/");
        return;
      }
      if (res.requiresNfcTap) {
        // The device was revoked or fingerprint drifted. Forget the
        // remembered blob so the user gets the "tap your bag" landing.
        clearRememberedLogin();
        setRemembered(null);
        setError(res.message || "Please tap your bag to sign in again.");
      } else {
        setError(res.message || "Invalid PIN.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDifferentUser = () => {
    clearRememberedLogin();
    setRemembered(null);
    setMpin("");
    setError("");
  };

  const handleDevTap = () => {
    const uid = (devCustom.trim() || devBagUid).toUpperCase();
    if (!uid) return;
    router.push(`/n?iykRef=${encodeURIComponent(uid)}`);
  };

  // Avoid SSR/hydration flicker: hold off rendering anything until we know
  // whether there's a remembered session to surface.
  if (!hydrated) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#060D1F", color: "#E8C96A" }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: "#060D1F", padding: "16px" }}>
      <div style={{ maxWidth: "440px", width: "100%", textAlign: "center" }}>
        <div className="mb-4 flex justify-center">
          <Image
            src="/data/LOGO-PHOTO.png"
            alt="Pacific Sunday"
            width={160}
            height={50}
            priority
            style={{ borderRadius: "6px", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
          />
        </div>

        {remembered ? (
          <>
            <h1 style={{ color: "#E8C96A", fontSize: "22px", fontWeight: 600, marginBottom: "8px", fontFamily: "var(--font-poppins), sans-serif" }}>
              Welcome back
            </h1>
            <p style={{ color: "#94A3B8", fontSize: "13px", lineHeight: 1.6, fontFamily: "var(--font-poppins), sans-serif", marginBottom: "20px" }}>
              Sign in with your PIN. This device is already trusted, so no NFC tap needed.
            </p>

            <div style={{ backgroundColor: "#13192A", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "24px", textAlign: "left", marginBottom: "16px" }}>
              <form onSubmit={handleQuickSubmit}>
                <div style={{ marginBottom: "18px" }}>
                  <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "6px" }}>Email</label>
                  <input
                    type="text"
                    value={remembered.maskedEmail}
                    readOnly
                    aria-readonly
                    title="Locked to the account previously signed in on this device"
                    style={{ width: "100%", backgroundColor: "#0b1326", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", color: "#94A3B8", fontSize: "14px", padding: "10px 12px", outline: "none", cursor: "not-allowed", fontFamily: "inherit" }}
                  />
                  {remembered.username && (
                    <p style={{ color: "#64748B", fontSize: "11px", marginTop: "4px" }}>@{remembered.username}</p>
                  )}
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "6px" }}>PIN</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    autoFocus
                    autoComplete="off"
                    value={mpin}
                    onChange={(e) => setMpin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="••••"
                    style={{
                      width: "100%", backgroundColor: "#13192A",
                      border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
                      borderRadius: "6px", color: "#fff", fontSize: "14px",
                      padding: "10px 12px", outline: "none", letterSpacing: "8px",
                      textAlign: "center", fontFamily: "inherit",
                      WebkitTextSecurity: "disc",
                    } as React.CSSProperties}
                  />
                </div>

                {error && (
                  <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "5px", padding: "10px 12px", marginBottom: "16px" }}>
                    <p style={{ color: "#EF4444", fontSize: "13px", margin: 0 }}>{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || mpin.length !== 4}
                  style={{
                    width: "100%", backgroundColor: "#E8C96A", color: "#060D1F",
                    border: "none", borderRadius: "6px", padding: "12px",
                    fontSize: "15px", fontWeight: 500,
                    cursor: loading || mpin.length !== 4 ? "not-allowed" : "pointer",
                    opacity: loading || mpin.length !== 4 ? 0.6 : 1, fontFamily: "inherit",
                  }}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={handleDifferentUser}
                  style={{ color: "#94A3B8", fontSize: "12px", background: "none", border: "none", padding: 0, cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}
                >
                  Sign in as a different user
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 style={{ color: "#E8C96A", fontSize: "22px", fontWeight: 600, marginBottom: "10px", fontFamily: "var(--font-poppins), sans-serif" }}>
              Sign in by tapping your bag
            </h1>
            <p style={{ color: "#94A3B8", fontSize: "14px", lineHeight: 1.6, fontFamily: "var(--font-poppins), sans-serif", marginBottom: "24px" }}>
              For your security, Pacific Sunday accounts can only be accessed
              through the NFC chip in your golf bag. Tap your phone to the chip
              to open the sign-in page automatically.
            </p>

            <div style={{ backgroundColor: "#13192A", border: "1px solid rgba(232,201,106,0.15)", borderRadius: "8px", padding: "20px", textAlign: "left", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8.32a7.43 7.43 0 010 7.36" />
                  <path d="M9.46 6.21a11.76 11.76 0 010 11.58" />
                  <path d="M12.91 4.1a16.07 16.07 0 010 15.8" />
                  <path d="M16.37 2a20.4 20.4 0 010 20" />
                </svg>
                <h2 style={{ color: "#FFFFFF", fontSize: "15px", fontWeight: 600, margin: 0, fontFamily: "var(--font-poppins), sans-serif" }}>How to sign in</h2>
              </div>
              <ol style={{ color: "#CBD5E1", fontSize: "13px", lineHeight: 1.7, paddingLeft: "20px", margin: 0, fontFamily: "var(--font-poppins), sans-serif" }}>
                <li>Unlock your phone and make sure NFC is on.</li>
                <li>Hold the back of your phone to the NFC chip on your bag.</li>
                <li>Tap the notification that appears to open the sign-in page.</li>
              </ol>
            </div>
          </>
        )}

        {DEV_MODE && (
          <div style={{ backgroundColor: "rgba(232,201,106,0.05)", border: "1px dashed rgba(232,201,106,0.3)", borderRadius: "8px", padding: "16px", textAlign: "left", marginBottom: "16px" }}>
            <p style={{ color: "#E8C96A", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px 0", fontWeight: 600, fontFamily: "var(--font-poppins), sans-serif" }}>
              Dev mode — simulate an NFC tap
            </p>
            <p style={{ color: "#94A3B8", fontSize: "12px", margin: "0 0 12px 0", lineHeight: 1.5, fontFamily: "var(--font-poppins), sans-serif" }}>
              Pick a seeded test bag or type a custom <code style={{ color: "#E8C96A" }}>DEV-UID-*</code>. This panel only appears when{" "}
              <code style={{ color: "#E8C96A" }}>NEXT_PUBLIC_DEV_MODE=true</code>.
            </p>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <select
                value={devBagUid}
                onChange={(e) => setDevBagUid(e.target.value)}
                style={{ flex: 1, backgroundColor: "#13192A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "13px", padding: "8px 10px", fontFamily: "inherit" }}
              >
                {DEV_BAG_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <input
              type="text"
              value={devCustom}
              onChange={(e) => setDevCustom(e.target.value)}
              placeholder="…or paste DEV-UID-XXXX"
              style={{ width: "100%", backgroundColor: "#13192A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "13px", padding: "8px 10px", fontFamily: "inherit", marginBottom: "10px" }}
            />
            <button
              type="button"
              onClick={handleDevTap}
              style={{ width: "100%", backgroundColor: "transparent", color: "#E8C96A", border: "1px solid #E8C96A", borderRadius: "6px", padding: "10px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
            >
              Simulate NFC Tap →
            </button>
          </div>
        )}

        <p className="mt-2 text-center text-[11px] text-[#3a4560]">
          Pacific Sunday 2026 — NFC-Powered Digital Ownership
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#060D1F" }}><div style={{ color: "#E8C96A" }}>Loading...</div></div>}>
      <LoginGate />
    </Suspense>
  );
}
