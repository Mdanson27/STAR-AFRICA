import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { GenericWorkspace } from '@/components/generic-workspace';
import { AppShell } from '@/components/app-shell';
import { moduleBySlug } from '@/lib/modules';
import { requireSession } from '@/lib/security/session';
import { hasPermission } from '@/lib/security/permissions';
import { routePermission } from '@/lib/security/navigation';
import { redirect } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const config = slug.length === 1 ? moduleBySlug(slug[0]) : undefined;
  return { title: config?.title ?? 'Workspace' };
}

export default async function ModulePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const config = slug.length === 1 ? moduleBySlug(slug[0]) : undefined;
  if (!config) notFound();
  const session = await requireSession(`/${slug.join('/')}`);
  const path=`/${slug.join('/')}`;const permission=routePermission(path);
  if(permission&&!hasPermission(session.permissions,permission))redirect(`/access-restricted?from=${encodeURIComponent(path)}`);
  return <AppShell active={config.title} user={session}><GenericWorkspace config={config} canCreate={hasPermission(session.permissions,`${config.slug}.create`)} /></AppShell>;
}
