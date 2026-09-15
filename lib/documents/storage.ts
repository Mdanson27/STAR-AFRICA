import { env } from 'cloudflare:workers';

export interface FileStorageProvider {
  readonly name: string;
  put(input: { key: string; bytes: ArrayBuffer; contentType: string; metadata?: Record<string, string> }): Promise<void>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(key: string): Promise<void>;
}

class R2FileStorageProvider implements FileStorageProvider {
  readonly name = 'Cloudflare R2 private object storage';
  private bucket() {
    if (!env.FILES) throw new Error('Private file storage is not configured.');
    return env.FILES;
  }
  async put(input: { key: string; bytes: ArrayBuffer; contentType: string; metadata?: Record<string, string> }) {
    await this.bucket().put(input.key, input.bytes, { httpMetadata: { contentType: input.contentType }, customMetadata: input.metadata });
  }
  get(key: string) { return this.bucket().get(key); }
  async delete(key: string) { await this.bucket().delete(key); }
}

export function getFileStorageProvider(): FileStorageProvider {
  return new R2FileStorageProvider();
}
