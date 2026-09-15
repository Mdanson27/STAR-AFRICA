import { NextResponse } from 'next/server';
import { and, eq, or } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import {
  auditLogs,
  bids,
  customers,
  projectActivities,
  projectBudgetLines,
  projectTeamMembers,
  projects,
  projectStages,
  users,
} from '@/db/schema';
import { getSession } from '@/lib/security/session';
import { hasPermission } from '@/lib/security/permissions';

const schema = z.object({
  code: z.string().trim().min(3).max(40),
  name: z.string().trim().min(4).max(180),
  client: z.string().trim().min(2).max(180),
  category: z.string().trim().min(2),
  description: z.string().trim().min(10),
  location: z.string().trim().min(2),
  bidId: z.string().optional(),
  contractReference: z.string().trim().optional(),
  purchaseOrderReference: z.string().trim().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  currency: z.string().length(3).default('UGX'),
  contractValue: z.coerce.number().nonnegative(),
  startDate: z.string().min(1),
  completionDate: z.string().min(1),
  retentionPercent: z.coerce.number().min(0).max(100).default(5),
  advancePercent: z.coerce.number().min(0).max(100).default(0),
  defectsLiabilityMonths: z.coerce.number().int().min(0).max(120).default(6),
  projectManagerId: z.string().default('user-projects'),
  siteManagerId: z.string().default('user-site'),
  budget: z.record(z.string(), z.coerce.number().nonnegative()).default({}),
});
const minor = (value: number) => BigInt(Math.round(value * 100)).toString();

