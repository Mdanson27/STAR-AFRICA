import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { DocumentsRegister } from '@/components/documents/documents-register';
import { listDocuments } from '@/lib/documents/server';
import { requireAuthorizedSession } from '@/lib/security/session';

export const metadata: Metadata = { title: 'Documents & OCR' };
export const dynamic = 'force-dynamic';

export default async function DocumentsPage() {
  const session = await requireAuthorizedSession('documents.view', '/documents');
  const rows = await listDocuments('company-star-africa');
  return <AppShell active="Documents & OCR" user={session}>
    <DocumentsRegister documents={rows.map((row) => ({ ...row, uploadedAt: row.uploadedAt.toISOString(), documentDate: row.documentDate?.toISOString() ?? null }))} permissions={session.permissions} />
  </AppShell>;
}
