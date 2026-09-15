import type { Metadata } from 'next';
import { requireAuthorizedSession } from '@/lib/security/session';
import { AppShell } from '@/components/app-shell';
import { BidsOverview } from '@/components/bids/bids-overview';
import { demoBids } from '@/lib/bids/demo-data';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Bids & Tenders', description: 'Manage opportunities, qualification, preparation, submission and award.' };

export default async function BidsPage() {
  const session = await requireAuthorizedSession('bids.view','/bids');
  return <AppShell active="Bids & tenders" user={session}><BidsOverview bids={demoBids} permissions={[...session.permissions]} /></AppShell>;
}
