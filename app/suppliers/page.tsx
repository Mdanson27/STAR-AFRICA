import type { Metadata } from 'next';
import { asc, eq } from 'drizzle-orm';
import { AppShell } from '@/components/app-shell';
import { SuppliersWorkspace } from '@/components/suppliers/suppliers-workspace';
import { getDb } from '@/db';
import { suppliers } from '@/db/schema';
import { requireAuthorizedSession } from '@/lib/security/session';
import { hasPermission } from '@/lib/security/permissions';

export const metadata: Metadata = { title: 'Suppliers' };
export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  const session = await requireAuthorizedSession('suppliers.view', '/suppliers');
  const db = getDb();
  const rows = await db
    .select({
      id: suppliers.id,
      code: suppliers.code,
      name: suppliers.name,
      tin: suppliers.tin,
      vatRegistered: suppliers.vatRegistered,
      creditTermsDays: suppliers.creditTermsDays,
      email: suppliers.email,
      phone: suppliers.phone,
      address: suppliers.address,
      fax: suppliers.fax,
      status: suppliers.status,
      sourceSystem: suppliers.sourceSystem,
      sourceRef: suppliers.sourceRef,
      sourceImportedAt: suppliers.sourceImportedAt,
    })
    .from(suppliers)
    .where(eq(suppliers.status, 'active'))
    .orderBy(asc(suppliers.name));

  return (
    <AppShell active="Suppliers" user={session}>
      <SuppliersWorkspace
        rows={rows.map((row) => ({
          ...row,
          sourceImportedAt: row.sourceImportedAt?.getTime() ?? null,
        }))}
        canCreate={hasPermission(session.permissions, 'suppliers.create')}
      />
    </AppShell>
  );
}
