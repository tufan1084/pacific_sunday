import FingerprintJS from "@fingerprintjs/fingerprintjs";

let cachedHash: string | null = null;
let inflight: Promise<string | null> | null = null;

/**
 * Computes a stable-ish device fingerprint hash for trusted-device checks.
 *
 * FingerprintJS combines UA, screen, canvas, timezone, language, and ~30
 * other signals into a single stable hash. Stability is ~70–95% across
 * sessions on the same device; iOS Safari is weaker because Apple actively
 * defends against fingerprinting. That's fine — when the hash drifts, the
 * user just hits the email-OTP gate on the next login, exactly like a new
 * device. False negatives degrade UX, not security.
 *
 * Returns null if the library fails to load (older browsers, sandboxed
 * iframes, ad blockers blocking the script). The backend tolerates a
 * missing fingerprint — it just skips the device-trust gate, which is the
 * safe degradation: a degraded fingerprint can't be used to backdoor in,
 * it just means the user can still log in without device binding.
 */
export async function getDeviceFingerprint(): Promise<string | null> {
  if (cachedHash) return cachedHash;
  if (inflight) return inflight;
  if (typeof window === "undefined") return null;

  inflight = (async () => {
    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      cachedHash = result.visitorId;
      return cachedHash;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
