import { getDeployStore, getStore } from '@netlify/blobs';

export interface StoredFileObject {
  arrayBuffer(): Promise<ArrayBuffer>;
  body: ReadableStream<Uint8Array> | null;
  httpMetadata?: { contentType?: string };
  customMetadata?: Record<string, string>;
}

export interface FileStorageProvider {
  readonly name: string;
  put(input: {
    key: string;
    bytes: ArrayBuffer;
    contentType: string;
    metadata?: Record<string, string>;
  }): Promise<void>;
  get(key: string): Promise<StoredFileObject | null>;
  delete(key: string): Promise<void>;
}

function documentsStore() {
  const storeName = 'star-africa-documents';
  if (process.env.CONTEXT === 'production') {
    return getStore(storeName, { consistency: 'strong' });
  }
  return getDeployStore(storeName);
}

class NetlifyBlobFileStorageProvider implements FileStorageProvider {
  readonly name = 'Netlify Blobs private document storage';

  async put(input: {
    key: string;
    bytes: ArrayBuffer;
    contentType: string;
    metadata?: Record<string, string>;
  }) {
    await documentsStore().set(input.key, input.bytes, {
      metadata: {
        contentType: input.contentType,
        ...(input.metadata ?? {}),
      },
    });
  }

  async get(key: string): Promise<StoredFileObject | null> {
    const result = await documentsStore().getWithMetadata(key, {
      type: 'arrayBuffer',
    });
    if (!result?.data) return null;
    const bytes = result.data as ArrayBuffer;
    const metadata = (result.metadata ?? {}) as Record<string, string>;
    return {
      async arrayBuffer() {
        return bytes;
      },
      body: new Blob([bytes]).stream(),
      httpMetadata: { contentType: metadata.contentType },
      customMetadata: metadata,
    };
  }

  async delete(key: string) {
    await documentsStore().delete(key);
  }
}

export function getFileStorageProvider(): FileStorageProvider {
  return new NetlifyBlobFileStorageProvider();
}
