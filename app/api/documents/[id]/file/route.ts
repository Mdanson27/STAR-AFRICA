import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { documents } from '@/db/schema';
import { getSession } from '@/lib/security/session';
import { hasPermission } from '@/lib/security/permissions';
import { getFileStorageProvider } from '@/lib/documents/storage';
import { writeDocumentAudit } from '@/lib/documents/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in is required.' }, { status: 401 });
  const download = new URL(request.url).searchParams.get('download') === '1';
  if (!hasPermission(session.permissions, download ? 'documents.download' : 'documents.view')) return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
  const { id } = await params;
  const [document] = await getDb().select().from(documents).where(and(eq(documents.id, id), eq(documents.companyId, 'company-star-africa'))).limit(1);
  if (!document) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  const object = await getFileStorageProvider().get(document.storageKey);
  if (!object) return NextResponse.json({ error: 'The original file is missing from private storage.' }, { status: 404 });
  if (download) await writeDocumentAudit({ companyId: document.companyId, userId: session.userId, action: 'document.downloaded', documentId: id });
  const headers = new Headers();
  headers.set('Content-Type', document.mimeType);
  headers.set('Content-Length', String(document.sizeBytes));
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${encodeURIComponent(document.originalFilename)}"`);
  return new Response(object.body, { headers });
}
