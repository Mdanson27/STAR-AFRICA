import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { ReceiptScanner } from '@/components/documents/receipt-scanner';
import { getDocumentOptions } from '@/lib/documents/server';
import { requireAuthorizedSession } from '@/lib/security/session';

export const metadata: Metadata = { title: 'Scan receipt' };
export const dynamic = 'force-dynamic';
export default async function ScanReceiptPage() {
  const session = await requireAuthorizedSession('documents.upload', '/documents/scan');
  const options = await getDocumentOptions('company-star-africa');
  return <AppShell active="Documents & OCR" user={session}><ReceiptScanner projects={options.projects} /></AppShell>;
}
