import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  CircleDollarSign,
  ClipboardCheck,
  FolderKanban,
  Landmark,
  ReceiptText,
} from 'lucide-react';
import { loadExecutiveDashboard } from '@/lib/dashboard/server';

function money(minor: string) {
  const value = Number(minor || 0) / 100;
  if (Math.abs(value) >= 1_000_000_000) {
    return `UGX ${(value / 1_000_000_000).toLocaleString('en-UG', {
      maximumFractionDigits: 2,
    })}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `UGX ${(value / 1_000_000).toLocaleString('en-UG', {
      maximumFractionDigits: 1,
    })}M`;
  }
  return `UGX ${value.toLocaleString('en-UG', {
    maximumFractionDigits: 0,
  })}`;
}

function healthLabel(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (match) =>
    match.toUpperCase(),
  );
}

export async function ExecutiveDashboard({
  firstName,
}: {
  firstName: string;
}) {
  const data = await loadExecutiveDashboard();
  const kpis = [
    {
      label: 'Cash & bank position',
      value: money(data.cashMinor),
      note: 'QuickBooks legacy bank opening balances + production activity',
      icon: CircleDollarSign,
    },
    {
      label: 'Accounts receivable',
      value: money(data.receivablesMinor),
      note: 'Legacy A/R opening balance + live outstanding invoices',
      icon: ReceiptText,
    },
    {
      label: 'Accounts payable',
      value: money(data.payablesMinor),
      note: 'Legacy A/P opening balance + live supplier bills',
      icon: Landmark,
    },
    {
      label: 'Active projects',
      value: data.activeProjects.toLocaleString('en-UG'),
      note: `${data.openBids} open bid opportunities`,
      icon: FolderKanban,
    },
  ];

  const attention = [
    {
      label: `${data.pendingApprovals} approvals awaiting decision`,
      note: 'Approval workflow',
      href: '/dashboard',
      active: data.pendingApprovals > 0,
    },
    {
      label: `${data.overdueInvoices} overdue customer invoices`,
      note: 'Receivables',
      href: '/reports/receivables-aging',
      active: data.overdueInvoices > 0,
    },
    {
      label: `${data.openProjectIssues} open project issues`,
      note: 'Project delivery',
      href: '/projects',
      active: data.openProjectIssues > 0,
    },
    {
      label: `${data.bidsClosingSoon} bids closing within 7 days`,
      note: 'Bids & tenders',
      href: '/bids',
      active: data.bidsClosingSoon > 0,
    },
  ];

  return (
    <div className="page-content executive-dashboard">
      <section className="page-heading">
        <div>
          <p className="eyebrow">EXECUTIVE COMMAND CENTRE</p>
          <h1>Good morning, {firstName}</h1>
          <p className="overview-title">Star Africa operations overview</p>
          <p>
            Live production financial, bid and delivery signals for authorised
            leadership. Imported QuickBooks balances remain traceable as legacy
            opening values.
          </p>
        </div>
        <Link className="dashboard-link-button" href="/reports">
          Open reports centre <ArrowUpRight />
        </Link>
      </section>

      <section className="kpi-grid" aria-label="Executive financial indicators">
        {kpis.map(({ label, value, note, icon: Icon }) => (
          <article className="kpi-card" key={label}>
            <div className="kpi-top">
              <span>{label}</span>
              <span className="metric-icon"><Icon /></span>
            </div>
            <strong>{value}</strong>
            <p>{note}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel portfolio-summary">
          <header>
            <div>
              <p className="panel-kicker">DELIVERY PORTFOLIO</p>
              <h2>Projects requiring leadership attention</h2>
            </div>
            <Link href="/projects">View all</Link>
          </header>
          <div className="table-scroll">
            <table className="attention-project-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Progress</th>
                  <th>Health</th>
                  <th>Stage</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.projects.length ? (
                  data.projects.map((project) => (
                    <tr key={project.id}>
                      <td>
                        <strong>{project.name}</strong>
                        <small>{project.code} · {project.client}</small>
                      </td>
                      <td>
                        <span className="dashboard-progress">
                          <i style={{ width: `${project.completion}%` }} />
                        </span>
                        <small>{project.completion}% complete</small>
                      </td>
                      <td>
                        <span className={`health health-${project.health}`}>
                          {healthLabel(project.health)}
                        </span>
                      </td>
                      <td>{project.stage}</td>
                      <td><Link href={`/projects/${project.id}`}>Open</Link></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="table-empty-cell">
                      No production projects have been created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel attention-card">
          <header>
            <p className="panel-kicker">ATTENTION QUEUE</p>
            <h2>Decisions and exceptions</h2>
          </header>
          <div className="attention-rows">
            {attention.map((item) => (
              <Link href={item.href} key={item.label} className={!item.active ? 'resolved' : undefined}>
                <span className="attention-icon">
                  {item.note === 'Bids & tenders' ? <ClipboardCheck /> : <AlertTriangle />}
                </span>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.active ? `${item.note} · Review required` : `${item.note} · Clear`}</small>
                </span>
                <ArrowUpRight />
              </Link>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
