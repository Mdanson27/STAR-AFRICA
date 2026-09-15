import { NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { documents, ocrJobs } from '@/db/schema';
import { getSession } from '@/lib/security/session';
import { hasPermission } from '@/lib/security/permissions';
import { getOCRProvider } from '@/lib/documents/ocr';
import { writeDocumentAudit } from '@/lib/documents/server';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in is required.' }, { status: 401 });
  if (!hasPermission(session.permissions, 'documents.ocr')) return NextResponse.json({ error: 'You do not have permission to process OCR.' }, { status: 403 });
  const { id } = await params;
  const db = getDb();
  const [document] = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.companyId, 'company-star-africa'))).limit(1);
  if (!document) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  const [last] = await db.select({ attempts: ocrJobs.attempts }).from(ocrJobs).where(eq(ocrJobs.documentId, id)).orderBy(desc(ocrJobs.createdAt)).limit(1);
  const provider = getOCRProvider();
  const jobId = crypto.randomUUID();
  const now = new Date();
  await db.insert(ocrJobs).values({ id: jobId, documentId: id, provider: provider.name, providerMode: provider.mode, status: 'processing', attempts: (last?.attempts ?? 0) + 1, createdAt: now, updatedAt: now });
  await db.update(documents).set({ ocrStatus: 'processing', updatedAt: now }).where(eq(documents.id, id));
  await writeDocumentAudit({ companyId: document.companyId, userId: session.userId, action: 'document.ocr.started', documentId: id, newValue: { provider: provider.name } });
  try {
    const extraction = await provider.processDocument({ storageKey: document.storageKey, filename: document.originalFilename, mimeType: document.mimeType, category: document.category, documentDate: document.documentDate?.toISOString().slice(0, 10) });
    const status = extraction.warnings.length || extraction.overallConfidence < 80 ? 'needs_review' : 'extracted';
    const completedAt = new Date();
    await db.update(ocrJobs).set({ status: 'extracted', documentType: extraction.documentType, extractedJson: JSON.stringify(extraction), rawText: extraction.rawText, warningsJson: JSON.stringify(extraction.warnings), confidenceBasisPoints: Math.round(extraction.overallConfidence * 100), completedAt, updatedAt: completedAt }).where(eq(ocrJobs.id, jobId));
    await db.update(documents).set({ category: extraction.documentType === 'Unknown' ? document.category : extraction.documentType, rawOcrText: extraction.rawText, ocrStatus: status, updatedAt: completedAt }).where(eq(documents.id, id));
    await writeDocumentAudit({ companyId: document.companyId, userId: session.userId, action: 'document.ocr.completed', documentId: id, newValue: { status, confidence: extraction.overallConfidence } });
    return NextResponse.json({ jobId, extraction, status, provider: { name: provider.name, mode: provider.mode } });
  } catch (error) {
    const failedAt = new Date();
    const message = error instanceof Error ? error.message : 'OCR processing failed.';
    await db.update(ocrJobs).set({ status: 'failed', errorCode: 'OCR_FAILED', errorMessage: message, completedAt: failedAt, updatedAt: failedAt }).where(eq(ocrJobs.id, jobId));
    await db.update(documents).set({ ocrStatus: 'failed', updatedAt: failedAt }).where(eq(documents.id, id));
    await writeDocumentAudit({ companyId: document.companyId, userId: session.userId, action: 'document.ocr.failed', documentId: id, newValue: { message } });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
