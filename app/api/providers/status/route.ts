import { getChatGPTUser } from '@/app/chatgpt-auth';

export async function GET() {
  const user = await getChatGPTUser();
  if (!user && process.env.NODE_ENV === 'production') return Response.json({ error: 'Authentication required.' }, { status: 401 });
  return Response.json({ providers: [
    { capability: 'authentication', provider: 'ChatGPT workspace identity', mode: 'live' },
    { capability: 'storage', provider: 'Cloudflare R2', mode: 'live-on-hosting' },
    { capability: 'database', provider: 'Cloudflare D1 / Drizzle', mode: 'live-on-hosting' },
    { capability: 'email', provider: 'Development outbox', mode: 'development' },
    { capability: 'ocr', provider: 'Deterministic demo OCR', mode: 'development' },
    { capability: 'bid discovery', provider: 'Manual and demo importer', mode: 'development' },
    { capability: 'bank data', provider: 'CSV importer contract', mode: 'development' },
  ] });
}
