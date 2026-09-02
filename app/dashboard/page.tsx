import type { Metadata } from 'next';
import { StarAfricaApp } from '@/components/star-africa-app';
import { requireSession } from '@/lib/security/session';
import { hasPermission } from '@/lib/security/permissions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const session = await requireSession('/dashboard');
  return <StarAfricaApp userName={session.name} userRole={`${session.role} · Demo workspace`} canCreateBids={hasPermission(session.permissions,'bids.create')} />;
}
