import 'server-only';

import { neon } from '@neondatabase/serverless';
import { cookies } from 'next/headers';
import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(nodeScrypt);
const COMPANY_ID = 'company-star-africa';
const PROD_COOKIE = '__Host-star_africa_session';
const DEV_COOKIE = 'star_africa_session';

type QueryRow = Record<string, unknown>;

export type ProductionUser = {
  userId: string;
  companyId: string;
  name: string;
  email: string;
  department: string;
  employeeId: string;
  position: string;
  role: string;
  expiresAt: number;
  permissions: readonly string[];
  mustChangePassword: boolean;
};

const roleKeyByLabel: Record<string, string> = {
  'SUPER ADMIN': 'SUPER_ADMIN',
  DIRECTOR: 'DIRECTOR',
  'FINANCE ADMIN': 'FINANCE_ADMIN',
  ACCOUNTANT: 'ACCOUNTANT',
  'PROCUREMENT OFFICER': 'PROCUREMENT_OFFICER',
  'PROJECT MANAGER': 'PROJECT_MANAGER',
  'SITE MANAGER': 'SITE_MANAGER',
  'BIDS & TENDERS OFFICER': 'BIDS_OFFICER',
  'HR / PAYROLL': 'HR_PAYROLL',
  'AUDITOR / VIEWER': 'AUDITOR',
};

function connectionString() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error('DATABASE_URL is not configured.');
  return value;
}

function sqlClient() {
  return neon(connectionString());
}

function cookieName() {
  return process.env.NODE_ENV === 'production' ? PROD_COOKIE : DEV_COOKIE;
}

function securitySalt() {
  const value =
    process.env.STAR_AFRICA_SECURITY_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.DEMO_SESSION_SECRET;
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error('STAR_AFRICA_SECURITY_SECRET is not configured.');
  }
  return value ?? 'local-star-africa-security-secret';
}