export async function POST(request: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json(
      { error: 'Authentication required.' },
      { status: 401 },
    );
  if (!hasPermission(session.permissions, 'projects.create'))
    return NextResponse.json(
      { error: 'Your registered position cannot create projects.' },
      { status: 403 },
    );
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid project data.' },
      { status: 400 },
    );
  const data = parsed.data;
  if (new Date(data.completionDate) <= new Date(data.startDate))
    return NextResponse.json(
      { error: 'Expected completion must be after the start date.' },
      { status: 400 },
    );
  const db = getDb();
  const [duplicate] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.companyId, 'company-star-africa'),
        eq(projects.code, data.code),
      ),
    )
    .limit(1);
  if (duplicate)
    return NextResponse.json(
      {
        error: 'A project with this code already exists.',
        duplicate: duplicate.id,
      },
      { status: 409 },
    );
  const now = new Date();
  const id = `project-${crypto.randomUUID()}`;
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(
      and(
        eq(customers.companyId, 'company-star-africa'),
        eq(customers.name, data.client),
      ),
    )
    .limit(1);
  const customerId = customer?.id ?? `customer-${crypto.randomUUID()}`;
  const [projectManager] = await db
    .select({ id: users.id, name: users.displayName })
    .from(users)
    .where(
      and(
        eq(users.companyId, 'company-star-africa'),
        eq(users.id, data.projectManagerId),
      ),
    )
    .limit(1);
  const [siteManager] = await db
    .select({ id: users.id, name: users.displayName })
    .from(users)
    .where(
      and(
        eq(users.companyId, 'company-star-africa'),
        eq(users.id, data.siteManagerId),
      ),
    )
    .limit(1);
  if (!projectManager || !siteManager)
    return NextResponse.json(
      {
        error:
          'The selected project or site manager is unavailable. Refresh the page and select an active team member.',
      },
      { status: 400 },
    );
  const bidReference = data.bidId?.trim();
  const [linkedBid] = bidReference
    ? await db
        .select({ id: bids.id })
        .from(bids)
        .where(
          and(
            eq(bids.companyId, 'company-star-africa'),
            or(eq(bids.id, bidReference), eq(bids.reference, bidReference)),
          ),
        )
        .limit(1)
    : [];
  if (bidReference && !linkedBid)
    return NextResponse.json(
      {
        error:
          'The tender / bid reference does not match an existing bid. Clear it or enter a valid bid reference.',
      },
      { status: 400 },
    );
  const [stage] = await db
    .select({ id: projectStages.id })
    .from(projectStages)
    .where(eq(projectStages.companyId, 'company-star-africa'))
    .orderBy(projectStages.sequence)
    .limit(1);
  const budgetTotal = Object.values(data.budget).reduce(
    (sum, value) => sum + value,
    0,
  );
  const statements = [];
  if (!customer)
    statements.push(
      db.insert(customers).values({
        id: customerId,
        companyId: 'company-star-africa',
        code: `CUS-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
        name: data.client,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      }),
    );
  statements.push(
    db.insert(projects).values({
      id,
      companyId: 'company-star-africa',
      code: data.code,
      name: data.name,
      customerId,
      bidId: linkedBid?.id ?? null,
      category: data.category,
      description: data.description,
      location: data.location,
      priority: data.priority,
      contractReference: data.contractReference || null,
      purchaseOrderReference: data.purchaseOrderReference || null,
      contractCurrency: data.currency,
      contractValueMinor: minor(data.contractValue),
      budgetMinor: minor(budgetTotal),
      retentionBasisPoints: Math.round(data.retentionPercent * 100),
      advanceBasisPoints: Math.round(data.advancePercent * 100),
      defectsLiabilityMonths: data.defectsLiabilityMonths,
      startsAt: new Date(data.startDate),
      plannedCompletionAt: new Date(data.completionDate),
      stageId: stage?.id ?? null,
      status: 'active',
      health: 'on_track',
      projectManagerId: projectManager.id,
      siteManagerId: siteManager.id,
      createdAt: now,
      updatedAt: now,
    }),
  );
  for (const [category, value] of Object.entries(data.budget))
    statements.push(
      db.insert(projectBudgetLines).values({
        id: `budget-${crypto.randomUUID()}`,
        projectId: id,
        category,
        originalMinor: minor(value),
        createdAt: now,
        updatedAt: now,
      }),
    );
  for (const assignment of [
    {
      userId: projectManager.id,
      employee: projectManager.name,
      projectRole: 'project_manager',
      responsibility: 'Overall project delivery and coordination',
    },
    {
      userId: siteManager.id,
      employee: siteManager.name,
      projectRole: 'site_manager',
      responsibility: 'Site operations, safety and daily delivery',
    },
  ])
    statements.push(
      db.insert(projectTeamMembers).values({
        id: `team-${crypto.randomUUID()}`,
        projectId: id,
        userId: assignment.userId,
        projectRole: assignment.projectRole,
        responsibility: assignment.responsibility,
        startsAt: new Date(data.startDate),
        endsAt: new Date(data.completionDate),
        allocationBasisPoints: 10000,
        accessLevel: 'standard',
        status: 'active',
        detailsJson: JSON.stringify({ employee: assignment.employee }),
        createdAt: now,
        updatedAt: now,
      }),
    );
  statements.push(
    db.insert(projectActivities).values({
      id: `activity-${crypto.randomUUID()}`,
      projectId: id,
      actorId: session.userId,
      action: 'project.created',
      summary: `Project ${data.code} created and assigned for contract setup.`,
      entityType: 'project',
      entityId: id,
      occurredAt: now,
    }),
  );
  statements.push(
    db.insert(auditLogs).values({
      id: `audit-${crypto.randomUUID()}`,
      companyId: 'company-star-africa',
      userId: session.userId,
      action: 'project.created',
      entityType: 'project',
      entityId: id,
      newValueJson: JSON.stringify({
        code: data.code,
        name: data.name,
        client: data.client,
        contractValue: data.contractValue,
      }),
      occurredAt: now,
    }),
  );
  try {
    await db.batch(
      statements as [
        (typeof statements)[number],
        ...(typeof statements)[number][],
      ],
    );
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Could not create project: ${error.message}`
            : 'Could not create project.',
      },
      { status: 503 },
    );
  }
}
