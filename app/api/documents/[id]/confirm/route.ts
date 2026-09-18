import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { documents, receiptRecords } from '@/db/schema';
import { hasPermission } from '@/lib/security/permissions';
import { guardApi } from '@/lib/security/api-guard';
import { writeAuditLog } from '@/lib/security/production-auth';
import { makeInternalNumber } from '@/lib/documents/server';
import { moneyToMinor, type OcrExtraction, type ReceiptFields, type ReceiptLine, safeJson } from '@/lib/documents/types';

type ConfirmBody = {
  fields: ReceiptFields;
  lineItems: ReceiptLine[];
  supplierId?: string;
  link?: { type?: string; id?: string; category?: string; description?: string };
  saveAnyway?: boolean;
};

function dateMs(value: string) {
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardApi(request, {
    permission: 'documents.verify',
    action: 'documents.confirm',
    maxRequests: 30,
    windowMs: 60_000,
  });
  if ('response' in guard) return guard.response;
  const { session } = guard;
  const { id } = await params;
  const body = await request.json() as ConfirmBody;
  const fields = body.fields;
  if (!fields?.supplierName?.trim() || !fields.date || !fields.total) return NextResponse.json({ error: 'Supplier, receipt date, and total are required before confirmation.' }, { status: 400 });
  const db = getDb();
  const [document] = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.companyId, 'company-star-africa'))).limit(1);
  if (!document) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  const [existingForDocument] = await db.select({ id: receiptRecords.id, internalNumber: receiptRecords.internalNumber }).from(receiptRecords).where(eq(receiptRecords.documentId, id)).limit(1);
  if (existingForDocument) return NextResponse.json({ id: existingForDocument.id, internalNumber: existingForDocument.internalNumber, alreadyConfirmed: true });
  const receiptDate = dateMs(fields.date);
  const totalMinor = moneyToMinor(fields.total);
  const duplicates = await db.select({ id: receiptRecords.id, internalNumber: receiptRecords.internalNumber, documentId: receiptRecords.documentId })
    .from(receiptRecords).where(and(eq(receiptRecords.companyId, document.companyId), eq(receiptRecords.receiptNumber, fields.receiptNumber || ''), eq(receiptRecords.totalMinor, totalMinor)));
  const likelyDuplicate = duplicates.find((row) => row.documentId !== id);
  if (likelyDuplicate && !body.saveAnyway) return NextResponse.json({ error: 'This receipt may already exist.', duplicate: likelyDuplicate }, { status: 409 });
  const extractionRow = await env.DB.prepare('SELECT extracted_json FROM ocr_jobs WHERE document_id = ? ORDER BY created_at DESC LIMIT 1').bind(id).first<{ extracted_json: string | null }>();
  const extraction = safeJson<OcrExtraction | null>(extractionRow?.extracted_json, null);
  const receiptId = crypto.randomUUID();
  const internalNumber = makeInternalNumber('REC');
  const now = Date.now();
  const statements = [
    env.DB.prepare(`INSERT INTO receipt_records (id,company_id,internal_number,document_id,supplier_id,supplier_name_raw,supplier_tin,business_address,telephone,receipt_number,invoice_number,receipt_date,receipt_time,currency,subtotal_minor,discount_minor,vat_amount_minor,vat_rate_basis_points,vat_treatment,other_tax_minor,total_minor,amount_paid_minor,change_minor,payment_method,transaction_reference,cashier,customer_name,notes,ocr_snapshot_json,status,reviewed_by,reviewed_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(receiptId, document.companyId, internalNumber, id, body.supplierId || null, fields.supplierName.trim(), fields.supplierTin || null, fields.businessAddress || null, fields.telephone || null, fields.receiptNumber || null, fields.invoiceNumber || null, receiptDate, fields.time || null, fields.currency || 'UGX', moneyToMinor(fields.subtotal), moneyToMinor(fields.discount), moneyToMinor(fields.vatAmount), fields.vatRate ? Math.round(Number(fields.vatRate) * 100) : null, fields.vatTreatment || 'unknown', moneyToMinor(fields.otherTax), totalMinor, moneyToMinor(fields.amountPaid), moneyToMinor(fields.change), fields.paymentMethod || null, fields.transactionReference || null, fields.cashier || null, fields.customerName || null, fields.notes || null, extractionRow?.extracted_json ?? null, 'confirmed', session.userId, now, now, now),
    ...body.lineItems.filter((line) => line.description.trim()).map((line, sequence) => env.DB.prepare('INSERT INTO receipt_line_items (id,receipt_id,description,quantity_minor,unit,unit_price_minor,tax_minor,line_total_minor,sequence) VALUES (?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(), receiptId, line.description.trim(), String(Math.round((Number(line.quantity) || 0) * 1000)), line.unit || null, moneyToMinor(line.unitPrice), moneyToMinor(line.tax), moneyToMinor(line.lineTotal), sequence)),
    ...Object.entries(fields).filter(([key, value]) => String(extraction?.fields[key as keyof ReceiptFields] ?? '') !== String(value ?? '')).map(([key, value]) => env.DB.prepare('INSERT INTO document_field_corrections (id,document_id,field_name,ocr_value,confirmed_value,corrected_by,corrected_at) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(), id, key, String(extraction?.fields[key as keyof ReceiptFields] ?? ''), String(value ?? ''), session.userId, now)),
  ];
  if (body.link?.type && body.link.id) statements.push(env.DB.prepare('INSERT OR IGNORE INTO document_links (id,document_id,entity_type,entity_id,relationship,created_at) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(), id, body.link.type, body.link.id, 'receipt_evidence', now));
  if ((body.link?.type === 'Project' || body.link?.type === 'Project Expense') && body.link.id && hasPermission(session.permissions, 'project_expenses.create')) {
    const expenseId = crypto.randomUUID();
    const expenseNumber = `PEX-${new Date(now).getUTCFullYear()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    statements.push(env.DB.prepare(`INSERT INTO project_expenses (id,project_id,expense_number,supplier_id,payee,category,description,currency,amount_minor,tax_minor,total_minor,payment_method,reference_number,activity,details_json,receipt_document_id,status,occurred_at,recorded_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(expenseId, body.link.id, expenseNumber, body.supplierId || null, fields.supplierName, body.link.category || 'General', body.link.description || `Receipt ${fields.receiptNumber || internalNumber}`, fields.currency || 'UGX', moneyToMinor(fields.subtotal), moneyToMinor(fields.vatAmount), totalMinor, fields.paymentMethod || null, fields.transactionReference || fields.receiptNumber || null, null, JSON.stringify({ receiptId, source: 'documents_ocr' }), id, 'draft', receiptDate ?? now, session.userId, now, now));
    statements.push(env.DB.prepare('INSERT OR IGNORE INTO document_links (id,document_id,entity_type,entity_id,relationship,created_at) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(), id, 'Project Expense', expenseId, 'source_receipt', now));
  }
  statements.push(
    env.DB.prepare("UPDATE documents SET ocr_status='confirmed', verification_status='verified', updated_at=? WHERE id=?").bind(now, id),
  );
  try {
    await env.DB.batch(statements);
    await writeAuditLog({
      request,
      userId: session.userId,
      companyId: session.companyId,
      action: 'document.confirmed',
      entityType: 'document',
      entityId: id,
      newValue: {
        receiptId,
        internalNumber,
        linkedTo: body.link ?? null,
        duplicateOverride: Boolean(likelyDuplicate),
      },
    });
    return NextResponse.json({ id: receiptId, internalNumber, documentId: id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'The verified receipt could not be saved.' }, { status: 500 });
  }
}
