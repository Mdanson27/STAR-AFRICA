import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { DocumentDetail } from '@/components/documents/document-detail';
import { getDocumentWorkspace } from '@/lib/documents/server';
import { requireAuthorizedSession } from '@/lib/security/session';

export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> { const { id } = await params; return { title: `Document ${id.slice(0, 8)}` }; }
export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const session = await requireAuthorizedSession('documents.view', `/documents/${id}`); const workspace = await getDocumentWorkspace('company-star-africa', id); if (!workspace) notFound();
  return <AppShell active="Documents & OCR" user={session}><DocumentDetail workspace={JSON.parse(JSON.stringify(workspace))} permissions={session.permissions} /></AppShell>;
}
