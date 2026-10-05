import { ALLOWED_UPLOAD_MIME_TYPES, MAX_UPLOAD_BYTES } from "./zod-schemas";

export interface FileValidationResult {
  ok: boolean;
  error?: string;
  sniffedMimeType?: string;
}

/**
 * Server-side file validation for the menu upload endpoint. Never
 * trusts the client-reported MIME type — sniffs the actual magic
 * bytes and cross-checks against it, per the security requirements.
 */
export function validateUploadedFile(buffer: Buffer, sizeBytes: number): FileValidationResult {
  if (sizeBytes > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "File is larger than the 20MB limit" };
  }
  if (sizeBytes === 0) {
    return { ok: false, error: "File is empty" };
  }

  const sniffed = sniffMimeType(buffer);
  if (!sniffed || !(ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(sniffed)) {
    return { ok: false, error: "Unsupported file type — upload a PDF, JPG, PNG, WEBP, or plain text file" };
  }

  return { ok: true, sniffedMimeType: sniffed };
}

function sniffMimeType(buffer: Buffer): string | null {
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-") {
    return "application/pdf";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  // Plain text: only accept if it's actually printable/UTF-8-ish text,
  // not an arbitrary binary blob mislabeled as .txt.
  const sample = buffer.subarray(0, Math.min(buffer.length, 2048));
  const text = sample.toString("utf8");
  const printableRatio =
    text.length === 0 ? 0 : text.split("").filter((c) => c.charCodeAt(0) >= 9 && c.charCodeAt(0) !== 0x7f).length / text.length;
  if (printableRatio > 0.95) return "text/plain";

  return null;
}

/**
 * Strip anything that could execute as a script from a plain-text
 * upload before it ever reaches OCR/parsing — belt-and-braces given
 * the file is user-submitted. (PDFs/images are opaque binary blobs to
 * this app; we never render them as HTML, so the main injection
 * surface is a maliciously-named or -crafted .txt upload.)
 */
export function stripEmbeddedScripts(text: string): string {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/javascript:/gi, "");
}
