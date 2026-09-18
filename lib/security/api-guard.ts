import 'server-only';

import { NextResponse } from 'next/server';
import { getSession, type AppSession } from './session';
import { hasPermission } from './permissions';
import {
  checkRateLimit,
  logSecurityEvent,
  requestContext,
} from './production-auth';
import { assertSameOrigin } from './request-guards';

type GuardSuccess = { session: AppSession; response?: never };
type GuardFailure = { response: NextResponse; session?: never };

export async function guardApi(
  request: Request,
  {
    permission,
    action,
    maxRequests = 60,
    windowMs = 60_000,
    blockMs = 5 * 60_000,
    allowDuringPasswordChange = false,
  }: {
    permission?: string;
    action: string;
    maxRequests?: number;
    windowMs?: number;
    blockMs?: number;
    allowDuringPasswordChange?: boolean;
  },
): Promise<GuardSuccess | GuardFailure> {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    try {
      assertSameOrigin(request);
    } catch {
      await logSecurityEvent(request, 'request.cross_origin_rejected', 'warning', {
        action,
      }).catch(() => undefined);
      return {
        response: NextResponse.json({ error: 'Request rejected.' }, { status: 403 }),
      };
    }
  }

  const session = await getSession();
  if (!session) {
    return {
      response: NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 },
      ),
    };
  }

  if (session.mustChangePassword && !allowDuringPasswordChange) {
    return {
      response: NextResponse.json(
        {
          error: 'Update your temporary password before continuing.',
          code: 'PASSWORD_CHANGE_REQUIRED',
        },
        { status: 428 },
      ),
    };
  }

  if (permission && !hasPermission(session.permissions, permission)) {
    await logSecurityEvent(
      request,
      'authorization.denied',
      'warning',
      { permission, action },
      session.userId,
      session.companyId,
    ).catch(() => undefined);
    return {
      response: NextResponse.json(
        { error: 'You do not have permission to perform this action.' },
        { status: 403 },
      ),
    };
  }

  const ctx = requestContext(request);
  const limit = await checkRateLimit({
    identity: `${session.userId}:${ctx.ipHash}`,
    action,
    maxAttempts: maxRequests,
    windowMs,
    blockMs,
  });

  if (!limit.allowed) {
    await logSecurityEvent(
      request,
      'request.rate_limited',
      'warning',
      { action },
      session.userId,
      session.companyId,
    ).catch(() => undefined);
    return {
      response: NextResponse.json(
        { error: 'Too many requests. Please wait and try again.' },
        {
          status: 429,
          headers: { 'Retry-After': String(limit.retryAfterSeconds) },
        },
      ),
    };
  }

  return { session };
}
