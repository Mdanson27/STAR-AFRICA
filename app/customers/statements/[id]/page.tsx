import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CustomerStatement } from '@/components/customers/customer-statement';
import { getStatement } from '@/lib/customers/server';
import { requireAuthorizedSession } from '@/lib/security/session';
export const metadata: Metadata = { title: 'Customer statement' };
export const dynamic = 'force-dynamic';
export default async function StatementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAuthorizedSession(
    'customers.financials.view',
    `/customers/statements/${id}`,
  );
  const data = await getStatement(id);
  if (!data) notFound();
  return <CustomerStatement data={JSON.parse(JSON.stringify(data))} />;
}
