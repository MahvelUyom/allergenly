import type { StorageAdapter } from "./types";
import { LocalStorageAdapter } from "./local";
import { S3StorageAdapter } from "./s3";

let adapter: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (adapter) return adapter;
  adapter = process.env.STORAGE_DRIVER === "s3" ? new S3StorageAdapter() : new LocalStorageAdapter();
  return adapter;
}

export type { StorageAdapter, StoredFile } from "./types";
