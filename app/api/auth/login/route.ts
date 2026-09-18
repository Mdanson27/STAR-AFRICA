import { NextResponse } from 'next/server';
import { createSession } from '@/lib/security/session';
import { firstPermittedPath } from '@/lib/security/permissions';
import {
  checkRateLimit,
  findUserForLogin,
  logSecurityEvent,
  recordFailedLogin,
  recordSuccessfulLogin,
  requestContext,
  verifyPassword,
  writeAuditLog,
} from '@/lib/security/production-auth';

type LoginBody = {
  email?: string;
  password?: string;
  remember?: boolean;
};

function safeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase().slice(0, 320) : '';
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LoginBody | null;
  const email = safeEmail(body?.email);
  const password = typeof body?.password === 'string' ? body.password : '';
  const ctx = requestContext(request);

  if (!email || !password || password.length > 128) {
    return NextResponse.json(
      { error: 'Email or password is incorrect.' },
      { status: 401 },
    );
  }

  const [ipLimit, emailLimit] = await Promise.all([
    checkRateLimit({
      identity: ctx.ipHash,
      action: 'login.ip',
      maxAttempts: 20,
      windowMs: 15 * 60 * 1000,
      blockMs: 30 * 60 * 1000,
    }),
    checkRateLimit({
      identity: email,
      action: 'login.email',
      maxAttempts: 8,
      windowMs: 15 * 60 * 1000,
      blockMs: 30 * 60 * 1000,
    }),
  ]);

  if (!ipLimit.allowed || !emailLimit.allowed) {
    await logSecurityEvent(request, 'auth.rate_limited', 'warning', {
      emailHash: ctx.ipHash.slice(0, 16),
    }).catch(() => undefined);
    const retryAfter = Math.max(
      ipLimit.retryAfterSeconds,
      emailLimit.retryAfterSeconds,
      60,
    );
    return NextResponse.json(
      { error: 'Too many sign-in attempts. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      },
    );
  }

  const user = await findUserForLogin(email);
  const now = Date.now();
  const lockedUntil = Number(user?.locked_until ?? 0);
  const active = String(user?.status ?? '') === 'active';
  const passwordOk =
    active &&
    (!lockedUntil || lockedUntil <= now) &&
    (await verifyPassword(password, String(user?.password_hash ?? '')));

  if (!user || !passwordOk) {
    if (user?.id) {
      const failed = await recordFailedLogin(String(user.id));
      if (Number(failed?.locked_until ?? 0) > now) {
        await logSecurityEvent(
          request,
          'auth.account_locked',
          'warning',
          { failedAttempts: Number(failed?.failed_login_attempts ?? 0) },
          String(user.id),
          String(user.company_id ?? 'company-star-africa'),
        ).catch(() => undefined);
      }
    } else {
      await logSecurityEvent(request, 'auth.unknown_account_attempt', 'warning', {
        emailHash: ctx.ipHash.slice(0, 16),
      }).catch(() => undefined);
    }
    return NextResponse.json(
      { error: 'Email or password is incorrect.' },
      { status: 401 },
    );
  }

  const userId = String(user.id);
  await recordSuccessfulLogin(userId);
  const session = await createSession(userId, request, Boolean(body?.remember));

  if (!session) {
    await logSecurityEvent(
      request,
      'auth.session_creation_failed',
      'critical',
      {},
      userId,
      String(user.company_id ?? 'company-star-africa'),
    ).catch(() => undefined);
    return NextResponse.json(
      { error: 'Unable to establish a secure session.' },
      { status: 503 },
    );
  }

  await Promise.all([
    logSecurityEvent(
      request,
      'auth.login_success',
      'info',
      { role: session.role },
      session.userId,
      session.companyId,
    ),
    writeAuditLog({
      request,
      userId: session.userId,
      companyId: session.companyId,
      action: 'auth.login',
      entityType: 'user',
      entityId: session.userId,
      newValue: { role: session.role },
    }),
  ]).catch(() => undefined);

  return NextResponse.json({
    ok: true,
    landingPath: session.mustChangePassword
      ? '/account/security'
      : firstPermittedPath(session.permissions),
    account: {
      name: session.name,
      role: session.role,
      position: session.position,
    },
    mustChangePassword: session.mustChangePassword,
  });
}
