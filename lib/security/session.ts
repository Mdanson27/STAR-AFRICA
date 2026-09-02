import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { defaultRolePermissions } from './permissions';
import { findDemoAccount, type DemoRole } from './demo-accounts';

const COOKIE_NAME = 'star_africa_demo_session';
const encoder = new TextEncoder();

export type AppSession = {
  userId: string;
  name: string;
  email: string;
  role: DemoRole;
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
  const payload = encode(JSON.stringify({ userId: account.id, email: account.email, role: account.role, expiresAt }));
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
    const parsed = JSON.parse(decode(payload)) as { userId: string; email: string; role: DemoRole; expiresAt: number };
    if (parsed.expiresAt <= Date.now()) return null;
    const account = findDemoAccount(parsed.email);
    if (!account || account.id !== parsed.userId || account.role !== parsed.role) return null;
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
