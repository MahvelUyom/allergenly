import type { OcrAdapter, OcrResult } from "./types";

// Google Cloud Vision (Document Text Detection), called server-side
// only — the API key/service-account credentials never reach the
// client. Used when OCR_DRIVER=vision. Requires either
// GOOGLE_CLOUD_VISION_CREDENTIALS_JSON (a service-account key as a
// single-line JSON string, handy for platforms without a filesystem)
// or GOOGLE_CLOUD_VISION_KEYFILE (a path to the key file).
export class GoogleVisionOcrAdapter implements OcrAdapter {
  private async client() {
    const { ImageAnnotatorClient } = await import("@google-cloud/vision");
    const credentialsJson = process.env.GOOGLE_CLOUD_VISION_CREDENTIALS_JSON;
    if (credentialsJson) {
      const credentials = JSON.parse(credentialsJson);
      return new ImageAnnotatorClient({ credentials });
    }
    const keyFilename = process.env.GOOGLE_CLOUD_VISION_KEYFILE;
    if (keyFilename) {
      return new ImageAnnotatorClient({ keyFilename });
    }
    throw new Error(
      "OCR_DRIVER=vision but no credentials are configured (GOOGLE_CLOUD_VISION_CREDENTIALS_JSON or GOOGLE_CLOUD_VISION_KEYFILE)"
    );
  }

  async extractText(fileBuffer: Buffer, mimeType: string): Promise<OcrResult> {
    const client = await this.client();

    // documentTextDetection handles both images and, for PDFs, batch
    // annotation is technically a separate async API — for the common
    // case (menu photos, scanned single-page PDFs rendered to image
    // upstream, or native images) documentTextDetection on the raw
    // bytes covers it. A production hardening pass would branch PDFs
    // through asyncBatchAnnotateFiles against a GCS URI instead.
    const [result] = await client.documentTextDetection({
      image: { content: fileBuffer },
    });

    const text = result.fullTextAnnotation?.text ?? "";
    const confidence = result.fullTextAnnotation?.pages?.[0]?.confidence ?? undefined;

    return { text, confidence };
  }
}
