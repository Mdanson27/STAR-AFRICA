import type { Metadata } from 'next';
import { desc } from 'drizzle-orm';
import { AppShell } from '@/components/app-shell';
import { getDb } from '@/db';
import { auditLogs, securityEvents } from '@/db/schema';
import { requireAuthorizedSession } from '@/lib/security/session';

export const metadata: Metadata = {
  title: 'Security & audit',
  description: 'Production security monitoring and system audit activity',
};
export const dynamic = 'force-dynamic';

function when(value: Date | number | null | undefined) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(Number(value));
  return date.toLocaleString('en-UG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Kampala',
  });
}

function severityClass(value: string) {
  return `security-severity ${value.toLowerCase()}`;
}

export default async function SecurityAuditPage() {
  const session = await requireAuthorizedSession(
    'administration.view',
    '/administration/security',
  );
  const db = getDb();
  const [security, audits] = await Promise.all([
    db.select().from(securityEvents).orderBy(desc(securityEvents.occurredAt)).limit(60),
    db.select().from(auditLogs).orderBy(desc(auditLogs.occurredAt)).limit(100),
  ]);

  const critical = security.filter((event) => event.severity === 'critical').length;
  const warnings = security.filter((event) => event.severity === 'warning').length;
  const unresolved = security.filter((event) => event.severity !== 'info' && !event.resolvedAt).length;
  const latestScan = security.find(
    (event) => event.eventType === 'system.endpoint_security_scan',
  );

  return (
    <AppShell active="Security & audit" user={session}>
      <main className="page-content security-audit-page">
        <section className="module-heading">
          <div>
            <p className="eyebrow">Production assurance</p>
            <h1>Security &amp; audit</h1>
            <p>
              Review authentication events, endpoint checks and sensitive system
              actions from one controlled audit workspace.
            </p>
          </div>
        </section>

        <section className="security-kpis">
          <article>
            <span>Security events</span>
            <strong>{security.length}</strong>
            <small>Most recent monitored events</small>
          </article>
          <article>
            <span>Critical</span>
            <strong>{critical}</strong>
            <small>Requires immediate review</small>
          </article>
          <article>
            <span>Warnings</span>
            <strong>{warnings}</strong>
            <small>Potential security or policy issues</small>
          </article>
          <article>
            <span>Unresolved findings</span>
            <strong>{unresolved}</strong>
            <small>
              {latestScan ? `Last endpoint scan: ${when(latestScan.occurredAt)}` : 'Awaiting first endpoint scan'}
            </small>
          </article>
        </section>

        <section className="panel security-panel">
          <header>
            <div>
              <p className="eyebrow">System monitoring</p>
              <h2>Security events</h2>
            </div>
            <span className="production-badge">Production V1</span>
          </header>
          <div className="table-scroll">
            <table className="security-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Severity</th>
                  <th>Event</th>
                  <th>Route</th>
                  <th>Method</th>
                  <th>Request ID</th>
                </tr>
              </thead>
              <tbody>
                {security.length ? (
                  security.map((event) => (
                    <tr key={event.id}>
                      <td>{when(event.occurredAt)}</td>
                      <td><span className={severityClass(event.severity)}>{event.severity}</span></td>
                      <td>{event.eventType.replaceAll('.', ' ')}</td>
                      <td>{event.route ?? '—'}</td>
                      <td>{event.method ?? '—'}</td>
                      <td><code>{event.requestId?.slice(0, 14) ?? '—'}</code></td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6} className="table-empty-cell">No production security events recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel security-panel">
          <header>
            <div>
              <p className="eyebrow">Business audit trail</p>
              <h2>Recent audited actions</h2>
            </div>
          </header>
          <div className="table-scroll">
            <table className="security-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Record</th>
                  <th>Request ID</th>
                </tr>
              </thead>
              <tbody>
                {audits.length ? (
                  audits.map((event) => (
                    <tr key={event.id}>
                      <td>{when(event.occurredAt)}</td>
                      <td>{event.userId ?? 'System'}</td>
                      <td>{event.action.replaceAll('.', ' ')}</td>
                      <td>{event.entityType}</td>
                      <td><code>{event.entityId}</code></td>
                      <td><code>{event.requestId?.slice(0, 14) ?? '—'}</code></td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6} className="table-empty-cell">No production audit events recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
