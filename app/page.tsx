import { redirect } from 'next/navigation';
import { getSession } from '@/lib/security/session';
import { firstPermittedPath } from '@/lib/security/permissions';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session=await getSession();
  redirect(session?firstPermittedPath(session.permissions):'/login');
}
