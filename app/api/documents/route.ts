import { NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '@/db';
import { documentLinks, documents } from '@/db/schema';
import { guardApi } from '@/lib/security/api-guard';
import { getFileStorageProvider } from '@/lib/documents/storage';
import { documentCategories } from '@/lib/documents/types';
import { sanitizeFilename, sha256Hex, validateDocumentFile } from '@/lib/documents/validation';
import { makeInternalNumber, writeDocumentAudit } from '@/lib/documents/server';

export async function POST(request: Request) {
  const guard = await guardApi(request, {
    permission: 'documents.upload',
    action: 'documents.upload',
    maxRequests: 20,
    windowMs: 60 * 60 * 1000,
    blockMs: 15 * 60 * 1000,
  });
  if ('response' in guard) return guard.response;
  const { session } = guard;
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a document to upload.' }, { status: 400 });
    const bytes = await file.arrayBuffer();
    const validationError = validateDocumentFile(file, bytes);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
    const sha256 = await sha256Hex(bytes);
    const db = getDb();
    const [duplicate] = await db.select({ id: documents.id, internalNumber: documents.internalNumber, title: documents.title })
      .from(documents).where(and(eq(documents.companyId, 'company-star-africa'), eq(documents.sha256, sha256), isNull(documents.archivedAt))).limit(1);
    if (duplicate && form.get('allowDuplicate') !== 'true') return NextResponse.json({ error: 'This file appears to have already been uploaded.', duplicate }, { status: 409 });
    const formString = (key: string) => { const value = form.get(key); return typeof value === 'string' ? value : ''; };
    const category = formString('category') || 'Other';
    if (!documentCategories.includes(category as (typeof documentCategories)[number])) return NextResponse.json({ error: 'Choose a valid document category.' }, { status: 400 });
    const id = crypto.randomUUID();
    const internalNumber = makeInternalNumber('DOC');
    const safeName = sanitizeFilename(file.name);
    const storageKey = `company-star-africa/documents/${new Date().getUTCFullYear()}/${id}/${safeName}`;
    const storage = getFileStorageProvider();
    await storage.put({ key: storageKey, bytes, contentType: file.type, metadata: { documentId: id, sha256 } });
    const now = new Date();
    const ocrRequired = form.get('ocrRequired') === 'true';
    const relatedModule = formString('relatedModule').trim() || null;
    const relatedRecordId = formString('relatedRecordId').trim() || null;
    try {
      await db.insert(documents).values({
        id, companyId: 'company-star-africa', internalNumber, storageKey, filename: safeName,
        originalFilename: file.name, mimeType: file.type, sizeBytes: file.size, sha256,
        title: formString('title').trim() || file.name.replace(/\.[^.]+$/, ''), category,
        referenceNumber: formString('referenceNumber').trim() || null,
        documentDate: formString('documentDate') ? new Date(formString('documentDate')) : null,
        description: formString('description').trim() || null,
        relatedModule, relatedRecordId,
        tagsJson: JSON.stringify(formString('tags').split(',').map((tag) => tag.trim()).filter(Boolean)),
        notes: formString('notes').trim() || null, ocrRequired,
        uploadedBy: session.userId, ocrStatus: ocrRequired ? 'queued' : 'not_required', verificationStatus: 'pending',
        createdAt: now, updatedAt: now,
      });
      if (relatedModule && relatedRecordId) await db.insert(documentLinks).values({ id: crypto.randomUUID(), documentId: id, entityType: relatedModule, entityId: relatedRecordId, relationship: 'supporting_document', createdAt: now });
      await writeDocumentAudit({ companyId: 'company-star-africa', userId: session.userId, action: 'document.uploaded', documentId: id, newValue: { internalNumber, category, fileName: file.name } });
    } catch (error) {
      await storage.delete(storageKey);
      throw error;
    }
    return NextResponse.json({ id, internalNumber, ocrRequired }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'The upload could not be saved.' }, { status: 500 });
  }
}
