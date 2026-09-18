import { NextResponse } from 'next/server';
import { guardApi } from '@/lib/security/api-guard';

export async function GET(request: Request) {
  const guard = await guardApi(request, {
    permission: 'administration.view',
    action: 'system.providers.status',
    maxRequests: 30,
    windowMs: 60_000,
  });
  if ('response' in guard) return guard.response;

  return NextResponse.json({
    mode: process.env.STAR_AFRICA_MODE ?? 'production',
    providers: [
      {
        capability: 'authentication',
        provider: 'Star Africa OS server-side authentication',
        mode: 'production',
      },
      {
        capability: 'database',
        provider: 'Neon PostgreSQL',
        mode: process.env.DATABASE_URL ? 'configured' : 'missing',
      },
      {
        capability: 'application hosting',
        provider: 'Netlify / Next.js runtime',
        mode: 'production',
      },
      {
        capability: 'document storage',
        provider: 'Netlify Blobs',
        mode: 'production',
      },
      {
        capability: 'security monitoring',
        provider: 'Star Africa OS security events + scheduled endpoint audit',
        mode: 'production',
      },
    ],
  });
}
