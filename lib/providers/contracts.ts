export type ProviderMode = 'live' | 'development';
export type ProviderResult<T> = { mode: ProviderMode; provider: string; status: 'completed' | 'queued' | 'failed'; data?: T; message: string };

export interface EmailProvider { readonly mode: ProviderMode; send(input: { to: string[]; subject: string; html: string; attachmentKeys: string[] }): Promise<ProviderResult<{ messageId: string }>>; }
export interface OcrProvider { readonly mode: ProviderMode; extract(input: { storageKey: string; mimeType: string }): Promise<ProviderResult<{ fields: Record<string, string>; confidenceBasisPoints: number }>>; }
export interface FileStorageProvider { put(input: { key: string; bytes: ArrayBuffer; contentType: string }): Promise<void>; getSignedUrl(key: string, expiresInSeconds: number): Promise<string>; }
export interface BidSourceProvider { readonly source: string; collect(since: Date): Promise<Array<{ externalId: string; title: string; closesAt: string; url: string }>>; }
export interface BankDataProvider { importStatement(input: { accountId: string; file: ArrayBuffer }): Promise<ProviderResult<{ transactionCount: number }>>; }
export interface BackupProvider { create(input: { companyId: string; includeDocuments: boolean }): Promise<ProviderResult<{ restorePoint: string }>>; verify(restorePoint: string): Promise<ProviderResult<{ valid: boolean }>>; }
export interface QuickBooksImporter { parse(file: ArrayBuffer): Promise<{ headers: string[]; rows: string[][] }>; validate(mapping: Record<string, string>): Promise<{ errors: string[] }>; }

export class DevelopmentEmailProvider implements EmailProvider {
  readonly mode = 'development' as const;
  async send(input: { to: string[]; subject: string; html: string; attachmentKeys: string[] }) {
    return { mode: this.mode, provider: 'development-outbox', status: 'completed' as const, data: { messageId: `dev-${crypto.randomUUID()}` }, message: `Captured for ${input.to.length} recipient(s); no external email was sent.` };
  }
}

export class DevelopmentOcrProvider implements OcrProvider {
  readonly mode = 'development' as const;
  async extract(input: { storageKey: string; mimeType: string }) {
    return { mode: this.mode, provider: 'deterministic-demo-ocr', status: 'completed' as const, data: { fields: { supplier: 'Kampala Hardware Supplies', date: '2026-09-02', invoiceNumber: 'DEMO-001', total: '1250000', sourceFile: input.storageKey }, confidenceBasisPoints: 8200 }, message: 'Demo extraction requires human confirmation and did not call an external OCR service.' };
  }
}
