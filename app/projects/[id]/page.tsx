import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { ProjectWorkspace } from '@/components/projects/project-workspace';
import { loadProject } from '@/lib/projects/data';
import { requireAuthorizedSession } from '@/lib/security/session';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await loadProject(id);
  return {
    title: data?.project.name ?? 'Projects',
    description: data?.project.description ?? 'Star Africa project portfolio',
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAuthorizedSession('projects.view', `/projects/${id}`);
  const data = await loadProject(id);

  // Internal links should never strand an authorised user on a dead project
  // workspace. Known seeded projects are resolved by loadProject; genuinely
  // stale/removed identifiers return the user to the live portfolio.
  if (!data) redirect('/projects');

  return (
    <AppShell active="Projects" user={session}>
      <ProjectWorkspace
        data={data}
        permissions={[...session.permissions]}
        currentUser={session.name}
      />
    </AppShell>
  );
}
