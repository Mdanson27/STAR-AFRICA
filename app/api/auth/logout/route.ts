import { NextResponse } from 'next/server';
import { clearDemoSession } from '@/lib/security/session';

export async function POST(request: Request) {
  await clearDemoSession();
  return NextResponse.redirect(new URL('/login', request.url), 303);
}
