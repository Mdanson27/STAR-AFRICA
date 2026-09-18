import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';
import { AppShell } from '@/components/app-shell';
import { NewProjectForm } from '@/components/projects/new-project-form';
import { getDb } from '@/db';
import { roles, userRoles, users } from '@/db/schema';
import { requireAuthorizedSession } from '@/lib/security/session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'New Project' };

export default async function NewProjectPage() {
  const session = await requireAuthorizedSession(
    'projects.create',
    '/projects/new',
  );
  const db = getDb();
  const members = await db
    .select({
      id: users.id,
      name: users.displayName,
      role: roles.name,
      department: users.department,
    })
    .from(users)
    .innerJoin(userRoles, eq(userRoles.userId, users.id))
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(users.status, 'active'));

  return (
    <AppShell active="Projects" user={session}>
      <NewProjectForm teamMembers={members} />
    </AppShell>
  );
}
