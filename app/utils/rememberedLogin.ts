/**
 * "Remembered login" blob — a small piece of state kept in localStorage
 * across logouts so a user who's previously signed in on this device can
 * come back, see "Welcome back, j***@example.com", and skip the NFC tap.
 *
 * Important security boundary: this blob is just a UX label. The actual
 * fast-login is gated server-side by /auth/quick-login, which verifies the
 * device fingerprint matches a trusted UserDevice row for that userId. So
 * tampering with localStorage doesn't grant access — at worst, the wrong
 * masked email shows on screen.
 */

const KEY = "ps_remembered_login";

export interface RememberedLogin {
  userId: number;
  maskedEmail: string;
  username: string | null;
  rememberedAt: string;
}

export function getRememberedLogin(): RememberedLogin | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RememberedLogin;
    if (typeof parsed?.userId !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setRememberedLogin(data: Omit<RememberedLogin, "rememberedAt">) {
  if (typeof window === "undefined") return;
  try {
    const blob: RememberedLogin = { ...data, rememberedAt: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(blob));
  } catch {
    // localStorage quota exceeded / disabled — non-fatal, just lose the UX.
  }
}

export function clearRememberedLogin() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
