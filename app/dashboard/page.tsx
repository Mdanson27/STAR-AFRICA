import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { ExecutiveDashboard } from '@/components/executive-dashboard';
import { requireSession } from '@/lib/security/session';
import { hasPermission } from '@/lib/security/permissions';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Executive Dashboard'};
export default async function DashboardPage(){
  const session=await requireSession('/dashboard');
  if(!hasPermission(session.permissions,'dashboard.executive.view'))redirect('/access-restricted?from=/dashboard');
  return <AppShell active="Dashboard" user={session}><ExecutiveDashboard firstName={session.name.split(' ')[0]}/></AppShell>;
}
