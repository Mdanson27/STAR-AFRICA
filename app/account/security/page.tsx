import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { AccountSecurityForm } from '@/components/account-security-form';
import { requireSession } from '@/lib/security/session';

export const metadata: Metadata = { title: 'Account security' };
export const dynamic = 'force-dynamic';

export default async function AccountSecurityPage() {
  const session = await requireSession('/account/security');
  return (
    <AppShell active="Account security" user={session}>
      <div className="workspace-page account-security-page">
        <AccountSecurityForm mustChangePassword={session.mustChangePassword} />
      </div>
    </AppShell>
  );
}
