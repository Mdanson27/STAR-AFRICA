'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Columns3,
  Download,
  ListFilter,
  MapPin,
  Plus,
  Search,
  TrendingUp,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { hasPermission } from '@/lib/security/permissions';
import {
  healthLabel,
  money,
  type ProjectRecord,
} from '@/lib/projects/demo-data';
import { getPipelineStage, pipelineStages } from '@/lib/projects/pipeline';
const views = [
  'Overview',
  'Projects',
  'Pipeline',
  'My Projects',
  'Milestones',
  'Site Updates',
  'Expenses',
  'Analytics',
  'Archive',
] as const;
type ProjectView = (typeof views)[number];
const viewSlug = (view: ProjectView) => view.toLowerCase().replaceAll(' ', '-');
export function ProjectsOverview({
  projects,
  permissions,
  role,
  currentUser,
  initialView,
}: {
  projects: ProjectRecord[];
  permissions: string[];
  role: string;
  currentUser: string;
  initialView?: string;
}) {
  const defaultView: ProjectView =
    role === 'PROJECT_MANAGER' || role === 'SITE_MANAGER'
      ? 'My Projects'
      : 'Overview';
  const view =
    views.find((item) => viewSlug(item) === initialView) ?? defaultView;
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const canCreate = hasPermission(permissions, 'projects.create');
  const financial = hasPermission(permissions, 'projects.financials.view');
  const contract = hasPermission(permissions, 'projects.contract_value.view');
  const canExport = hasPermission(permissions, 'projects.export');
  const visible = useMemo(
    () =>
      projects
        .filter(
          (p) =>
            (role !== 'PROJECT_MANAGER' || p.projectManager === currentUser) &&
            (role !== 'SITE_MANAGER' || p.siteManager === currentUser),
        )
        .filter((p) => status === 'all' || p.status === status)
        .filter((p) =>
          `${p.code} ${p.name} ${p.client} ${p.location}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        ),
    [projects, query, status, role, currentUser],
  );
  const active = visible.filter(
    (p) => !['archived', 'closed'].includes(p.status),
  );
  const total = active.reduce(
    (sum, p) => sum + Number(p.contractValueMinor),
    0,
  );
  const actual = active.reduce((sum, p) => sum + Number(p.actualMinor), 0);
  const retention = active.reduce(
    (sum, p) =>
      sum + (Number(p.contractValueMinor) * p.retentionBasisPoints) / 10000,
    0,
  );
  return (
    <div className="page-content projects-page">
      <section className="module-heading">
        <div>
          <p className="eyebrow">CONTRACT DELIVERY</p>
          <h1>Projects</h1>
          <p>
            Manage awarded work from mobilization through completion and
            retention.
          </p>
        </div>
        <div className="heading-actions">
          {canExport ? (
            <Button variant="outline">
              <Download />
              Export
            </Button>
          ) : null}
          <Button variant="outline">Import</Button>
          {canCreate ? (
            <Link
              className={buttonVariants({ size: 'lg' })}
              href="/projects/new"
            >
              <Plus />
              New project
            </Link>
          ) : null}
        </div>
      </section>
      <section className="project-kpis">
        <article>
          <span>Active projects</span>
          <strong>{active.length}</strong>
          <small>
            {
              visible.filter(
                (p) => p.health === 'at_risk' || p.health === 'critical',
              ).length
            }{' '}
            require attention
          </small>
        </article>
        <article>
          <span>Projects at risk</span>
          <strong>
            {
              visible.filter(
                (p) => p.health === 'at_risk' || p.health === 'critical',
              ).length
            }
          </strong>
          <small>Schedule, cost or issue rule triggered</small>
        </article>
        {contract ? (
          <article>
            <span>Total contract value</span>
            <strong>{money(String(total))}</strong>
            <small>Authorised portfolio visibility</small>
          </article>
        ) : null}
        {financial ? (
          <>
            <article>
              <span>Current project cost</span>
              <strong>{money(String(actual))}</strong>
              <small>Approved and submitted expenses</small>
            </article>
            <article>
              <span>Retention outstanding</span>
              <strong>{money(String(retention))}</strong>
              <small>Contract basis at current rates</small>
            </article>
          </>
        ) : null}
        <article>
          <span>Completed this year</span>
          <strong>
            {visible.filter((p) => p.health === 'completed').length}
          </strong>
          <small>Including retention-stage work</small>
        </article>
      </section>
      <section className="project-view-tabs">
        {views.map((item) => (
          <Link
            key={item}
            className={view === item ? 'active' : ''}
            aria-current={view === item ? 'page' : undefined}
            href={
              item === defaultView
                ? '/projects'
                : `/projects?view=${viewSlug(item)}`
            }
            scroll={false}
          >
            {item}
          </Link>
        ))}
      </section>
      {view === 'Pipeline' ? (
        <Pipeline projects={visible} showValue={contract} />
      ) : view === 'Expenses' ? (
        <ExpenseTracker
          projects={visible}
          canViewCosts={
            financial || hasPermission(permissions, 'projects.costs.view')
          }
          query={query}
          status={status}
          setQuery={setQuery}
          setStatus={setStatus}
        />
      ) : view === 'Analytics' ? (
        <Analytics projects={visible} showFinancial={financial} />
      ) : (
        <section className="panel project-register">
          <header>
            <div>
              <p className="panel-kicker">{view.toUpperCase()}</p>
              <h2>
                {view === 'My Projects'
                  ? 'My active delivery workspace'
                  : view === 'Archive'
                    ? 'Historical project register'
                    : 'Project register'}
              </h2>
            </div>
            <div className="project-filters">
              <label>
                <Search />
                <input
                  aria-label="Search projects"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search code, project or client"
                />
              </label>
              <label>
                <ListFilter />
                <select
                  aria-label="Filter projects by status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="retention">Retention</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
            </div>
          </header>
          <div className="table-scroll">
            <table className="records-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client / location</th>
                  <th>Manager</th>
                  {contract ? <th>Contract value</th> : null}
                  <th>Progress</th>
                  <th>Health</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible
                  .filter((p) =>
                    view === 'Archive'
                      ? p.status === 'archived'
                      : p.status !== 'archived',
                  )
                  .map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.name}</strong>
                        <small>
                          {p.code} · {p.category}
                        </small>
                      </td>
                      <td>
                        {p.client}
                        <small>
                          <MapPin /> {p.location}
                        </small>
                      </td>
                      <td>{p.projectManager}</td>
                      {contract ? (
                        <td>{money(p.contractValueMinor, p.currency)}</td>
                      ) : null}
                      <td
                        aria-label={`${p.completionBasisPoints / 100}% complete`}
                      >
                        <div className="progress-cell">
                          <span>
                            <i
                              style={{
                                width: `${p.completionBasisPoints / 100}%`,
                              }}
                            />
                          </span>
                          <strong>{p.completionBasisPoints / 100}%</strong>
                        </div>
                      </td>
                      <td>
                        <span className={`health health-${p.health}`}>
                          {healthLabel(p.health)}
                        </span>
                      </td>
                      <td>{p.stage}</td>
                      <td>
                        <Link href={`/projects/${p.id}`}>Open</Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function ExpenseTracker({
  projects,
  canViewCosts,
  query,
  status,
  setQuery,
  setStatus,
}: {
  projects: ProjectRecord[];
  canViewCosts: boolean;
  query: string;
  status: string;
  setQuery: (value: string) => void;
  setStatus: (value: string) => void;
}) {
  if (!canViewCosts)
    return (
      <section className="panel portfolio-expense-restricted">
        <h2>Project costs are restricted</h2>
        <p>Your position does not include project cost visibility.</p>
      </section>
    );

  const budget = projects.reduce(
    (sum, project) => sum + Number(project.budgetMinor),
    0,
  );
  const spent = projects.reduce(
    (sum, project) => sum + Number(project.actualMinor),
    0,
  );
  const remaining = budget - spent;
  const utilisation = budget > 0 ? Math.round((spent / budget) * 100) : 0;

  return (
    <section className="project-expense-tracker">
      <div className="expense-tracker-summary">
        <article>
          <span>Tracked projects</span>
          <strong>{projects.length}</strong>
          <small>Projects in the current view</small>
        </article>
        <article>
          <span>Total budget</span>
          <strong>{money(String(budget))}</strong>
          <small>Approved project budgets</small>
        </article>
        <article>
          <span>Recorded expenses</span>
          <strong>{money(String(spent))}</strong>
          <small>Persisted project expense totals</small>
        </article>
        <article className={remaining < 0 ? 'negative' : ''}>
          <span>Budget remaining</span>
          <strong>{money(String(remaining))}</strong>
          <small>{utilisation}% utilised</small>
        </article>
      </div>
      <div className="panel expense-tracker-register">
        <header>
          <div>
            <p className="panel-kicker">PROJECT COST CONTROL</p>
            <h2>Expenses tracker</h2>
            <p>Compare persisted expenses with each approved project budget.</p>
          </div>
          <div className="project-filters">
            <label>
              <Search />
              <input
                aria-label="Search expense tracker"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search project or client"
              />
            </label>
            <label>
              <ListFilter />
              <select
                aria-label="Filter expense tracker by project status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="retention">Retention</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>
        </header>
        {projects.length ? (
          <div className="table-scroll">
            <table className="records-table expense-tracker-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Budget</th>
                  <th>Recorded expenses</th>
                  <th>Remaining</th>
                  <th>Utilisation</th>
                  <th>Health</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const projectBudget = Number(project.budgetMinor);
                  const projectSpent = Number(project.actualMinor);
                  const projectRemaining = projectBudget - projectSpent;
                  const projectUtilisation =
                    projectBudget > 0
                      ? Math.round((projectSpent / projectBudget) * 100)
                      : 0;
                  return (
                    <tr key={project.id}>
                      <td>
                        <strong>{project.name}</strong>
                        <small>
                          {project.code} · {project.client}
                        </small>
                      </td>
                      <td>{money(project.budgetMinor, project.currency)}</td>
                      <td>{money(project.actualMinor, project.currency)}</td>
                      <td
                        className={projectRemaining < 0 ? 'negative-value' : ''}
                      >
                        {money(String(projectRemaining), project.currency)}
                      </td>
                      <td aria-label={`${projectUtilisation}% budget utilised`}>
                        <div className="expense-utilisation">
                          <progress
                            max="100"
                            value={Math.min(projectUtilisation, 100)}
                          />
                          <span>{projectUtilisation}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`health health-${project.health}`}>
                          {healthLabel(project.health)}
                        </span>
                      </td>
                      <td>
                        <Link href={`/projects/${project.id}`}>
                          Open project
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="project-empty">
            <Search />
            <h3>No matching project expenses</h3>
            <p>
              Clear the search or status filter to see tracked project costs.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function Pipeline({
  projects,
  showValue,
}: {
  projects: ProjectRecord[];
  showValue: boolean;
}) {
  return (
    <section
      className="project-pipeline"
      aria-label="Project delivery pipeline"
    >
      {pipelineStages.map((stage) => {
        const stageProjects = projects.filter(
          (project) => getPipelineStage(project) === stage,
        );
        return (
          <div key={stage}>
            <header>
              <strong>{stage}</strong>
              <span>{stageProjects.length}</span>
            </header>
            {stageProjects.length ? (
              stageProjects.map((p) => (
                <Link href={`/projects/${p.id}`} key={p.id}>
                  <small>{p.code}</small>
                  <strong>{p.name}</strong>
                  <span>{p.client}</span>
                  <progress max="100" value={p.completionBasisPoints / 100} />
                  <em>
                    {p.completionBasisPoints / 100}% · {healthLabel(p.health)}
                  </em>
                  {showValue ? <b>{money(p.contractValueMinor)}</b> : null}
                </Link>
              ))
            ) : (
              <p className="pipeline-empty">No projects</p>
            )}
          </div>
        );
      })}
    </section>
  );
}
function Analytics({
  projects,
  showFinancial,
}: {
  projects: ProjectRecord[];
  showFinancial: boolean;
}) {
  const byHealth = ['on_track', 'at_risk', 'critical', 'completed'].map(
    (health) => ({
      health,
      count: projects.filter((p) => p.health === health).length,
    }),
  );
  return (
    <section className="project-analytics">
      <article className="panel">
        <header>
          <TrendingUp />
          <div>
            <p className="panel-kicker">PORTFOLIO HEALTH</p>
            <h2>Transparent delivery status</h2>
          </div>
        </header>
        {byHealth.map((item) => (
          <div className="analytics-row" key={item.health}>
            <span>{healthLabel(item.health)}</span>
            <i>
              <b
                style={{
                  width: `${projects.length ? (item.count / projects.length) * 100 : 0}%`,
                }}
              />
            </i>
            <strong>{item.count}</strong>
          </div>
        ))}
      </article>
      <article className="panel">
        <header>
          <Columns3 />
          <div>
            <p className="panel-kicker">STAGE DISTRIBUTION</p>
            <h2>Where work is concentrated</h2>
          </div>
        </header>
        {pipelineStages
          .filter((stage) =>
            projects.some((p) => getPipelineStage(p) === stage),
          )
          .map((stage) => (
            <div className="analytics-row" key={stage}>
              <span>{stage}</span>
              <strong>
                {projects.filter((p) => getPipelineStage(p) === stage).length}
              </strong>
            </div>
          ))}
        {showFinancial ? (
          <p className="analytics-note">
            <AlertTriangle /> Financial analysis is visible because this
            position has projects.financials.view.
          </p>
        ) : null}
      </article>
    </section>
  );
}
