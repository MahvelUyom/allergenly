export function deviceTypeFromUserAgent(ua: string | null): string {
  if (!ua) return "unknown";
  const lower = ua.toLowerCase();
  if (/ipad|tablet/.test(lower)) return "tablet";
  if (/mobi|iphone|android/.test(lower)) return "mobile";
  return "desktop";
}

/** Coarse, privacy-preserving fingerprint used only for the 30-minute scan dedup window — never stored raw, never used to identify a person. */
export async function dedupeFingerprint(qrId: string, ip: string, userAgent: string | null): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(`${qrId}:${ip}:${userAgent ?? ""}`).digest("hex");
}
