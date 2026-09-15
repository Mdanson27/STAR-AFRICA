import { describe, expect, it } from 'vitest';
import { getOCRProvider } from './ocr';
import { minorToMoney, moneyToMinor } from './types';
import { sanitizeFilename, sha256Hex, validateDocumentFile } from './validation';

describe('document validation', () => {
  it('accepts a valid JPEG signature and rejects mismatched content', () => {
    const validBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer;
    const valid = new File([validBytes], 'receipt.jpg', { type: 'image/jpeg' });
    expect(validateDocumentFile(valid, validBytes)).toBeNull();
    const invalidBytes = new TextEncoder().encode('not a jpeg').buffer;
    const invalid = new File([invalidBytes], 'receipt.jpg', { type: 'image/jpeg' });
    expect(validateDocumentFile(invalid, invalidBytes)).toMatch(/corrupt/i);
  });

  it('sanitizes object-storage filenames and hashes deterministically', async () => {
    expect(sanitizeFilename('  Kampala receipt (final).jpg ')).toBe('Kampala-receipt-final-.jpg');
    const bytes = new TextEncoder().encode('star-africa').buffer;
    expect(await sha256Hex(bytes)).toHaveLength(64);
    expect(await sha256Hex(bytes)).toBe(await sha256Hex(bytes));
  });
});

describe('receipt amounts', () => {
  it('stores money as integer minor units without floating-point columns', () => {
    expect(moneyToMinor('845,000.50')).toBe('84500050');
    expect(minorToMoney('84500050')).toBe('845000.50');
  });
});

describe('development OCR provider', () => {
  it('classifies receipt filenames and explicitly warns that review is required', async () => {
    const result = await getOCRProvider().processDocument({ storageKey: 'private/key', filename: 'kampala-hardware-receipt.jpg', mimeType: 'image/jpeg', category: 'Receipt', documentDate: '2026-09-08' });
    expect(result.documentType).toBe('Receipt');
    expect(result.fields.supplierName).toContain('Kampala Hardware');
    expect(result.fields.date).toBe('2026-09-08');
    expect(result.warnings.join(' ')).toMatch(/Development OCR provider/i);
    expect(result.overallConfidence).toBeLessThan(80);
  });
});
