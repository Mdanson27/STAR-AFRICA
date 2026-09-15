import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { CustomersWorkspace } from '@/components/customers/customers-workspace';
import { getCustomerModuleData } from '@/lib/customers/server';
import { requireAuthorizedSession } from '@/lib/security/session';

export const metadata: Metadata = { title: 'Customers & Sales' };
export const dynamic = 'force-dynamic';
export default async function CustomersPage() {
  const session = await requireAuthorizedSession(
    'customers.view',
    '/customers',
  );
  const data = await getCustomerModuleData();
  return (
    <AppShell active="Customers & sales" user={session}>
      <CustomersWorkspace
        data={JSON.parse(JSON.stringify(data))}
        permissions={session.permissions}
      />
    </AppShell>
  );
}
