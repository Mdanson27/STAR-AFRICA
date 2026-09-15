import { NextResponse } from 'next/server';
import { createDemoSession } from '@/lib/security/session';
import { DEMO_PASSWORD, findDemoAccount } from '@/lib/security/demo-accounts';
import { defaultRolePermissions, firstPermittedPath } from '@/lib/security/permissions';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string; remember?: boolean } | null;
  if (!body?.email || body.password !== DEMO_PASSWORD || !findDemoAccount(body.email)) {
    return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 });
  }
  try {
    const account = await createDemoSession(body.email, Boolean(body.remember));
    return NextResponse.json({ ok: true, landingPath:firstPermittedPath(defaultRolePermissions[account.role]??[]), account: { name: account.name, role: account.role, position:account.position } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to sign in.' }, { status: 503 });
  }
}
