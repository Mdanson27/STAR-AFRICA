import 'server-only';
import { and, desc, eq, isNull, or, like } from 'drizzle-orm';
import { getDb } from '@/db';
import { auditLogs, documentLinks, documents, ocrJobs, projects, receiptLineItems, receiptRecords, suppliers, users } from '@/db/schema';
import { safeJson, type OcrExtraction } from './types';

export async function listDocuments(companyId: string, query = '') {
  const db = getDb();
  const base = db.select({
    id: documents.id, internalNumber: documents.internalNumber, title: documents.title,
    originalFilename: documents.originalFilename, mimeType: documents.mimeType, sizeBytes: documents.sizeBytes,
    category: documents.category, referenceNumber: documents.referenceNumber, documentDate: documents.documentDate,
    relatedModule: documents.relatedModule, relatedRecordId: documents.relatedRecordId,
    ocrStatus: documents.ocrStatus, verificationStatus: documents.verificationStatus,
    uploadedAt: documents.createdAt, uploadedByName: users.displayName,
  }).from(documents).innerJoin(users, eq(documents.uploadedBy, users.id));
  const where = query
    ? and(eq(documents.companyId, companyId), isNull(documents.archivedAt), or(like(documents.title, `%${query}%`), like(documents.originalFilename, `%${query}%`), like(documents.referenceNumber, `%${query}%`), like(documents.rawOcrText, `%${query}%`)))
    : and(eq(documents.companyId, companyId), isNull(documents.archivedAt));
  return base.where(where).orderBy(desc(documents.createdAt));
}

export async function getDocumentWorkspace(companyId: string, documentId: string) {
  const db = getDb();
  const [document] = await db.select({
    id: documents.id, internalNumber: documents.internalNumber, storageKey: documents.storageKey,
    filename: documents.filename, originalFilename: documents.originalFilename, mimeType: documents.mimeType,
    sizeBytes: documents.sizeBytes, title: documents.title, category: documents.category,
    referenceNumber: documents.referenceNumber, documentDate: documents.documentDate,
    description: documents.description, relatedModule: documents.relatedModule, relatedRecordId: documents.relatedRecordId,
    tagsJson: documents.tagsJson, notes: documents.notes, ocrRequired: documents.ocrRequired,
    rawOcrText: documents.rawOcrText, ocrStatus: documents.ocrStatus,
    verificationStatus: documents.verificationStatus, uploadedAt: documents.createdAt,
    uploadedById: documents.uploadedBy, uploadedByName: users.displayName, archivedAt: documents.archivedAt,
  }).from(documents).innerJoin(users, eq(documents.uploadedBy, users.id))
    .where(and(eq(documents.id, documentId), eq(documents.companyId, companyId))).limit(1);
  if (!document) return null;
  const [jobs, links, receiptRows, audit] = await Promise.all([
    db.select().from(ocrJobs).where(eq(ocrJobs.documentId, documentId)).orderBy(desc(ocrJobs.createdAt)),
    db.select().from(documentLinks).where(eq(documentLinks.documentId, documentId)),
    db.select({ receipt: receiptRecords, reviewerName: users.displayName, supplierName: suppliers.name })
      .from(receiptRecords).innerJoin(users, eq(receiptRecords.reviewedBy, users.id)).leftJoin(suppliers, eq(receiptRecords.supplierId, suppliers.id))
      .where(eq(receiptRecords.documentId, documentId)).limit(1),
    db.select().from(auditLogs).where(and(eq(auditLogs.entityType, 'document'), eq(auditLogs.entityId, documentId))).orderBy(desc(auditLogs.occurredAt)),
  ]);
  const receipt = receiptRows[0] ?? null;
  const lines = receipt ? await db.select().from(receiptLineItems).where(eq(receiptLineItems.receiptId, receipt.receipt.id)).orderBy(receiptLineItems.sequence) : [];
  return { document, jobs, links, receipt, lines, audit, latestExtraction: safeJson<OcrExtraction | null>(jobs[0]?.extractedJson, null) };
}

export async function getDocumentOptions(companyId: string) {
  const db = getDb();
  const [projectRows, supplierRows] = await Promise.all([
    db.select({ id: projects.id, code: projects.code, name: projects.name }).from(projects).where(eq(projects.companyId, companyId)),
    db.select({ id: suppliers.id, code: suppliers.code, name: suppliers.name }).from(suppliers).where(eq(suppliers.companyId, companyId)),
  ]);
  return { projects: projectRows, suppliers: supplierRows };
}

export function makeInternalNumber(prefix: 'DOC' | 'REC', now = new Date()) {
  const year = now.getUTCFullYear();
  const suffix = crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase();
  return `${prefix}-${year}-${suffix}`;
}

export async function writeDocumentAudit(input: { companyId: string; userId: string; action: string; documentId: string; oldValue?: unknown; newValue?: unknown }) {
  await getDb().insert(auditLogs).values({
    id: crypto.randomUUID(), companyId: input.companyId, userId: input.userId, action: input.action,
    entityType: 'document', entityId: input.documentId,
    oldValueJson: input.oldValue === undefined ? null : JSON.stringify(input.oldValue),
    newValueJson: input.newValue === undefined ? null : JSON.stringify(input.newValue), occurredAt: new Date(),
  });
}
