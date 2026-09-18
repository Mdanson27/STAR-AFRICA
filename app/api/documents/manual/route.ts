import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { documents, ocrJobs } from '@/db/schema';
import { guardApi } from '@/lib/security/api-guard';
import { makeInternalNumber, writeDocumentAudit } from '@/lib/documents/server';
import { emptyReceiptFields } from '@/lib/documents/types';

export async function POST(request: Request) {
  const guard = await guardApi(request, {
    permission: 'documents.upload',
    action: 'documents.manual',
    maxRequests: 40,
    windowMs: 60 * 60 * 1000,
  });
  if ('response' in guard) return guard.response;
  const { session } = guard;
  const id = crypto.randomUUID(); const now = new Date(); const internalNumber = makeInternalNumber('DOC'); const db = getDb();
  await db.insert(documents).values({ id, companyId: 'company-star-africa', internalNumber, storageKey: `manual:${id}`, filename: 'manual-receipt', originalFilename: 'No original attached', mimeType: 'application/x-star-africa-manual', sizeBytes: 0, sha256: `manual-${id}`, title: 'Manual receipt entry', category: 'Receipt', ocrRequired: false, uploadedBy: session.userId, ocrStatus: 'needs_review', verificationStatus: 'pending', createdAt: now, updatedAt: now });
  const extraction = { documentType: 'Receipt', fields: emptyReceiptFields, lineItems: [], fieldConfidence: {}, overallConfidence: 0, warnings: ['Manual receipt entry: verify values and attach supporting evidence when available.'], rawText: '' };
  await db.insert(ocrJobs).values({ id: crypto.randomUUID(), documentId: id, provider: 'Manual entry', providerMode: 'development', status: 'extracted', documentType: 'Receipt', extractedJson: JSON.stringify(extraction), warningsJson: JSON.stringify(extraction.warnings), confidenceBasisPoints: 0, attempts: 0, createdAt: now, updatedAt: now });
  await writeDocumentAudit({ companyId: 'company-star-africa', userId: session.userId, action: 'document.manual_entry_started', documentId: id });
  return NextResponse.json({ id, internalNumber }, { status: 201 });
}
