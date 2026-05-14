// Modern Chromium browsers reduce the User-Agent to "Linux; Android 10; K" so
// the device model is no longer parseable from req.headers['user-agent'].
// The replacement is the UA-CH JS API: navigator.userAgentData.getHighEntropyValues
// returns the real model when the user explicitly hands it to the page.
//
// Returns null on browsers that don't expose userAgentData (Safari, Firefox).
// Callers should fall through to server-side UA parsing in that case.
export interface UaHints {
  model: string | null;
  platform: string | null;
  platformVersion: string | null;
}

interface UaDataLike {
  getHighEntropyValues?: (hints: string[]) => Promise<{
    model?: string;
    platform?: string;
    platformVersion?: string;
  }>;
}

export async function collectUaHints(): Promise<UaHints | null> {
  if (typeof navigator === "undefined") return null;
  const uaData = (navigator as Navigator & { userAgentData?: UaDataLike }).userAgentData;
  if (!uaData || typeof uaData.getHighEntropyValues !== "function") {
    // userAgentData is exposed only in secure contexts (HTTPS / localhost).
    // On plain HTTP it's undefined and we have no way to get the real model.
    console.warn(
      "[uaHints] navigator.userAgentData unavailable — likely an insecure (HTTP) context. Device model will fall back to UA parsing.",
    );
    return null;
  }

  try {
    const res = await uaData.getHighEntropyValues(["model", "platform", "platformVersion"]);
    const hints = {
      model: res.model?.trim() || null,
      platform: res.platform?.trim() || null,
      platformVersion: res.platformVersion?.trim() || null,
    };
    console.info("[uaHints] collected:", hints);
    return hints;
  } catch (err) {
    console.warn("[uaHints] getHighEntropyValues threw:", err);
    return null;
  }
}
