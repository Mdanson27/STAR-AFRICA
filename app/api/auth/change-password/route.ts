import { NextResponse } from 'next/server';
import { getSession } from '@/lib/security/session';
import {
  changePassword,
  checkRateLimit,
  logSecurityEvent,
  requestContext,
} from '@/lib/security/production-auth';
import { assertSameOrigin } from '@/lib/security/request-guards';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ error: 'Request rejected.' }, { status: 403 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { currentPassword?: string; newPassword?: string }
    | null;
  const currentPassword =
    typeof body?.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword =
    typeof body?.newPassword === 'string' ? body.newPassword : '';

  const ctx = requestContext(request);
  const limit = await checkRateLimit({
    identity: `${session.userId}:${ctx.ipHash}`,
    action: 'password.change',
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
    blockMs: 30 * 60 * 1000,
  });

  if (!limit.allowed) {
    await logSecurityEvent(
      request,
      'auth.password_change_rate_limited',
      'warning',
      {},
      session.userId,
      session.companyId,
    ).catch(() => undefined);
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  try {
    await changePassword(
      session.userId,
      currentPassword,
      newPassword,
      request,
    );
    return NextResponse.json({
      ok: true,
      message: 'Password changed. Please sign in again.',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to change password.',
      },
      { status: 400 },
    );
  }
}
