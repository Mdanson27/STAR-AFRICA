'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  DollarSign,
  FileText,
  HardHat,
  Loader2,
  LockKeyhole,
  MapPin,
  MoreHorizontal,
  Package,
  Plus,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { hasPermission } from '@/lib/security/permissions';
import {
  healthLabel,
  money,
  type ProjectRecord,
} from '@/lib/projects/demo-data';
import type { ProjectActionType } from '@/lib/projects/action-schemas';
import { projectFormComponents, type ProjectFormProps } from './project-forms';

type Row = Record<string, unknown>;
type ProjectDetail = {
  project: ProjectRecord;
  tasks: Row[];
  milestones: Row[];
  updates: Row[];
  materials: Row[];
  materialUsage: Row[];
  expenses: Row[];
  risks: Row[];
  issues: Row[];
  variations: Row[];
  budget: Row[];
  activity: Row[];
  progress: Row[];
  workPlan: Row[];
  team: Row[];
  labour: Row[];
  equipment: Row[];
  certificates: Row[];
  invoices: Row[];
  payments: Row[];
  retentions: Row[];
  documents: Row[];
  procurement: Row[];
};
const tabs = [
  'Overview',
  'Work Plan',
  'Milestones',
  'Tasks',
  'Site Updates',
  'Team',
  'Materials',
  'Labour',
  'Equipment',
  'Procurement',
  'Budget',
  'Expenses',
  'Variations',
  'Certificates',
  'Invoices',
  'Payments',
  'Retention',
  'Documents',
  'Risks & Issues',
];
const actionConfig: Record<
  Exclude<ProjectActionType, 'workflow'>,
  { label: string; permission: string }
