import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { documents } from '@/db/schema';
import { guardApi } from '@/lib/security/api-guard';
import { writeDocumentAudit } from '@/lib/documents/server';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { action?: string; title?: string; category?: string; referenceNumber?: string } | null;
  if (!body) return NextResponse.json({ error: 'Invalid document update.' }, { status: 400 });
  const guard = await guardApi(request, {
    permission: body.action === 'archive' ? 'documents.delete' : 'documents.edit',
    action: body.action === 'archive' ? 'documents.archive' : 'documents.edit',
    maxRequests: 60,
    windowMs: 60_000,
  });
  if ('response' in guard) return guard.response;
  const { session } = guard;
  const db = getDb();
  const [document] = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.companyId, 'company-star-africa'))).limit(1);
  if (!document) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  if (body.action === 'archive') {
    await db.update(documents).set({ archivedAt: new Date(), updatedAt: new Date() }).where(eq(documents.id, id));
    await writeDocumentAudit({ companyId: document.companyId, userId: session.userId, action: 'document.archived', documentId: id, request });
    return NextResponse.json({ archived: true });
  }
  await db.update(documents).set({ title: body.title?.trim() || document.title, category: body.category ?? document.category, referenceNumber: body.referenceNumber?.trim() || null, updatedAt: new Date() }).where(eq(documents.id, id));
  await writeDocumentAudit({ companyId: document.companyId, userId: session.userId, action: 'document.metadata.updated', documentId: id, oldValue: { title: document.title, category: document.category, referenceNumber: document.referenceNumber }, newValue: body, request });
  return NextResponse.json({ updated: true });
}
