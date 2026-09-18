import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/security/session';

export async function POST(request: Request) {
  await clearSession(request);
  return NextResponse.redirect(new URL('/login', request.url), 303);
}
