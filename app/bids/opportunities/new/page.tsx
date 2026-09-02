import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { NewOpportunityForm } from '@/components/bids/new-opportunity-form';
import { requireSession } from '@/lib/security/session';
import { hasPermission } from '@/lib/security/permissions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'New Opportunity' };

export default async function NewOpportunityPage() {
  const session=await requireSession('/bids/opportunities/new');
  if (!hasPermission(session.permissions,'bids.create')) redirect('/bids?permission=denied');
  return <AppShell active="Bids & tenders" user={{name:session.name,role:session.role}}><NewOpportunityForm/></AppShell>;
}
