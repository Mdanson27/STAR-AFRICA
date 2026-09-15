import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { defaultRolePermissions, hasPermission } from './permissions';
import { findDemoAccount, type DemoRole } from './demo-accounts';
import { getDb } from '@/db';
import { employees, permissions, positions, rolePermissions, roles, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const COOKIE_NAME = 'star_africa_demo_session';
const encoder = new TextEncoder();

export type AppSession = {
  userId: string;
  name: string;
  email: string;
  role: DemoRole;
  position: string;
  employeeId: string;
  department: string;
  expiresAt: number;
  permissions: readonly string[];
};

function demoModeEnabled() {
  return process.env.NODE_ENV !== 'production' || process.env.STAR_AFRICA_DEMO_MODE === 'true';
}

function sessionSecret() {
  const configured = process.env.DEMO_SESSION_SECRET;
  if (configured) return configured;
  if (process.env.NODE_ENV !== 'production') return 'star-africa-local-demo-session-secret-change-me';
  throw new Error('Demo authentication is not configured for this environment.');
}

function encode(value: string) {
  return btoa(value).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function decode(value: string) {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - (value.length % 4)) % 4);
  return atob(padded);
}

async function signature(payload: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(sessionSecret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return encode(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)))));
}

export async function createDemoSession(email: string, remember: boolean) {
  if (!demoModeEnabled()) throw new Error('Demo access is disabled in this environment.');
  const account = findDemoAccount(email);
  if (!account) throw new Error('Invalid demo credentials.');
  const expiresAt = Date.now() + (remember ? 7 : 0.5) * 24 * 60 * 60 * 1000;
  const payload = encode(JSON.stringify({ userId: account.id, email: account.email, expiresAt }));
  const value = `${payload}.${await signature(payload)}`;
  const jar = await cookies();
  jar.set(COOKIE_NAME, value, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', expires: new Date(expiresAt) });
  return account;
}

export async function clearDemoSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSession(): Promise<AppSession | null> {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return null;
  const [payload, suppliedSignature] = value.split('.');
  if (!payload || !suppliedSignature || suppliedSignature !== await signature(payload)) return null;
  try {
    const parsed = JSON.parse(decode(payload)) as { userId: string; email: string; expiresAt: number };
    if (parsed.expiresAt <= Date.now()) return null;
    const account = findDemoAccount(parsed.email);
    if (!account || account.id !== parsed.userId) return null;
    try {
      const rows=await getDb().select({employeeId:employees.id,position:positions.name,role:roles.name,permission:permissions.code})
        .from(users).innerJoin(employees,eq(employees.userId,users.id)).innerJoin(positions,eq(employees.positionId,positions.id))
        .innerJoin(roles,eq(positions.roleId,roles.id)).leftJoin(rolePermissions,eq(rolePermissions.roleId,roles.id))
        .leftJoin(permissions,eq(rolePermissions.permissionId,permissions.id)).where(eq(users.id,parsed.userId));
      if(rows.length){const role=rows[0].role as DemoRole;return {...account,userId:account.id,employeeId:rows[0].employeeId,position:rows[0].position,role,expiresAt:parsed.expiresAt,permissions:role==='SUPER_ADMIN'?['*']:rows.flatMap((row)=>row.permission?[row.permission]:[])};}
    } catch {
      // Development demo fallback: the server-owned directory is authoritative until D1 migrations are applied.
    }
    return { ...account, userId: account.id, expiresAt: parsed.expiresAt, permissions: defaultRolePermissions[account.role] ?? [] };
  } catch {
    return null;
  }
}

export async function requireSession(returnTo = '/dashboard') {
  const session = await getSession();
  if (!session) redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  return session;
}

export async function requireAuthorizedSession(permission:string,returnTo:string){
  const session=await requireSession(returnTo);
  if(!hasPermission(session.permissions,permission))redirect(`/access-restricted?from=${encodeURIComponent(returnTo)}`);
  return session;
}
