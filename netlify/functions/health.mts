import type { Config, Context } from '@netlify/functions';

export default async (_req: Request, _context: Context) => {
  return Response.json({
    ok: true,
    service: 'Star Africa OS Demo',
    runtime: 'Netlify Functions',
    timestamp: new Date().toISOString(),
  });
};

export const config: Config = {
  path: '/api/netlify-health',
};
