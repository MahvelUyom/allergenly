import type { OcrAdapter } from "./types";
import { StubOcrAdapter } from "./stub";
import { GoogleVisionOcrAdapter } from "./vision";

let adapter: OcrAdapter | null = null;

export function getOcrAdapter(): OcrAdapter {
  if (adapter) return adapter;
  adapter = process.env.OCR_DRIVER === "vision" ? new GoogleVisionOcrAdapter() : new StubOcrAdapter();
  return adapter;
}

export type { OcrAdapter, OcrResult } from "./types";
