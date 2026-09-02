import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/security/session';
import { LoginExperience } from '@/components/login-experience';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Login' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  if (await getSession()) redirect('/dashboard');
  const { returnTo } = await searchParams;
  const safeReturnTo = returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/dashboard';
  return <LoginExperience returnTo={safeReturnTo} />;
}