> = {
  progress: { label: 'Update Progress', permission: 'projects.progress.edit' },
  site_update: { label: 'Daily Update', permission: 'project_updates.create' },
  task: { label: 'New Task', permission: 'project_tasks.create' },
  milestone: {
    label: 'New Milestone',
    permission: 'project_milestones.create',
  },
  material_request: {
    label: 'Request Material',
    permission: 'project_materials.create',
  },
  material_usage: {
    label: 'Record Material Usage',
    permission: 'project_materials.create',
  },
  expense: { label: 'Record Expense', permission: 'project_expenses.create' },
  budget_line: { label: 'Add Budget Line', permission: 'project_budget.edit' },
  variation: {
    label: 'New Variation',
    permission: 'project_variations.create',
  },
  risk: { label: 'Add Risk', permission: 'project_risks.manage' },
  issue: { label: 'Report Issue', permission: 'project_issues.manage' },
  labour: { label: 'Record Labour', permission: 'project_labour.create' },
  equipment: {
    label: 'Assign Equipment',
    permission: 'project_equipment.create',
  },
  certificate: {
    label: 'Add Certificate',
    permission: 'project_certificates.create',
  },
  invoice: { label: 'Create Invoice', permission: 'project_invoices.create' },
  payment: { label: 'Record Payment', permission: 'project_payments.create' },
  retention: {
    label: 'Add Retention Record',
    permission: 'project_retention.manage',
  },
  document: {
    label: 'Upload Document',
    permission: 'projects.documents.upload',
  },
  team_member: { label: 'Add Team Member', permission: 'projects.team.manage' },
  work_activity: {
    label: 'Add Work Activity',
    permission: 'project_tasks.create',
  },
};
const asText = (value: unknown, fallback = '—') => {
  if (value === null || value === undefined || value === '') return fallback;
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
    return String(value);
  return JSON.stringify(value);
};
const dateText = (value: unknown) =>
  value
    ? new Date(value as string | number | Date).toLocaleDateString('en-UG', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';
const today = () => new Date().toISOString().slice(0, 10);
const titleCase = (value: string) =>
  value
    .replaceAll('_', ' ')
    .replaceAll(/([A-Z])/g, ' $1')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();

export function ProjectWorkspace({
  data,
  permissions,
  currentUser,
}: {
  data: ProjectDetail;
  permissions: string[];
  currentUser: string;
}) {
  const { project } = data;
  const router = useRouter();
  const [tab, setTab] = useState('Overview');
  const [action, setAction] = useState<Exclude<
    ProjectActionType,
    'workflow'
  > | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const financial = hasPermission(permissions, 'projects.financials.view');
  const cost =
    hasPermission(permissions, 'projects.costs.view') ||
    hasPermission(permissions, 'project_expenses.view');
  const actual = data.expenses.reduce(
    (sum, row) => sum + Number(row.totalMinor ?? row.amountMinor ?? 0),
    0,
  );
  const revised =
    data.budget.reduce(
      (sum, row) =>
        sum +
        Number(row.originalMinor ?? 0) +
        Number(row.changesMinor ?? 0) +
        Number(row.contingencyMinor ?? 0),
      0,
    ) || Number(project.budgetMinor);
  const committed =
    data.budget.reduce(
      (sum, row) => sum + Number(row.committedMinor ?? 0),
      0,
    ) || Number(project.committedMinor);
  const remaining = revised - actual;
  const nextMilestone = useMemo(
    () =>
      data.milestones
        .filter(
          (row) => !['completed', 'approved'].includes(String(row.status)),
        )
        .sort(
          (a, b) =>
            new Date(asText(a.dueAt, '9999')).getTime() -
            new Date(asText(b.dueAt, '9999')).getTime(),
        )[0],
    [data.milestones],
  );
  const permittedActions = (
    Object.entries(actionConfig) as [
      Exclude<ProjectActionType, 'workflow'>,
      (typeof actionConfig)[keyof typeof actionConfig],
    ][]
  ).filter(([, config]) => hasPermission(permissions, config.permission));
  function open(type: Exclude<ProjectActionType, 'workflow'>) {
    const defaults: Record<string, string> = {
      reportDate: today(),
      date: today(),
      progressDate: today(),
      plannedStartDate: today(),
      startDate: today(),
      assignedDate: today(),
      identifiedDate: today(),
      dateRequested: today(),
      submittedDate: today(),
      invoiceDate: today(),
      paymentDate: today(),
      documentDate: today(),
      priority: 'normal',
      likelihood: '3',
      impact: '3',
      workersOnSite: '0',
      hoursWorked: '0',
      quantity: '1',
      availableQuantity: '0',
      estimatedUnitCost: '0',
      amount: '0',
      tax: '0',
      quantityIssued: '0',
      quantityUsed: '0',
      quantityReturned: '0',
      regularHours: '0',
      overtimeHours: '0',
      rate: '0',
      weight: '0',
      progress: '0',
      subtotal: '0',
      vat: '0',
      retention: '0',
      total: '0',
      percentage: String(project.retentionBasisPoints / 100),
      baseAmount: String(Number(project.contractValueMinor) / 100),
      amountRetained: String(
        (Number(project.contractValueMinor) * project.retentionBasisPoints) /
          1_000_000,
      ),
      amountReleased: '0',
      allocation: '100',
      applicable: 'true',
      location: project.location,
      reportedBy: currentUser,
      recordedBy: currentUser,
      currentProgress: String(project.completionBasisPoints / 100),
      newProgress: String(project.completionBasisPoints / 100),
      stage: project.stage,
      owner: currentUser,
      raisedBy: currentUser,
      assignedTo: currentUser,
      supervisor: currentUser,
      responsiblePerson: currentUser,
      requestedBy: 'client',
      workerType: 'employee',
      paymentType: 'interim',
      category: type === 'risk' ? 'schedule' : '',
      severity: 'medium',
      status: type === 'retention' ? 'withheld' : 'not_started',
      allocationPercent: '100',
      allocationBasisPoints: '100',
    };
    setForm(defaults);
    setFile(null);
    setMessage('');
    setAction(type);
  }
  async function submit() {
    if (!action) return;
    setBusy(true);
    setMessage('');
    const payload = new FormData();
    payload.set('type', action);
    for (const [key, value] of Object.entries(form)) payload.set(key, value);
    if (file) payload.set('attachment', file);
    const response = await fetch(`/api/projects/${project.id}/actions`, {
      method: 'POST',
      body: payload,
    });
    const result = (await response.json()) as {
      error?: string;
      message?: string;
    };
    if (!response.ok) {
      setMessage(result.error ?? 'Could not save this change.');
      setBusy(false);
      return;
    }
    setMessage(result.message ?? 'Saved.');
    setBusy(false);
    setAction(null);
    setForm({});
    setFile(null);
    router.refresh();
  }
  async function updateWorkflow(
    entityType: 'milestone' | 'task',
    entityId: string,
    status: string,
  ) {
    setBusy(true);
    const response = await fetch(`/api/projects/${project.id}/actions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'workflow',
        data: {
          entityType,
          entityId,
          status,
          completionDate: status === 'completed' ? today() : '',
          completionPercent: status === 'completed' ? 100 : 0,
          completionNotes:
            status === 'completed'
              ? 'Completed from the project workspace.'
              : '',
          approvedBy: status === 'approved' ? currentUser : '',
        },
      }),
    });
    const result = (await response.json()) as {
      error?: string;
      message?: string;
    };
    setMessage(
      response.ok
        ? (result.message ?? 'Updated.')
        : (result.error ?? 'Could not update this record.'),
    );
    setBusy(false);
    if (response.ok) router.refresh();
  }
  return (
    <div className="page-content project-workspace">
      <Link href="/projects" className="back-link">
        <ArrowLeft />
        Back to Projects
      </Link>
      {message ? <output className="action-message">{message}</output> : null}
      <section className="project-command-head">
        <div className="project-identity">
          <span className="project-code">{project.code}</span>
          <h1>{project.name}</h1>
          <p>{project.client}</p>
          <span className="project-location">
            <MapPin />
            {project.location}
          </span>
          <div className="project-status-row">
            <span className="status-pill">{project.stage}</span>
            <span className={`health health-${project.health}`}>
              {healthLabel(project.health)}
            </span>
          </div>
        </div>
        <div className="project-progress-summary">
          <span>{project.completionBasisPoints / 100}% Complete</span>
          <div>
            <i style={{ width: `${project.completionBasisPoints / 100}%` }} />
          </div>
          <dl>
            <div>
              <dt>Project Manager</dt>
              <dd>{project.projectManager}</dd>
            </div>
            <div>
              <dt>Expected Completion</dt>
              <dd>{dateText(project.plannedCompletionAt)}</dd>
            </div>
          </dl>
        </div>
        <div className="project-head-actions">
          {hasPermission(permissions, 'projects.progress.edit') ? (
            <Button variant="outline" onClick={() => open('progress')}>
              <TrendingUp />
              Update Progress
            </Button>
          ) : null}
          {hasPermission(permissions, 'project_updates.create') ? (
            <Button onClick={() => open('site_update')}>
              <HardHat />
              Daily Update
            </Button>
          ) : null}
          {permittedActions.length ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" />}>
                <MoreHorizontal />
                More Actions
                <ChevronDown />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  {permittedActions
                    .filter(
                      ([type]) => !['progress', 'site_update'].includes(type),
                    )
                    .map(([type, config]) => (
                      <DropdownMenuItem key={type} onClick={() => open(type)}>
                        {config.label}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </section>
      <div className="project-tabs-wrap">
        <div
          className="workspace-tabs project-tabs"
          role="tablist"
          aria-label="Project sections"
        >
          {tabs.map((item) => (
            <button
              key={item}
              role="tab"
              aria-selected={item === tab}
              className={item === tab ? 'active' : ''}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <section className="project-tab-surface" role="tabpanel">
        {tab === 'Overview' ? (
          renderOverview()
        ) : tab === 'Work Plan' ? (
          <Register
            title="Weighted work plan"
            rows={data.workPlan}
            columns={[
              'title',
              'stage',
              'startsAt',
              'endsAt',
              'progressBasisPoints',
              'status',
            ]}
            emptyTitle="No work plan activities yet"
            emptyText="Add the first weighted activity to establish the delivery plan."
            action={
              hasPermission(permissions, 'project_tasks.create')
                ? () => open('work_activity')
                : undefined
            }
            actionLabel="Add Work Activity"
          />
        ) : tab === 'Milestones' ? (
          <Register
            title="Milestones"
            rows={data.milestones}
            columns={[
              'name',
              'stage',
              'dueAt',
              'weightBasisPoints',
              'priority',
              'status',
            ]}
            emptyTitle="No milestones yet"
            emptyText="Create the first milestone to begin tracking project delivery targets."
            action={
              hasPermission(permissions, 'project_milestones.create')
                ? () => open('milestone')
                : undefined
            }
            actionLabel="New Milestone"
            workflow={(row) => (
              <WorkflowButtons
                type="milestone"
                row={row}
                update={updateWorkflow}
                approve={hasPermission(
                  permissions,
                  'project_milestones.approve',
                )}
              />
            )}
          />
        ) : tab === 'Tasks' ? (
          <Register
            title="Project tasks"
            rows={data.tasks}
            columns={[
              'title',
              'stage',
              'startsAt',
              'dueAt',
              'priority',
              'status',
            ]}
            emptyTitle="No tasks yet"
            emptyText="Create the first task and assign clear delivery responsibility."
            action={
              hasPermission(permissions, 'project_tasks.create')
                ? () => open('task')
                : undefined
            }
            actionLabel="New Task"
            workflow={(row) => (
              <WorkflowButtons type="task" row={row} update={updateWorkflow} />
            )}
          />
        ) : tab === 'Site Updates' ? (
          <Register
            title="Daily site diary"
            rows={data.updates}
            columns={[
              'reportDate',
              'location',
              'workCompleted',
              'workersOnSite',
              'delays',
              'createdBy',
            ]}
            emptyTitle="No daily updates yet"
            emptyText="Record completed work, labour, materials, equipment and site conditions."
            action={
              hasPermission(permissions, 'project_updates.create')
                ? () => open('site_update')
                : undefined
            }
            actionLabel="Daily Update"
          />
        ) : tab === 'Team' ? (
          <Register
            title="Project team"
            rows={data.team}
            columns={[
              'employee',
              'projectRole',
              'responsibility',
              'startsAt',
              'endsAt',
              'allocationBasisPoints',
              'accessLevel',
              'status',
            ]}
            emptyTitle="No team members assigned"
            emptyText="Add accountable project roles and allocation dates."
            action={
              hasPermission(permissions, 'projects.team.manage')
                ? () => open('team_member')
                : undefined
            }
            actionLabel="Add Team Member"
          />
        ) : tab === 'Materials' ? (
          renderMaterials()
        ) : tab === 'Labour' ? (
          <Register
            title="Labour records"
            rows={data.labour}
            columns={[
              'occurredAt',
              'workerTeam',
              'workerType',
              'tradeRole',
              'regularHoursMinor',
              'workCompleted',
            ]}
            emptyTitle="No labour recorded"
            emptyText="Capture labour quantities without exposing confidential payroll information."
            action={
              hasPermission(permissions, 'project_labour.create')
                ? () => open('labour')
                : undefined
            }
            actionLabel="Record Labour"
          />
        ) : tab === 'Equipment' ? (
          <Register
            title="Equipment allocation"
            rows={data.equipment}
            columns={[
              'equipment',
              'equipmentCode',
              'type',
              'operator',
              'assignedAt',
              'condition',
              'status',
            ]}
            emptyTitle="No equipment assigned"
            emptyText="Assign equipment and track its use, condition and return."
            action={
              hasPermission(permissions, 'project_equipment.create')
                ? () => open('equipment')
                : undefined
            }
            actionLabel="Assign Equipment"
          />
        ) : tab === 'Procurement' ? (
          <Register
            title="Linked procurement"
            rows={data.procurement}
            columns={['reference', 'purpose', 'totalMinor', 'status']}
            emptyTitle="No linked procurement yet"
            emptyText="Approved material requests will flow into the procurement register."
          />
        ) : tab === 'Budget' ? (
          renderBudget()
        ) : tab === 'Expenses' ? (
          cost ? (
            <Register
              title="Project expenses"
              rows={data.expenses}
              columns={[
                'expenseNumber',
                'occurredAt',
                'category',
                'payee',
                'totalMinor',
                'status',
              ]}
              emptyTitle="No expenses recorded"
              emptyText="Record the first operational expense for approval."
              action={
                hasPermission(permissions, 'project_expenses.create')
                  ? () => open('expense')
                  : undefined
              }
              actionLabel="Record Expense"
            />
          ) : (
            <FinancialRestricted />
          )
        ) : tab === 'Variations' ? (
          <Register
            title="Contract variations"
            rows={data.variations}
            columns={[
              'number',
              'title',
              'requestedByParty',
              'costImpactMinor',
              'timeImpactDays',
              'status',
            ]}
            emptyTitle="No variations recorded"
            emptyText="Create a change order when scope, value or time changes."
            action={
              hasPermission(permissions, 'project_variations.create')
                ? () => open('variation')
                : undefined
            }
            actionLabel="New Variation"
          />
        ) : tab === 'Certificates' ? (
          <Register
            title="Certificates"
            rows={data.certificates}
            columns={[
              'certificateType',
              'number',
              'period',
              'submittedValueMinor',
              'certifiedValueMinor',
              'status',
            ]}
            emptyTitle="No certificates yet"
            emptyText="Add the first payment, testing, completion or handover certificate."
            action={
              hasPermission(permissions, 'project_certificates.create')
                ? () => open('certificate')
                : undefined
            }
            actionLabel="Add Certificate"
          />
        ) : tab === 'Invoices' ? (
          financial ? (
            <Register
              title="Project invoices"
              rows={data.invoices}
              columns={[
                'number',
                'issueDate',
                'dueDate',
                'subtotalMinor',
                'taxMinor',
                'retentionMinor',
                'totalMinor',
                'status',
              ]}
              emptyTitle="No project invoices"
              emptyText="Create or link a certificate-backed invoice in the core invoice register."
              action={
                hasPermission(permissions, 'project_invoices.create')
                  ? () => open('invoice')
                  : undefined
              }
              actionLabel="Create Invoice"
            />
          ) : (
            <FinancialRestricted />
          )
        ) : tab === 'Payments' ? (
          financial ? (
            <Register
              title="Project payments"
              rows={data.payments}
              columns={[
                'reference',
                'receivedOrPaidAt',
                'method',
                'amountMinor',
                'status',
              ]}
              emptyTitle="No project payments"
              emptyText="Record or allocate an advance, interim, final or retention payment."
              action={
                hasPermission(permissions, 'project_payments.create')
                  ? () => open('payment')
                  : undefined
              }
              actionLabel="Record Payment"
            />
          ) : (
            <FinancialRestricted />
          )
        ) : tab === 'Retention' ? (
          financial ? (
            <Register
              title="Retention control"
              rows={data.retentions}
              columns={[
                'basisPoints',
                'baseMinor',
                'amountMinor',
                'receivedMinor',
                'expectedReleaseAt',
                'status',
              ]}
              emptyTitle="No retention record"
              emptyText="Set the retained amount and defects-liability release dates."
              action={
                hasPermission(permissions, 'project_retention.manage')
                  ? () => open('retention')
                  : undefined
              }
              actionLabel="Add Retention Record"
            />
          ) : (
            <FinancialRestricted />
          )
        ) : tab === 'Documents' ? (
          <Register
            title="Project documents"
            rows={data.documents}
            columns={[
              'category',
              'title',
              'referenceNumber',
              'version',
              'documentAt',
              'expiresAt',
            ]}
            emptyTitle="No project documents"
            emptyText="Upload the first controlled project document or site photo."
            action={
              hasPermission(permissions, 'projects.documents.upload')
                ? () => open('document')
                : undefined
            }
            actionLabel="Upload Document"
          />
        ) : (
          renderRisks()
        )}
      </section>
      <Dialog
        open={Boolean(action)}
        onOpenChange={(visible) => !visible && setAction(null)}
      >
        <DialogContent className="project-action-dialog">
          <DialogHeader>
            <DialogTitle>
              {action ? actionConfig[action].label : 'Project action'}
            </DialogTitle>
            <DialogDescription>
              Fields and validation are specific to this business record. Saved
              changes update the project register and audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="project-action-scroll">
            {action ? renderForm(action) : null}
          </div>
          {message ? <p className="form-error">{message}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="spin" />
                  Saving…
                </>
              ) : (
                'Save Record'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
  function renderForm(type: Exclude<ProjectActionType, 'workflow'>) {
    const Form = projectFormComponents[type];
    const props: ProjectFormProps = {
      values: form,
      set: (key, value) => setForm((current) => ({ ...current, [key]: value })),
      setFile,
      financial,
      currentProgress: project.completionBasisPoints / 100,
      currentUser,
      location: project.location,
    };
    return <Form {...props} />;
  }
  function renderOverview() {
    return (
      <>
        <section className="project-overview-kpis">
          <article>
            <span>Progress</span>
            <strong>{project.completionBasisPoints / 100}%</strong>
            <small>Overall verified delivery</small>
          </article>
          <article>
            <span>Current Stage</span>
            <strong>{project.stage}</strong>
            <small>Active delivery phase</small>
          </article>
          <article>
            <span>Project Health</span>
            <strong className={`health-${project.health}`}>
              {healthLabel(project.health)}
            </strong>
            <small>
              {project.health === 'at_risk'
                ? 'An open risk or issue requires attention'
                : 'No critical threshold is currently triggered'}
            </small>
          </article>
          <article>
            <span>Next Milestone</span>
            <strong>
              {nextMilestone ? asText(nextMilestone.name) : 'Not scheduled'}
            </strong>
            <small>
              {nextMilestone
                ? dateText(nextMilestone.dueAt)
                : 'Create a milestone to establish the next target'}
            </small>
          </article>
        </section>
        <section className="project-overview-grid">
          <article className="panel progress-card">
            <header>
              <div>
                <p className="panel-kicker">DELIVERY PROGRESS</p>
                <h2>{project.completionBasisPoints / 100}% complete</h2>
              </div>
              <TrendingUp />
            </header>
            <div className="large-progress">
              <i style={{ width: `${project.completionBasisPoints / 100}%` }} />
            </div>
            <dl>
              <div>
                <dt>Previous update</dt>
                <dd>
                  {data.progress.length
                    ? `${Number(data.progress[0].previousBasisPoints) / 100}% → ${Number(data.progress[0].newBasisPoints) / 100}%`
                    : 'Initial project baseline'}
                </dd>
              </div>
              <div>
                <dt>Updated by</dt>
                <dd>
                  {data.progress.length
                    ? asText(data.progress[0].updatedBy)
                    : currentUser}
                </dd>
              </div>
            </dl>
          </article>
          <article className="panel operational-queue">
            <header>
              <div>
                <p className="panel-kicker">OPERATIONAL QUEUE</p>
                <h2>Delivery workload</h2>
              </div>
              <ClipboardList />
            </header>
            <div className="operational-mini-grid">
              {[
                {
                  icon: CalendarDays,
                  label: 'Milestones Due',
                  value: data.milestones.filter((x) => x.status !== 'completed')
                    .length,
                },
                {
                  icon: ClipboardList,
                  label: 'Open Tasks',
                  value: data.tasks.filter((x) => x.status !== 'completed')
                    .length,
                },
                {
                  icon: Package,
                  label: 'Material Requests',
                  value: data.materials.filter((x) => x.status !== 'fulfilled')
                    .length,
                },
                {
                  icon: ShieldAlert,
                  label: 'Open Risks',
                  value:
                    data.risks.filter((x) => x.status !== 'closed').length +
                    data.issues.filter((x) => x.status !== 'closed').length,
                },
              ].map((item) => (
                <div key={item.label}>
                  <item.icon />
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </article>
          <article className="panel recent-update">
            <header>
              <div>
                <p className="panel-kicker">LATEST SITE UPDATE</p>
                <h2>
                  {data.updates.length
                    ? dateText(data.updates[0].reportDate)
                    : 'No diary entry yet'}
                </h2>
              </div>
              <HardHat />
            </header>
            <p>
              {data.updates.length
                ? asText(data.updates[0].workCompleted)
                : 'Capture completed work, labour, materials, equipment, delays, safety observations and photos from site.'}
            </p>
            {hasPermission(permissions, 'project_updates.create') ? (
              <Button onClick={() => open('site_update')}>
                Add Daily Update
              </Button>
            ) : null}
          </article>
          {financial ? (
            <article className="panel financial-position">
              <header>
                <div>
                  <p className="panel-kicker">COMMERCIAL POSITION</p>
                  <h2>Budget and collection summary</h2>
                </div>
                <DollarSign />
              </header>
              <dl>
                <div>
                  <dt>Contract Value</dt>
                  <dd>{money(project.contractValueMinor)}</dd>
                </div>
                <div>
                  <dt>Revised Budget</dt>
                  <dd>{money(String(revised))}</dd>
                </div>
                <div>
                  <dt>Committed</dt>
                  <dd>{money(String(committed))}</dd>
                </div>
                <div>
                  <dt>Actual</dt>
                  <dd>{money(String(actual))}</dd>
                </div>
                <div>
                  <dt>Remaining</dt>
                  <dd>{money(String(remaining))}</dd>
                </div>
                <div>
                  <dt>Payments Received</dt>
                  <dd>
                    {money(
                      String(
                        data.payments.reduce(
                          (sum, row) => sum + Number(row.amountMinor ?? 0),
                          0,
                        ),
                      ),
                    )}
                  </dd>
                </div>
              </dl>
            </article>
          ) : null}
        </section>
      </>
    );
  }
  function renderMaterials() {
    return (
      <div className="stacked-registers">
        <Register
          title="Material requests"
          rows={data.materials}
          columns={[
            'reference',
            'material',
            'quantityMinor',
            'unit',
            'requiredAt',
            'priority',
            'status',
          ]}
          emptyTitle="No material requests"
          emptyText="Request materials against a project activity or milestone."
          action={
            hasPermission(permissions, 'project_materials.create')
              ? () => open('material_request')
              : undefined
          }
          actionLabel="Request Material"
        />
        <Register
          title="Material issues and usage"
          rows={data.materialUsage}
          columns={[
            'material',
            'quantityIssuedMinor',
            'quantityUsedMinor',
            'quantityReturnedMinor',
            'occurredAt',
            'activity',
          ]}
          emptyTitle="No material usage recorded"
          emptyText="Record issued, used and returned quantities to maintain project balances."
          action={
            hasPermission(permissions, 'project_materials.create')
              ? () => open('material_usage')
              : undefined
          }
          actionLabel="Record Usage"
        />
      </div>
    );
  }
  function renderBudget() {
    if (!(hasPermission(permissions, 'project_budget.view') || financial))
      return <FinancialRestricted />;
    const approvedChanges = data.budget.reduce(
      (sum, row) => sum + Number(row.changesMinor ?? 0),
      0,
    );
    const original =
      data.budget.reduce(
        (sum, row) => sum + Number(row.originalMinor ?? 0),
        0,
      ) || Number(project.budgetMinor);
    return (
      <>
        <section className="budget-summary">
          <article>
            <span>Original Budget</span>
            <strong>{money(String(original))}</strong>
          </article>
          <article>
            <span>Approved Changes</span>
            <strong>{money(String(approvedChanges))}</strong>
          </article>
          <article>
            <span>Revised Budget</span>
            <strong>{money(String(revised))}</strong>
          </article>
          <article>
            <span>Committed</span>
            <strong>{money(String(committed))}</strong>
          </article>
          <article>
            <span>Actual</span>
            <strong>{money(String(actual))}</strong>
          </article>
          <article>
            <span>Remaining</span>
            <strong>{money(String(remaining))}</strong>
          </article>
          <article>
            <span>Variance</span>
            <strong>{money(String(revised - actual))}</strong>
          </article>
        </section>
        <Register
          title="Budget lines"
          rows={data.budget}
          columns={[
            'category',
            'subcategory',
            'description',
            'quantityMinor',
            'unit',
            'unitCostMinor',
            'originalMinor',
            'contingencyMinor',
          ]}
          emptyTitle="No detailed budget lines"
          emptyText="Add the first cost line to build a controlled project budget."
          action={
            hasPermission(permissions, 'project_budget.edit')
              ? () => open('budget_line')
              : undefined
          }
          actionLabel="Add Budget Line"
        />
      </>
    );
  }
  function renderRisks() {
    return (
      <div className="risk-issue-grid">
        <Register
          title="Risk register"
          rows={data.risks}
          columns={[
            'title',
            'category',
            'likelihood',
            'impact',
            'score',
            'mitigation',
            'status',
          ]}
          emptyTitle="No active risks"
          emptyText="Record risks early and assign mitigation ownership."
          action={
            hasPermission(permissions, 'project_risks.manage')
              ? () => open('risk')
              : undefined
          }
          actionLabel="Add Risk"
        />
        <Register
          title="Issue register"
          rows={data.issues}
          columns={[
            'title',
            'category',
            'priority',
            'description',
            'targetResolutionAt',
            'status',
          ]}
          emptyTitle="No active issues"
          emptyText="Report delivery issues and assign immediate action."
          action={
            hasPermission(permissions, 'project_issues.manage')
              ? () => open('issue')
              : undefined
          }
          actionLabel="Report Issue"
        />
      </div>
    );
  }
}

function WorkflowButtons({
  type,
  row,
  update,
  approve = false,
}: {
  type: 'milestone' | 'task';
  row: Row;
  update: (type: 'milestone' | 'task', id: string, status: string) => void;
  approve?: boolean;
}) {
  const status = String(row.status);
  const actions =
    type === 'milestone'
      ? status === 'not_started'
        ? [['Start', 'in_progress']]
        : status === 'in_progress'
          ? [['Ready for Review', 'ready_for_review']]
          : status === 'ready_for_review'
            ? approve
              ? [['Approve', 'approved']]
              : [['Complete', 'completed']]
            : status === 'approved'
              ? [['Complete', 'completed']]
              : []
      : status === 'not_started'
        ? [['Start', 'in_progress']]
        : status !== 'completed'
          ? [['Complete', 'completed']]
          : [];
  return (
    <div className="row-actions">
      {actions.map(([label, next]) => (
        <button key={next} onClick={() => update(type, String(row.id), next)}>
          {label}
        </button>
      ))}
    </div>
  );
}
function Register({
  title,
  rows,
  columns,
  emptyTitle,
  emptyText,
  action,
  actionLabel,
  workflow,
}: {
  title: string;
  rows: Row[];
  columns: string[];
  emptyTitle: string;
  emptyText: string;
  action?: () => void;
  actionLabel?: string;
  workflow?: (row: Row) => React.ReactNode;
}) {
  return (
    <section className="panel operational-register">
      <header>
        <div>
          <p className="panel-kicker">OPERATIONAL REGISTER</p>
          <h2>{title}</h2>
        </div>
        {action ? (
          <Button onClick={action}>
            <Plus />
            {actionLabel}
          </Button>
        ) : null}
      </header>
      {rows.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{titleCase(column)}</th>
                ))}
                {workflow ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={asText(row.id, String(index))}>
                  {columns.map((column) => (
                    <td key={column}>{formatCell(column, row[column])}</td>
                  ))}
                  {workflow ? <td>{workflow(row)}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="project-empty">
          <FileText />
          <h3>{emptyTitle}</h3>
          <p>{emptyText}</p>
          {action ? (
            <Button variant="outline" onClick={action}>
              <Plus />
              {actionLabel}
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}
function formatCell(key: string, value: unknown) {
  if (key.toLowerCase().includes('date') || key.endsWith('At'))
    return dateText(value);
  if (key.toLowerCase().includes('minor') && value !== undefined)
    return key.includes('quantity') || key.includes('Hours')
      ? Number(value) / 1000
      : money(asText(value, '0'));
  if (key.toLowerCase().includes('basispoints'))
    return `${Number(value || 0) / 100}%`;
  if (key === 'projectRole') return titleCase(asText(value));
  if (key === 'status' || key === 'priority')
    return <span className="status-pill">{titleCase(asText(value))}</span>;
  return asText(value);
}
function FinancialRestricted() {
  return (
    <section className="panel financial-restricted">
      <LockKeyhole />
      <div>
        <h2>Financial details restricted</h2>
        <p>
          Your current role can manage operational delivery without access to
          protected contract margins.
        </p>
      </div>
    </section>
  );
}
