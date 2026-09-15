import { AppShell } from '@/components/app-shell';
import { AccessDenied } from '@/components/access-denied';
import { firstPermittedPath } from '@/lib/security/permissions';
import { requireSession } from '@/lib/security/session';

export const dynamic='force-dynamic';
export default async function RestrictedPage(){const session=await requireSession('/access-restricted');return <AppShell active="Access restricted" user={session}><AccessDenied role={session.role} position={session.position} returnTo={firstPermittedPath(session.permissions)}/></AppShell>}
