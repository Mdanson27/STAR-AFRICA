import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { OcrReview } from '@/components/documents/ocr-review';
import { getDocumentOptions, getDocumentWorkspace } from '@/lib/documents/server';
import { requireAuthorizedSession } from '@/lib/security/session';

export const metadata: Metadata = { title: 'OCR review' };
export const dynamic = 'force-dynamic';
export default async function DocumentReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAuthorizedSession('documents.verify', `/documents/${id}/review`);
  const [workspace, options] = await Promise.all([getDocumentWorkspace('company-star-africa', id), getDocumentOptions('company-star-africa')]);
  if (!workspace) notFound();
  return <AppShell active="Documents & OCR" user={session}><OcrReview document={JSON.parse(JSON.stringify(workspace.document))} initialExtraction={workspace.latestExtraction} options={options} /></AppShell>;
}
