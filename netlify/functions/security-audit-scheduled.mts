import type { Config } from '@netlify/functions';
import pg from 'pg';
import { createHash, randomUUID } from 'node:crypto';

const { Client } = pg;

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

async function recordEvent(
  databaseUrl: string,
  eventType: string,
  severity: 'info' | 'warning' | 'critical',
  details: Record<string, unknown>,
) {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(
      `INSERT INTO security_events
        (id,company_id,user_id,event_type,severity,route,method,request_id,ip_hash,user_agent_hash,details_json,occurred_at,resolved_at)
       VALUES ($1,'company-star-africa',NULL,$2,$3,'system/security-audit','SYSTEM',$4,NULL,NULL,$5,$6,NULL)`,
      [
        randomUUID(),
        eventType,
        severity,
        randomUUID(),
        JSON.stringify(details),
        Date.now(),
      ],
    );
  } finally {
    await client.end();
  }
}

export default async () => {
  const baseUrl =
    Netlify.env.get('URL') ||
    Netlify.env.get('DEPLOY_PRIME_URL') ||
    Netlify.env.get('SITE_URL');
  const databaseUrl =
    Netlify.env.get('DATABASE_URL_UNPOOLED') ||
    Netlify.env.get('DATABASE_URL');

  if (!baseUrl || !databaseUrl) {
    console.error('[Star Africa] Security audit skipped: required environment is missing.');
    return;
  }

  const checks = [
    { path: '/login', kind: 'public', expected: [200] },
    { path: '/dashboard', kind: 'protected', expected: [301, 302, 303, 307, 308] },
    { path: '/.env', kind: 'sensitive', expected: [404] },
    { path: '/.git/config', kind: 'sensitive', expected: [404] },
    { path: '/server-status', kind: 'sensitive', expected: [404] },
    { path: '/phpmyadmin', kind: 'sensitive', expected: [404] },
    { path: '/wp-admin', kind: 'sensitive', expected: [404] },
    { path: '/actuator/env', kind: 'sensitive', expected: [404] },
    { path: '/api/debug', kind: 'sensitive', expected: [404] },
    { path: '/api/config', kind: 'sensitive', expected: [404] },
  ] as const;

  const results: Array<Record<string, unknown>> = [];
  let critical = false;
  let warning = false;

  for (const check of checks) {
    try {
      const response = await fetch(new URL(check.path, baseUrl), {
        redirect: 'manual',
        headers: {
          'user-agent': 'Star-Africa-OS-Security-Audit/1.0',
          'x-star-africa-security-scan': sha256(check.path).slice(0, 16),
        },
        signal: AbortSignal.timeout(7000),
      });

      const exposed =
        check.kind === 'sensitive' && response.status >= 200 && response.status < 300;
      const acceptable =
        check.expected.includes(response.status as never) ||
        (check.kind === 'sensitive' && response.status >= 400);

      if (exposed) critical = true;
      else if (!acceptable) warning = true;

      results.push({
        path: check.path,
        kind: check.kind,
        status: response.status,
        exposed,
        acceptable,
      });

      if (check.path === '/login' && response.status === 200) {
        const headerChecks = {
          noSniff:
            response.headers.get('x-content-type-options')?.toLowerCase() ===
            'nosniff',
          frameDenied:
            response.headers.get('x-frame-options')?.toUpperCase() === 'DENY',
          hsts: Boolean(response.headers.get('strict-transport-security')),
          referrerPolicy: Boolean(response.headers.get('referrer-policy')),
        };
        if (Object.values(headerChecks).some((value) => !value)) warning = true;
        results.push({ securityHeaders: headerChecks });
      }
    } catch (error) {
      warning = true;
      results.push({
        path: check.path,
        error: error instanceof Error ? error.message : 'check failed',
      });
    }
  }

  const severity = critical ? 'critical' : warning ? 'warning' : 'info';
  await recordEvent(
    databaseUrl,
    'system.endpoint_security_scan',
    severity,
    {
      checkedAt: new Date().toISOString(),
      origin: new URL(baseUrl).origin,
      results,
    },
  );

  console.log(
    `[Star Africa] Endpoint security audit complete: ${severity}.`,
  );
};

export const config: Config = {
  schedule: '17 */6 * * *',
};
