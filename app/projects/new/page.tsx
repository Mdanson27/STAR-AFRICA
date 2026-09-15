import type { Metadata } from 'next';import { AppShell } from '@/components/app-shell';import { NewProjectForm } from '@/components/projects/new-project-form';import { requireAuthorizedSession } from '@/lib/security/session';
export const dynamic='force-dynamic';export const metadata:Metadata={title:'New Project'};
export default async function NewProjectPage(){const session=await requireAuthorizedSession('projects.create','/projects/new');return <AppShell active="Projects" user={session}><NewProjectForm/></AppShell>}
