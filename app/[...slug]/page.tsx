import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ModuleWorkspace } from '@/components/module-workspace';
import { moduleBySlug } from '@/lib/modules';

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const config = slug.length === 1 ? moduleBySlug(slug[0]) : undefined;
  return { title: config?.title ?? 'Workspace' };
}

export default async function ModulePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const config = slug.length === 1 ? moduleBySlug(slug[0]) : undefined;
  if (!config) notFound();
  return <ModuleWorkspace config={config} />;
}
