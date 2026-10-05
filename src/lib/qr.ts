import QRCodeLib from "qrcode";
import { randomBytes } from "crypto";

const SHORT_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/** URL-safe, unambiguous short id for a QR code (used in /q/{shortId}). */
export function generateShortId(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += SHORT_ID_ALPHABET[bytes[i] % SHORT_ID_ALPHABET.length];
  }
  return out;
}

export function qrRedirectUrl(shortId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/q/${shortId}`;
}

export function publicMenuUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/m/${slug}`;
}

/** Renders a QR PNG (as a data URL) encoding the /q/{shortId} redirect. */
export async function renderQrCodeDataUrl(
  shortId: string,
  opts: { color?: string; background?: string } = {}
): Promise<string> {
  const url = qrRedirectUrl(shortId);
  return QRCodeLib.toDataURL(url, {
    errorCorrectionLevel: "H", // headroom for the centered logo badge
    margin: 2,
    width: 512,
    color: {
      dark: opts.color || "#0F766E",
      light: opts.background || "#FFFFFF",
    },
  });
}
