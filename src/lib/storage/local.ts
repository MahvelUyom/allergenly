import { promises as fs } from "fs";
import path from "path";
import type { StorageAdapter, StoredFile } from "./types";

// Local-disk storage adapter used when STORAGE_DRIVER=local (the
// default). Files live in ./storage at the project root — deliberately
// OUTSIDE `public/`, so nothing here is directly web-executable or
// even web-reachable without going through an authenticated route.
// Swap in ./s3.ts (STORAGE_DRIVER=s3) for production.
const ROOT = path.join(process.cwd(), "storage");

export class LocalStorageAdapter implements StorageAdapter {
  async put(key: string, data: Buffer): Promise<StoredFile> {
    const filePath = path.join(ROOT, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
    return { key, url: `local://${key}` };
  }

  async get(key: string): Promise<Buffer> {
    const filePath = path.join(ROOT, key);
    return fs.readFile(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(ROOT, key);
    await fs.rm(filePath, { force: true });
  }
}
