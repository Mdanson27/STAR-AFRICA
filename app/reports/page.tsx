import type { Metadata } from 'next';
import { Download, FileBarChart2, ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import {
  reportDefinitions,
  reportOverview,
} from '@/lib/reports/server';
import { requireAuthorizedSession } from '@/lib/security/session';

export const metadata: Metadata = {
  title: 'Reports centre',
  description: 'Live, permission-controlled Star Africa OS reports',
};
export const dynamic = 'force-dynamic';

const areaOrder = [
  'Finance',
  'Sales',
  'Purchases',
  'Projects',
  'Bids',
  'Tax',
  'Administration',
  'Security',
];

export default async function ReportsPage() {
  const session = await requireAuthorizedSession('reports.view', '/reports');
  const overview = await reportOverview();

  return (
    <AppShell active="Reports" user={session}>
      <main className="page-content production-reports-page">
        <section className="module-heading">
          <div>
            <p className="eyebrow">Decision-ready reporting</p>
            <h1>Reports centre</h1>
            <p>
              Generate reports directly from live Star Africa OS records. Imported
              QuickBooks opening balances remain visibly traceable to their source.
            </p>
          </div>
        </section>

        <section className="report-overview-kpis">
          <article><span>Accounts</span><strong>{overview.accounts ?? 0}</strong><small>Active chart-of-account records</small></article>
          <article><span>Customers</span><strong>{overview.customers ?? 0}</strong><small>Current customer records</small></article>
          <article><span>Suppliers</span><strong>{overview.suppliers ?? 0}</strong><small>Active supplier records</small></article>
          <article><span>Projects</span><strong>{overview.projects ?? 0}</strong><small>Production project records</small></article>
          <article><span>Audit events</span><strong>{overview.audit_events ?? 0}</strong><small>System activity retained</small></article>
          <article><span>Security events</span><strong>{overview.security_events ?? 0}</strong><small>Monitoring and access findings</small></article>
        </section>

        <section className="reports-source-callout">
          <ShieldCheck />
          <div>
            <strong>Traceable financial migration</strong>
            <p>
              Legacy opening balances are labelled and retained as QuickBooks
              imports. New Star Africa OS transactions remain separate and
              auditable.
            </p>
          </div>
        </section>

        {areaOrder.map((area) => {
          const reports = reportDefinitions.filter((report) => report.area === area);
          if (!reports.length) return null;
          return (
            <section className="reports-area" key={area}>
              <header>
                <p className="eyebrow">{area}</p>
                <h2>{area} reports</h2>
              </header>
              <div className="report-card-grid">
                {reports.map((report) => (
                  <article className="report-card" key={report.slug}>
                    <span className="report-icon"><FileBarChart2 /></span>
                    <div className="report-card-copy">
                      <h3>{report.title}</h3>
                      <p>{report.description}</p>
                      <small>{report.columns.length} report columns</small>
                    </div>
                    <div className="report-actions">
                      <Button
                        variant="outline"
                        render={<a href={`/api/reports/${report.slug}?format=csv`} />}
                      >
                        <Download />
                        CSV
                      </Button>
                      <Button render={<a href={`/reports/${report.slug}`} />}>
                        View report
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </AppShell>
  );
}
