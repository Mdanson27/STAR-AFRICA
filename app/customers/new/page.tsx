import { env } from 'cloudflare:workers';
import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { CustomerForm } from '@/components/customers/customer-form';
import { requireAuthorizedSession } from '@/lib/security/session';
export const metadata: Metadata = { title: 'New customer' };
export const dynamic = 'force-dynamic';
export default async function NewCustomerPage() {
  const session = await requireAuthorizedSession(
    'customers.create',
    '/customers/new',
  );
  const users = await env.DB.prepare(
    "SELECT id,display_name FROM users WHERE company_id=? AND status='active' ORDER BY display_name",
  )
    .bind('company-star-africa')
    .all();
  return (
    <AppShell active="Customers & sales" user={session}>
      <CustomerForm
        managers={users.results as Array<{ id: string; display_name: string }>}
      />
    </AppShell>
  );
}
