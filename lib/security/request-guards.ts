import 'server-only';

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return;
  const requestOrigin = new URL(request.url).origin;
  if (origin !== requestOrigin) {
    throw new Error('Cross-origin request rejected.');
  }
}
