import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DigitizedReceipt } from '@/components/documents/digitized-receipt';
import { getDocumentWorkspace } from '@/lib/documents/server';
import { requireAuthorizedSession } from '@/lib/security/session';

export const metadata: Metadata = { title: 'Digitized receipt record' };
export const dynamic = 'force-dynamic';
export default async function DigitizedReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; await requireAuthorizedSession('documents.view', `/documents/${id}/receipt`); const workspace = await getDocumentWorkspace('company-star-africa', id); if (!workspace?.receipt) notFound();
  return <DigitizedReceipt workspace={JSON.parse(JSON.stringify(workspace))} />;
}
