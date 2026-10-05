import type { StorageAdapter, StoredFile } from "./types";

// S3-compatible storage adapter, used when STORAGE_DRIVER=s3. Works
// against AWS S3, Cloudflare R2, Backblaze B2, DigitalOcean Spaces,
// MinIO, etc. — anything speaking the S3 API. Wired up but inert until
// S3_* env vars are filled in (see .env.example); LocalStorageAdapter is
// the default so the app runs without any of this configured.
export class S3StorageAdapter implements StorageAdapter {
  private async client() {
    const { S3Client } = await import("@aws-sdk/client-s3");
    const endpoint = process.env.S3_ENDPOINT || undefined;
    return new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint,
      forcePathStyle: !!endpoint, // needed for most non-AWS S3-compatible providers
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
      },
    });
  }

  private bucket() {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) throw new Error("S3_BUCKET is not configured");
    return bucket;
  }

  async put(key: string, data: Buffer, contentType: string): Promise<StoredFile> {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.client();
    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket(),
        Key: key,
        Body: data,
        ContentType: contentType,
        // No public-read ACL: menu uploads are raw source files (PDFs/
        // images), served only through an authenticated route, never
        // linked to directly.
      })
    );
    const base = process.env.S3_PUBLIC_BASE_URL;
    return { key, url: base ? `${base.replace(/\/$/, "")}/${key}` : `s3://${this.bucket()}/${key}` };
  }

  async get(key: string): Promise<Buffer> {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.client();
    const res = await client.send(new GetObjectCommand({ Bucket: this.bucket(), Key: key }));
    const body = res.Body;
    if (!body) throw new Error(`S3 object ${key} has no body`);
    const chunks: Uint8Array[] = [];
    // @ts-expect-error - Body is a Node.js Readable in the Node runtime
    for await (const chunk of body) chunks.push(chunk);
    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.client();
    await client.send(new DeleteObjectCommand({ Bucket: this.bucket(), Key: key }));
  }
}
