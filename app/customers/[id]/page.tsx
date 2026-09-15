import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { CustomerDetail } from '@/components/customers/customer-detail';
import { getCustomerWorkspace } from '@/lib/customers/server';
import { requireAuthorizedSession } from '@/lib/security/session';
export const dynamic = 'force-dynamic';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Customer ${id.slice(0, 8)}` };
}
export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuthorizedSession(
    'customers.view',
    `/customers/${id}`,
  );
  const workspace = await getCustomerWorkspace(id);
  if (!workspace) notFound();
  return (
    <AppShell active="Customers & sales" user={session}>
      <CustomerDetail
        workspace={JSON.parse(JSON.stringify(workspace))}
        permissions={session.permissions}
      />
    </AppShell>
  );
}
