export const documentCategories = [
  'Receipt', 'Supplier Invoice', 'Customer Invoice', 'Delivery Note', 'Purchase Order',
  'Work Certificate', 'Contract', 'BOQ', 'Quotation', 'Payment Proof', 'Bank Document',
  'Tax Document', 'Project Document', 'Tender Document', 'Payroll Document', 'Other',
] as const;

export const relatedModules = ['Project', 'Supplier', 'Customer', 'Invoice', 'Payment', 'Purchase Order', 'Bid', 'Expense', 'General Company Expense'] as const;
export const ocrStatuses = ['uploaded', 'queued', 'processing', 'extracted', 'needs_review', 'confirmed', 'failed', 'not_required'] as const;
export const supportedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;
export const maxDocumentBytes = 15 * 1024 * 1024;

export type ReceiptLine = {
  id?: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  tax: string;
  lineTotal: string;
};

export type ReceiptFields = {
  supplierName: string;
  supplierTin: string;
  businessAddress: string;
  telephone: string;
  receiptNumber: string;
  invoiceNumber: string;
  date: string;
  time: string;
  currency: string;
  paymentMethod: string;
  customerName: string;
  projectReference: string;
  subtotal: string;
  discount: string;
  vatAmount: string;
  vatRate: string;
  vatTreatment: string;
  otherTax: string;
  total: string;
  amountPaid: string;
  change: string;
  transactionReference: string;
  cashier: string;
  notes: string;
};

export type FieldConfidence = Record<string, number>;

export type OcrExtraction = {
  documentType: 'Receipt' | 'Supplier Invoice' | 'Delivery Note' | 'Purchase Order' | 'Unknown';
  fields: ReceiptFields;
  lineItems: ReceiptLine[];
  fieldConfidence: FieldConfidence;
  overallConfidence: number;
  warnings: string[];
  rawText: string;
};

export const emptyReceiptFields: ReceiptFields = {
  supplierName: '', supplierTin: '', businessAddress: '', telephone: '', receiptNumber: '',
  invoiceNumber: '', date: '', time: '', currency: 'UGX', paymentMethod: '', customerName: '',
  projectReference: '', subtotal: '', discount: '', vatAmount: '', vatRate: '',
  vatTreatment: 'unknown', otherTax: '', total: '', amountPaid: '', change: '',
  transactionReference: '', cashier: '', notes: '',
};

export function moneyToMinor(value: string | number | null | undefined) {
  const normalized = String(value ?? '').replace(/[^0-9.-]/g, '');
  if (!normalized || normalized === '-' || Number.isNaN(Number(normalized))) return '0';
  return String(Math.round(Number(normalized) * 100));
}

export function minorToMoney(value: string | null | undefined) {
  return ((Number(value ?? '0') || 0) / 100).toFixed(2);
}

export function safeJson<T>(value: string | null | undefined, fallback: T): T {
  try { return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}
