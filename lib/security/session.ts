import 'server-only';

import { redirect } from 'next/navigation';
import { hasPermission } from './permissions';
import {
  createProductionSession,
  readProductionSession,
  revokeCurrentSession,
  type ProductionUser,
} from './production-auth';

export type AppSession = ProductionUser;

export async function createSession(
  userId: string,
  request: Request,
  remember: boolean,
) {
  return createProductionSession(userId, request, remember);
}

export async function clearSession(request?: Request) {
  return revokeCurrentSession(request);
}

export async function getSession(): Promise<AppSession | null> {
  try {
    return await readProductionSession();
  } catch {
    return null;
  }
}

export async function requireSession(returnTo = '/dashboard') {
  const session = await getSession();
  if (!session) redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  return session;
}

export async function requireAuthorizedSession(
  permission: string,
  returnTo: string,
) {
  const session = await requireSession(returnTo);
  if (!hasPermission(session.permissions, permission)) {
    redirect(`/access-restricted?from=${encodeURIComponent(returnTo)}`);
  }
  return session;
}
