import type { Metadata } from 'next';
import { requireSession } from '@/lib/security/session';
import { AppShell } from '@/components/app-shell';
import { BidsOverview } from '@/components/bids/bids-overview';
import { demoBids } from '@/lib/bids/demo-data';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Bids & Tenders', description: 'Manage opportunities, qualification, preparation, submission and award.' };

export default async function BidsPage() {
  const session = await requireSession('/bids');
  return <AppShell active="Bids & tenders" user={{ name:session.name, role:session.role }}><BidsOverview bids={demoBids} permissions={[...session.permissions]} /></AppShell>;
}
