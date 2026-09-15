import { NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { documents, ocrJobs } from '@/db/schema';
import { getSession } from '@/lib/security/session';
import { hasPermission } from '@/lib/security/permissions';
import { writeDocumentAudit } from '@/lib/documents/server';
import type { OcrExtraction } from '@/lib/documents/types';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in is required.' }, { status: 401 });
  if (!hasPermission(session.permissions, 'documents.edit')) return NextResponse.json({ error: 'You do not have permission to save review changes.' }, { status: 403 });
  const { id } = await params; const extraction = await request.json() as OcrExtraction; const db = getDb();
  const [document] = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.companyId, 'company-star-africa'))).limit(1);
  if (!document) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  const [job] = await db.select({ id: ocrJobs.id }).from(ocrJobs).where(eq(ocrJobs.documentId, id)).orderBy(desc(ocrJobs.createdAt)).limit(1);
  const now = new Date();
  if (job) await db.update(ocrJobs).set({ extractedJson: JSON.stringify(extraction), warningsJson: JSON.stringify(extraction.warnings), status: 'extracted', updatedAt: now }).where(eq(ocrJobs.id, job.id));
  else await db.insert(ocrJobs).values({ id: crypto.randomUUID(), documentId: id, provider: 'Manual entry', providerMode: 'development', status: 'extracted', documentType: extraction.documentType, extractedJson: JSON.stringify(extraction), warningsJson: JSON.stringify(extraction.warnings), confidenceBasisPoints: 0, attempts: 0, createdAt: now, updatedAt: now });
  await db.update(documents).set({ ocrStatus: 'needs_review', updatedAt: now }).where(eq(documents.id, id));
  await writeDocumentAudit({ companyId: document.companyId, userId: session.userId, action: 'document.review.draft_saved', documentId: id });
  return NextResponse.json({ saved: true });
}
