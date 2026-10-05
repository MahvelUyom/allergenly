export interface StoredFile {
  key: string;
  url: string;
}

export interface StorageAdapter {
  /**
   * Persist a file buffer under a storage key and return where it lives.
   * Implementations must NOT store uploads in a directory that is
   * directly web-executable (see security requirements) — local disk
   * storage lives outside `public/`, and S3 buckets should have no
   * script-execution policy attached.
   */
  put(key: string, data: Buffer, contentType: string): Promise<StoredFile>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}
