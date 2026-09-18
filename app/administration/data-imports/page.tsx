import type { Metadata } from 'next';
import { desc, eq } from 'drizzle-orm';
import { Database, FileClock, ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { getDb } from '@/db';
import {
  dataImportBatches,
  recordProvenance,
} from '@/db/schema';
import { requireAuthorizedSession } from '@/lib/security/session';

export const metadata: Metadata = {
  title: 'Data imports & provenance',
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

function counts(raw: string | null) {
  try {
    return JSON.parse(raw ?? '{}') as Record<string, number | boolean>;
  } catch {
    return {};
  }
}

export default async function DataImportsPage() {
  const session = await requireAuthorizedSession(
    'administration.view',
    '/administration/data-imports',
  );
  const db = getDb();
  const batches = await db
    .select()
    .from(dataImportBatches)
    .orderBy(desc(dataImportBatches.startedAt));

  const sourceCounts = await db
    .select({
      batchId: recordProvenance.batchId,
      sourceRecordType: recordProvenance.sourceRecordType,
      entityId: recordProvenance.entityId,
    })
    .from(recordProvenance);

  const byBatch = new Map<string, Map<string, number>>();
  for (const row of sourceCounts) {
    const current = byBatch.get(row.batchId) ?? new Map<string, number>();
    current.set(
      row.sourceRecordType,
      (current.get(row.sourceRecordType) ?? 0) + 1,
    );
    byBatch.set(row.batchId, current);
  }

  return (
    <AppShell active="Data imports" user={session}>
      <main className="page-content import-history-page">
        <section className="module-heading">
          <div>
            <p className="eyebrow">Migration traceability</p>
            <h1>Data imports &amp; provenance</h1>
            <p>
              Every migrated record keeps its original source, source reference
              and import batch so historical QuickBooks information can be traced
              without being confused with new Star Africa OS activity.
            </p>
          </div>
        </section>

        <section className="reports-source-callout">
          <ShieldCheck />
          <div>
            <strong>Imported data is never disguised as new activity</strong>
            <p>
              QuickBooks opening balances and master data remain labelled as
              legacy imports. Star Africa OS transactions created after go-live
              are tracked separately through the production audit trail.
            </p>
          </div>
        </section>

        <section className="import-batch-grid">
          {batches.length ? (
            batches.map((batch) => {
              const summary = counts(batch.recordCountsJson);
              const observed = byBatch.get(batch.id) ?? new Map();
              return (
                <article className="import-batch-card" key={batch.id}>
                  <header>
                    <span className="import-source-icon"><Database /></span>
                    <div>
                      <span className="quickbooks-source-badge">
                        {batch.sourceSystem}
                      </span>
                      <h2>{batch.sourceFileName}</h2>
                      <p>Import batch {batch.id}</p>
                    </div>
                    <span className={`import-status ${batch.status}`}>
                      {batch.status}
                    </span>
                  </header>

                  <dl>
                    <div>
                      <dt>Source export date</dt>
                      <dd>{batch.sourceExportDate || '—'}</dd>
                    </div>
                    <div>
                      <dt>Source export timestamp</dt>
                      <dd>{batch.sourceExportTimestamp || '—'}</dd>
                    </div>
                    <div>
                      <dt>Imported</dt>
                      <dd>{when(batch.completedAt ?? batch.startedAt)}</dd>
                    </div>
                    <div>
                      <dt>Provenance snapshots</dt>
                      <dd>
                        {Array.from(observed.values()).reduce(
                          (total, value) => total + value,
                          0,
                        )}
                      </dd>
                    </div>
                  </dl>

                  <div className="import-counts">
                    {[
                      ['Accounts', summary.accounts],
                      ['Items / services', summary.items_services],
                      ['Customers', summary.customers],
                      ['Vendors', summary.vendors],
                      ['Payment methods', summary.payment_methods],
                      ['Payment terms', summary.payment_terms],
                    ].map(([label, value]) => (
                      <span key={String(label)}>
                        <strong>{String(value ?? 0)}</strong>
                        {String(label)}
                      </span>
                    ))}
                  </div>

                  <footer>
                    <FileClock />
                    <p>{batch.notes || 'Source information retained for audit.'}</p>
                  </footer>
                </article>
              );
            })
          ) : (
            <section className="panel customer-empty">
              <Database />
              <h2>No completed imports yet</h2>
              <p>The first production migration will appear here after validation.</p>
            </section>
          )}
        </section>
      </main>
    </AppShell>
  );
}
