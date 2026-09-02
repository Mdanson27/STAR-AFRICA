import { getChatGPTUser } from './chatgpt-auth';
import type { Metadata } from 'next';
import { StarAfricaApp } from '@/components/star-africa-app';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Dashboard' };

export default async function Home() {
  const user = await getChatGPTUser();
  return (
    <StarAfricaApp
      userName={user?.fullName ?? user?.email ?? 'Amina Nsubuga'}
      userRole={user ? 'Authenticated workspace user' : 'Director · Demo workspace'}
    />
  );
}
