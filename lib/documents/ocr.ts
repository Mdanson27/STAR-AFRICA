import type { OcrExtraction, ReceiptFields, ReceiptLine } from './types';
import { emptyReceiptFields } from './types';

export interface OCRProvider {
  readonly name: string;
  readonly mode: 'development' | 'production';
  processDocument(input: { storageKey: string; filename: string; mimeType: string; category: string; documentDate?: string }): Promise<OcrExtraction>;
}

function developmentExtraction(input: { filename: string; category: string; documentDate?: string }): OcrExtraction {
  const name = input.filename.toLowerCase();
  const invoice = input.category === 'Supplier Invoice' || name.includes('invoice');
  const receipt = input.category === 'Receipt' || name.includes('receipt');
  const documentType = invoice ? 'Supplier Invoice' : receipt ? 'Receipt' : name.includes('delivery') ? 'Delivery Note' : name.includes('purchase') || name.includes('po-') ? 'Purchase Order' : 'Unknown';
  const fields: ReceiptFields = {
    ...emptyReceiptFields,
    supplierName: name.includes('roofing') ? 'Roofings Uganda Demo' : name.includes('hardware') ? 'Kampala Hardware Supplies Demo' : '',
    receiptNumber: receipt ? 'REVIEW-REQUIRED' : '',
    invoiceNumber: invoice ? 'REVIEW-REQUIRED' : '',
    date: input.documentDate ?? new Date().toISOString().slice(0, 10),
    currency: 'UGX',
  };
  const lineItems: ReceiptLine[] = [];
  const warnings = [
    'Development OCR provider: verify all extracted values against the original document.',
    ...(documentType === 'Unknown' ? ['Document type could not be identified.'] : []),
    'Supplier, receipt number, totals, and line items require human review.',
  ];
  const rawText = `DEVELOPMENT OCR\nSource file: ${input.filename}\nDetected type: ${documentType}\nNo production OCR provider is configured.`;
  return {
    documentType,
    fields,
    lineItems,
    fieldConfidence: { supplierName: fields.supplierName ? 72 : 0, receiptNumber: 28, invoiceNumber: 28, date: 68, currency: 75, total: 0 },
    overallConfidence: 42,
    warnings,
    rawText,
  };
}

class DevelopmentOCRProvider implements OCRProvider {
  readonly name = 'Development OCR provider';
  readonly mode = 'development' as const;
  async processDocument(input: { storageKey: string; filename: string; mimeType: string; category: string; documentDate?: string }) {
    if (!input.mimeType.startsWith('image/') && input.mimeType !== 'application/pdf') throw new Error('This file format is not supported for OCR.');
    return developmentExtraction(input);
  }
}

export function getOCRProvider(): OCRProvider {
  // Production adapters can be selected here using OCR_PROVIDER and credentials held in environment variables.
  return new DevelopmentOCRProvider();
}
