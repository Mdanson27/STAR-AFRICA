import { NextResponse } from 'next/server';
import { createDemoSession } from '@/lib/security/session';
import { DEMO_PASSWORD, findDemoAccount } from '@/lib/security/demo-accounts';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string; remember?: boolean } | null;
  if (!body?.email || body.password !== DEMO_PASSWORD || !findDemoAccount(body.email)) {
    return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 });
  }
  try {
    const account = await createDemoSession(body.email, Boolean(body.remember));
    return NextResponse.json({ ok: true, account: { name: account.name, role: account.role } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to sign in.' }, { status: 503 });
  }
}