export function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function clientIp(request: Request) {
  return (
    request.headers.get('x-nf-client-connection-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export function requestContext(request: Request) {
  const requestId =
    request.headers.get('x-nf-request-id') ||
    request.headers.get('x-request-id') ||
    randomUUID();
  const ipHash = sha256(`${securitySalt()}:ip:${clientIp(request)}`);
  const userAgentHash = sha256(
    `${securitySalt()}:ua:${request.headers.get('user-agent') ?? 'unknown'}`,
  );
  return {
    requestId,
    ipHash,
    userAgentHash,
    route: new URL(request.url).pathname,
    method: request.method,
  };
}

function validPasswordShape(password: string) {
  return (
    password.length >= 12 &&
    password.length <= 128 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export function assertStrongPassword(password: string) {
  if (!validPasswordShape(password)) {
    throw new Error(
      'Password must be 12-128 characters and include upper-case, lower-case, a number and a symbol.',
    );
  }
}

export async function hashPassword(password: string) {
  assertStrongPassword(password);
  const salt = randomBytes(16);
  const N = 16384;
  const r = 8;
  const p = 1;
  const derived = (await scrypt(password, salt, 32, {
    N,
    r,
    p,
    maxmem: 64 * 1024 * 1024,
  })) as Buffer;
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

export async function verifyPassword(password: string, encoded: string | null) {
  if (!encoded) return false;
  const [kind, nText, rText, pText, saltText, hashText] = encoded.split('$');
  if (kind !== 'scrypt' || !nText || !rText || !pText || !saltText || !hashText) {
    return false;
  }
  const salt = Buffer.from(saltText, 'base64url');
  const expected = Buffer.from(hashText, 'base64url');
  const derived = (await scrypt(password, salt, expected.length, {
    N: Number(nText),
    r: Number(rText),
    p: Number(pText),
    maxmem: 64 * 1024 * 1024,
  })) as Buffer;
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export async function checkRateLimit({
  identity,
  action,
  maxAttempts,
  windowMs,
  blockMs,
}: {
  identity: string;
  action: string;
  maxAttempts: number;
  windowMs: number;
  blockMs: number;
}) {
  const sql = sqlClient();
  const now = Date.now();
  const resetBefore = now - windowMs;
  const keyHash = sha256(`${securitySalt()}:rate:${action}:${identity}`);
  const id = sha256(`${action}:${keyHash}`).slice(0, 48);

  const rows = (await sql.query(
    `INSERT INTO rate_limit_buckets
      (id,key_hash,action,window_start,count,blocked_until,updated_at)
     VALUES ($1,$2,$3,$4,1,NULL,$4)
     ON CONFLICT (key_hash,action) DO UPDATE SET
       window_start = CASE
         WHEN rate_limit_buckets.window_start < $5 THEN $4
         ELSE rate_limit_buckets.window_start
       END,
       count = CASE
         WHEN rate_limit_buckets.window_start < $5 THEN 1
         ELSE rate_limit_buckets.count + 1
       END,
       blocked_until = CASE
         WHEN rate_limit_buckets.blocked_until IS NOT NULL
              AND rate_limit_buckets.blocked_until > $4
           THEN rate_limit_buckets.blocked_until
         WHEN (
           CASE WHEN rate_limit_buckets.window_start < $5
             THEN 1 ELSE rate_limit_buckets.count + 1 END
         ) > $6
           THEN $4 + $7
         ELSE NULL
       END,
       updated_at = $4
     RETURNING count, blocked_until, window_start`,
    [id, keyHash, action, now, resetBefore, maxAttempts, blockMs],
  )) as QueryRow[];

  const row = rows[0] ?? {};
  const blockedUntil = Number(row.blocked_until ?? 0);
  const allowed = !blockedUntil || blockedUntil <= now;
  return {
    allowed,
    count: Number(row.count ?? 1),
    retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((blockedUntil - now) / 1000)),
  };
}

export async function logSecurityEvent(
  request: Request,
  eventType: string,
  severity: 'info' | 'warning' | 'critical',
  details: Record<string, unknown> = {},
  userId?: string | null,
  companyId: string | null = COMPANY_ID,
) {
  const sql = sqlClient();
  const ctx = requestContext(request);
  await sql.query(
    `INSERT INTO security_events
      (id,company_id,user_id,event_type,severity,route,method,request_id,ip_hash,user_agent_hash,details_json,occurred_at,resolved_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NULL)`,
    [
      randomUUID(),
      companyId,
      userId ?? null,
      eventType,
      severity,
      ctx.route,
      ctx.method,
      ctx.requestId,
      ctx.ipHash,
      ctx.userAgentHash,
      JSON.stringify(details),
      Date.now(),
    ],
  );
}

export async function writeAuditLog({
  request,
  userId,
  companyId = COMPANY_ID,
  action,
  entityType,
  entityId,
  oldValue,
  newValue,
}: {
  request: Request;
  userId?: string | null;
  companyId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  const sql = sqlClient();
  const ctx = requestContext(request);
  await sql.query(
    `INSERT INTO audit_logs
      (id,company_id,user_id,action,entity_type,entity_id,old_value_json,new_value_json,request_id,ip_hash,occurred_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      randomUUID(),
      companyId,
      userId ?? null,
      action,
      entityType,
      entityId,
      oldValue === undefined ? null : JSON.stringify(oldValue),
      newValue === undefined ? null : JSON.stringify(newValue),
      ctx.requestId,
      ctx.ipHash,
      Date.now(),
    ],
  );
}

function stableRoleKey(roleName: string) {
  return (
    roleKeyByLabel[roleName] ??
    roleName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
  );
}

export async function getUserAuthorization(userId: string, expiresAt: number) {
  const sql = sqlClient();
  const rows = (await sql.query(
    `SELECT
       u.id AS user_id,
       u.company_id,
       u.email,
       u.display_name,
       u.department,
       u.must_change_password,
       r.name AS role_name,
       p.code AS permission,
       e.id AS employee_id,
       pos.name AS position
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     LEFT JOIN role_permissions rp ON rp.role_id = r.id
     LEFT JOIN permissions p ON p.id = rp.permission_id
     LEFT JOIN employees e ON e.user_id = u.id
     LEFT JOIN positions pos ON pos.id = e.position_id
     WHERE u.id = $1 AND u.status = 'active'`,
    [userId],
  )) as QueryRow[];

  if (!rows.length) return null;
  const first = rows[0];
  const roleNames = Array.from(
    new Set(rows.map((row) => String(row.role_name ?? '')).filter(Boolean)),
  );
  const permissions = Array.from(
    new Set(rows.map((row) => String(row.permission ?? '')).filter(Boolean)),
  );
  const role = stableRoleKey(roleNames[0] ?? 'USER');
  if (role === 'SUPER_ADMIN' && !permissions.includes('*')) permissions.push('*');

  return {
    userId: String(first.user_id),
    companyId: String(first.company_id),
    name: String(first.display_name),
    email: String(first.email),
    department: String(first.department ?? ''),
    employeeId: String(first.employee_id ?? first.user_id),
    position: String(first.position ?? roleNames[0] ?? 'User'),
    role,
    expiresAt,
    permissions,
    mustChangePassword: Number(first.must_change_password ?? 0) === 1,
  } satisfies ProductionUser;
}

export async function findUserForLogin(email: string) {
  const sql = sqlClient();
  const rows = (await sql.query(
    `SELECT id, company_id, email, display_name, password_hash,
            failed_login_attempts, locked_until, status
     FROM users
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [email.trim()],
  )) as QueryRow[];
  return rows[0] ?? null;
}

export async function recordFailedLogin(userId: string) {
  const sql = sqlClient();
  const now = Date.now();
  const rows = (await sql.query(
    `UPDATE users SET
       failed_login_attempts = failed_login_attempts + 1,
       locked_until = CASE
         WHEN failed_login_attempts + 1 >= 5 THEN $2
         ELSE locked_until
       END,
       updated_at = $1
     WHERE id = $3
     RETURNING failed_login_attempts, locked_until`,
    [now, now + 15 * 60 * 1000, userId],
  )) as QueryRow[];
  return rows[0] ?? null;
}

export async function recordSuccessfulLogin(userId: string) {
  const sql = sqlClient();
  const now = Date.now();
  await sql.query(
    `UPDATE users SET
       failed_login_attempts = 0,
       locked_until = NULL,
       last_login_at = $1,
       updated_at = $1
     WHERE id = $2`,
    [now, userId],
  );
}

export async function createProductionSession(
  userId: string,
  request: Request,
  remember: boolean,
) {
  const sql = sqlClient();
  const now = Date.now();
  const expiresAt = now + (remember ? 7 * 24 : 12) * 60 * 60 * 1000;
  const token = randomBytes(32).toString('base64url');
  const tokenHash = sha256(`${securitySalt()}:session:${token}`);
  const ctx = requestContext(request);

  await sql.query(
    `INSERT INTO auth_sessions
      (id,company_id,user_id,token_hash,expires_at,last_seen_at,revoked_at,ip_hash,user_agent_hash,created_at,updated_at)
     SELECT $1,u.company_id,u.id,$2,$3,$4,NULL,$5,$6,$4,$4
     FROM users u WHERE u.id = $7`,
    [
      randomUUID(),
      tokenHash,
      expiresAt,
      now,
      ctx.ipHash,
      ctx.userAgentHash,
      userId,
    ],
  );

  const jar = await cookies();
  jar.set(cookieName(), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(expiresAt),
  });

  return getUserAuthorization(userId, expiresAt);
}

export async function readProductionSession() {
  const token = (await cookies()).get(cookieName())?.value;
  if (!token) return null;
  const sql = sqlClient();
  const tokenHash = sha256(`${securitySalt()}:session:${token}`);
  const now = Date.now();

  const rows = (await sql.query(
    `SELECT id,user_id,expires_at,last_seen_at
     FROM auth_sessions
     WHERE token_hash = $1
       AND revoked_at IS NULL
       AND expires_at > $2
     LIMIT 1`,
    [tokenHash, now],
  )) as QueryRow[];
  const session = rows[0];
  if (!session) return null;

  const lastSeen = Number(session.last_seen_at ?? 0);
  if (now - lastSeen > 15 * 60 * 1000) {
    await sql.query(
      'UPDATE auth_sessions SET last_seen_at = $1, updated_at = $1 WHERE id = $2',
      [now, session.id],
    );
  }
  return getUserAuthorization(String(session.user_id), Number(session.expires_at));
}

export async function revokeCurrentSession(request?: Request) {
  const jar = await cookies();
  const token = jar.get(cookieName())?.value;
  if (token) {
    const sql = sqlClient();
    const tokenHash = sha256(`${securitySalt()}:session:${token}`);
    await sql.query(
      'UPDATE auth_sessions SET revoked_at = $1, updated_at = $1 WHERE token_hash = $2 AND revoked_at IS NULL',
      [Date.now(), tokenHash],
    );
  }
  jar.delete(cookieName());
  if (request) {
    await logSecurityEvent(request, 'auth.logout', 'info').catch(() => undefined);
  }
}

export async function revokeAllUserSessions(userId: string) {
  const sql = sqlClient();
  const now = Date.now();
  await sql.query(
    'UPDATE auth_sessions SET revoked_at = $1, updated_at = $1 WHERE user_id = $2 AND revoked_at IS NULL',
    [now, userId],
  );
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  nextPassword: string,
  request: Request,
) {
  assertStrongPassword(nextPassword);
  const sql = sqlClient();
  const rows = (await sql.query(
    'SELECT password_hash FROM users WHERE id = $1 AND status = \'active\' LIMIT 1',
    [userId],
  )) as QueryRow[];
  const currentHash = String(rows[0]?.password_hash ?? '');
  if (!(await verifyPassword(currentPassword, currentHash))) {
    await logSecurityEvent(request, 'auth.password_change_failed', 'warning', {}, userId);
    throw new Error('Current password is incorrect.');
  }
  const nextHash = await hashPassword(nextPassword);
  const now = Date.now();
  await sql.query(
    `UPDATE users SET password_hash=$1,must_change_password=0,password_changed_at=$2,updated_at=$2 WHERE id=$3`,
    [nextHash, now, userId],
  );
  await revokeAllUserSessions(userId);
  await writeAuditLog({
    request,
    userId,
    action: 'password.changed',
    entityType: 'user',
    entityId: userId,
    newValue: { passwordChangedAt: now },
  });
}
