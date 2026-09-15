import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { ManualReceiptEntry } from '@/components/documents/manual-receipt-entry';
import { requireAuthorizedSession } from '@/lib/security/session';

export const metadata: Metadata = { title: 'Manual receipt entry' };
export const dynamic = 'force-dynamic';
export default async function ManualReceiptPage() {
  const session = await requireAuthorizedSession('documents.upload', '/documents/manual');
  return <AppShell active="Documents & OCR" user={session}><ManualReceiptEntry /></AppShell>;
}
