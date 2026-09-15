import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { DocumentUpload } from '@/components/documents/document-upload';
import { getDocumentOptions } from '@/lib/documents/server';
import { requireAuthorizedSession } from '@/lib/security/session';

export const metadata: Metadata = { title: 'Upload document' };
export const dynamic = 'force-dynamic';
export default async function UploadDocumentPage() {
  const session = await requireAuthorizedSession('documents.upload', '/documents/upload');
  const options = await getDocumentOptions('company-star-africa');
  return <AppShell active="Documents & OCR" user={session}><DocumentUpload options={options} /></AppShell>;
}
