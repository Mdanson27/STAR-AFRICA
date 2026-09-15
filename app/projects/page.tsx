import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { ProjectsOverview } from '@/components/projects/projects-overview';
import { loadProjects } from '@/lib/projects/data';
import { requireAuthorizedSession } from '@/lib/security/session';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Projects',
  description:
    'Manage awarded work from mobilization through completion and retention.',
};
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const session = await requireAuthorizedSession('projects.view', '/projects');
  const projects = await loadProjects();
  const query = await searchParams;
  const initialView = Array.isArray(query.view) ? query.view[0] : query.view;
  return (
    <AppShell active="Projects" user={session}>
      <ProjectsOverview
        projects={projects}
        permissions={[...session.permissions]}
        role={session.role}
        currentUser={session.name}
        initialView={initialView}
      />
    </AppShell>
  );
}
