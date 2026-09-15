import 'server-only';
import { desc, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import {
  customers,
  invoices,
  payments,
  procurementRequests,
  projectActivities,
  projectBudgetLines,
  projectCertificates,
  projectDocumentLinks,
  projectEquipmentRecords,
  projectExpenses,
  projectIssues,
  projectLabourRecords,
  projectMaterialRequests,
  projectMaterialUsage,
  projectMilestones,
  projectProgressUpdates,
  projectRisks,
  projectSiteUpdates,
  projectTasks,
  projectTeamMembers,
  projectVariations,
  projectWorkActivities,
  projects,
  projectStages,
  purchaseOrders,
  retentions,
  users,
} from '@/db/schema';
import { demoProjects, type ProjectRecord } from './demo-data';

const projectSelection = {
  id: projects.id,
  code: projects.code,
  name: projects.name,
  client: customers.name,
  category: projects.category,
  description: projects.description,
  location: projects.location,
  priority: projects.priority,
  currency: projects.contractCurrency,
  contractValueMinor: projects.contractValueMinor,
  budgetMinor: projects.budgetMinor,
  committedMinor: projects.committedMinor,
  retentionBasisPoints: projects.retentionBasisPoints,
  startsAt: projects.startsAt,
  plannedCompletionAt: projects.plannedCompletionAt,
  stage: projectStages.name,
  status: projects.status,
  health: projects.health,
  completionBasisPoints: projects.completionBasisPoints,
  projectManager: users.displayName,
};
type ProjectRow = {
  id: string;
  code: string;
  name: string;
  client: string;
  category: string | null;
  description: string | null;
  location: string | null;
  priority: string;
  currency: string;
  contractValueMinor: string;
  budgetMinor: string;
  committedMinor: string;
  retentionBasisPoints: number;
  startsAt: Date | null;
  plannedCompletionAt: Date | null;
  stage: string | null;
  status: string;
  health: string;
  completionBasisPoints: number;
  projectManager: string | null;
};
const normalize = (row: ProjectRow, actualMinor = '0'): ProjectRecord => ({
  ...row,
  category: row.category ?? 'General',
  description: row.description ?? '',
  location: row.location ?? 'Uganda',
  stage: row.stage ?? 'Awarded',
  projectManager: row.projectManager ?? 'Unassigned',
  siteManager: 'Moses Kato',
  actualMinor,
  startsAt: row.startsAt?.toISOString().slice(0, 10) ?? '',
  plannedCompletionAt:
    row.plannedCompletionAt?.toISOString().slice(0, 10) ?? '',
});
const detailText = (value: string | null, key: string) => {
  try {
    const parsed = JSON.parse(value ?? '{}') as Record<string, unknown>;
    return typeof parsed[key] === 'string' ? parsed[key] : '';
  } catch {
    return '';
  }
};

export async function loadProjects(): Promise<ProjectRecord[]> {
  try {
    const db = getDb();
    const rows = await db
      .select(projectSelection)
      .from(projects)
      .innerJoin(customers, eq(projects.customerId, customers.id))
      .leftJoin(projectStages, eq(projects.stageId, projectStages.id))
      .leftJoin(users, eq(projects.projectManagerId, users.id))
      .orderBy(desc(projects.createdAt));
    if (!rows.length) return demoProjects;
    const actual = await db
      .select({
        projectId: projectExpenses.projectId,
        total: sql<string>`coalesce(sum(cast(${projectExpenses.totalMinor} as integer)),0)`,
      })
      .from(projectExpenses)
      .groupBy(projectExpenses.projectId);
    const actualMap = new Map(actual.map((x) => [x.projectId, x.total]));
    return rows.map((row) => normalize(row, actualMap.get(row.id) ?? '0'));
  } catch {
    return demoProjects;
  }
}

export async function loadProject(id: string) {
  const fallback = demoProjects.find((item) => item.id === id);
  try {
    const db = getDb();
    const [row] = await db
      .select(projectSelection)
      .from(projects)
      .innerJoin(customers, eq(projects.customerId, customers.id))
      .leftJoin(projectStages, eq(projects.stageId, projectStages.id))
      .leftJoin(users, eq(projects.projectManagerId, users.id))
      .where(eq(projects.id, id))
      .limit(1);
    if (!row) return null;
    const [actualRow] = await db
      .select({
        total: sql<string>`coalesce(sum(cast(${projectExpenses.totalMinor} as integer)),0)`,
      })
      .from(projectExpenses)
      .where(eq(projectExpenses.projectId, id));
    const project = normalize(row, actualRow?.total ?? '0');
    const [
      tasks,
      milestones,
      updates,
      materials,
      materialUsage,
      expenses,
      risks,
      issues,
      variations,
      budget,
      activity,
      progress,
      workPlan,
      team,
      labour,
      equipment,
      certificates,
      projectInvoices,
      projectPayments,
      projectRetentions,
      projectDocuments,
      procurement,
      purchaseOrdersForProject,
    ] = await Promise.all([
      db.select().from(projectTasks).where(eq(projectTasks.projectId, id)),
      db
        .select()
        .from(projectMilestones)
        .where(eq(projectMilestones.projectId, id)),
      db
        .select()
        .from(projectSiteUpdates)
        .where(eq(projectSiteUpdates.projectId, id))
        .orderBy(desc(projectSiteUpdates.reportDate)),
      db
        .select()
        .from(projectMaterialRequests)
        .where(eq(projectMaterialRequests.projectId, id)),
      db
        .select()
        .from(projectMaterialUsage)
        .where(eq(projectMaterialUsage.projectId, id))
        .orderBy(desc(projectMaterialUsage.occurredAt)),
      db
        .select()
        .from(projectExpenses)
        .where(eq(projectExpenses.projectId, id))
        .orderBy(desc(projectExpenses.occurredAt)),
      db.select().from(projectRisks).where(eq(projectRisks.projectId, id)),
      db.select().from(projectIssues).where(eq(projectIssues.projectId, id)),
      db
        .select()
        .from(projectVariations)
        .where(eq(projectVariations.projectId, id)),
      db
        .select()
        .from(projectBudgetLines)
        .where(eq(projectBudgetLines.projectId, id)),
      db
        .select()
        .from(projectActivities)
        .where(eq(projectActivities.projectId, id))
        .orderBy(desc(projectActivities.occurredAt)),
      db
        .select()
        .from(projectProgressUpdates)
        .where(eq(projectProgressUpdates.projectId, id))
        .orderBy(desc(projectProgressUpdates.occurredAt)),
      db
        .select()
        .from(projectWorkActivities)
        .where(eq(projectWorkActivities.projectId, id)),
      db
        .select()
        .from(projectTeamMembers)
        .where(eq(projectTeamMembers.projectId, id)),
      db
        .select()
        .from(projectLabourRecords)
        .where(eq(projectLabourRecords.projectId, id))
        .orderBy(desc(projectLabourRecords.occurredAt)),
      db
        .select()
        .from(projectEquipmentRecords)
        .where(eq(projectEquipmentRecords.projectId, id)),
      db
        .select()
        .from(projectCertificates)
        .where(eq(projectCertificates.projectId, id)),
      db
        .select()
        .from(invoices)
        .where(eq(invoices.projectId, id))
        .orderBy(desc(invoices.issueDate)),
      db
        .select()
        .from(payments)
        .where(eq(payments.projectId, id))
        .orderBy(desc(payments.receivedOrPaidAt)),
      db.select().from(retentions).where(eq(retentions.projectId, id)),
      db
        .select()
        .from(projectDocumentLinks)
        .where(eq(projectDocumentLinks.projectId, id))
        .orderBy(desc(projectDocumentLinks.documentAt)),
      db
        .select()
        .from(procurementRequests)
        .where(eq(procurementRequests.projectId, id)),
      db.select().from(purchaseOrders).where(eq(purchaseOrders.projectId, id)),
    ]);
    const visibleTeam = team.map((member) => ({
      ...member,
      employee: detailText(member.detailsJson, 'employee') || member.userId,
    }));
    return {
      project,
      tasks,
      milestones,
      updates,
      materials,
      materialUsage,
      expenses,
      risks,
      issues,
      variations,
      budget,
      activity,
      progress,
      workPlan,
      team: visibleTeam,
      labour,
      equipment,
      certificates,
      invoices: projectInvoices,
      payments: projectPayments,
      retentions: projectRetentions,
      documents: projectDocuments,
      procurement: [...procurement, ...purchaseOrdersForProject],
    };
  } catch {
    return fallback
      ? {
          project: fallback,
          tasks: [],
          milestones: [],
          updates: [],
          materials: [],
          materialUsage: [],
          expenses: [],
          risks: [],
          issues: [],
          variations: [],
          budget: [],
          activity: [],
          progress: [],
          workPlan: [],
          team: [],
          labour: [],
          equipment: [],
          certificates: [],
          invoices: [],
          payments: [],
          retentions: [],
          documents: [],
          procurement: [],
        }
      : null;
  }
}
