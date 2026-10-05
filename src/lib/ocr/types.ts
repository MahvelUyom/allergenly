export interface OcrResult {
  /** Raw extracted text, newline-separated per detected line/block. */
  text: string;
  /** 0-1 confidence, when the provider gives one. */
  confidence?: number;
}

export interface OcrAdapter {
  extractText(fileBuffer: Buffer, mimeType: string): Promise<OcrResult>;
}
