import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { documents } from '@/db/schema';
import { getSession } from '@/lib/security/session';
import { hasPermission } from '@/lib/security/permissions';
import { writeDocumentAudit } from '@/lib/documents/server';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in is required.' }, { status: 401 });
  if (!hasPermission(session.permissions, 'documents.edit')) return NextResponse.json({ error: 'You do not have permission to edit documents.' }, { status: 403 });
  const { id } = await params;
  const body = await request.json() as { action?: string; title?: string; category?: string; referenceNumber?: string };
  const db = getDb();
  const [document] = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.companyId, 'company-star-africa'))).limit(1);
  if (!document) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  if (body.action === 'archive') {
    if (!hasPermission(session.permissions, 'documents.delete')) return NextResponse.json({ error: 'You do not have permission to archive documents.' }, { status: 403 });
    await db.update(documents).set({ archivedAt: new Date(), updatedAt: new Date() }).where(eq(documents.id, id));
    await writeDocumentAudit({ companyId: document.companyId, userId: session.userId, action: 'document.archived', documentId: id });
    return NextResponse.json({ archived: true });
  }
  await db.update(documents).set({ title: body.title?.trim() || document.title, category: body.category ?? document.category, referenceNumber: body.referenceNumber?.trim() || null, updatedAt: new Date() }).where(eq(documents.id, id));
  await writeDocumentAudit({ companyId: document.companyId, userId: session.userId, action: 'document.metadata.updated', documentId: id, oldValue: { title: document.title, category: document.category, referenceNumber: document.referenceNumber }, newValue: body });
  return NextResponse.json({ updated: true });
}
