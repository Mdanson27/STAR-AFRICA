import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Download, Printer } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import {
  generateReportRows,
  reportDefinitions,
} from '@/lib/reports/server';
import { requireAuthorizedSession } from '@/lib/security/session';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const definition = reportDefinitions.find((item) => item.slug === slug);
  return { title: definition?.title ?? 'Report' };
}

function display(value: unknown) {
  if (value == null || value === '') return '—';
  return String(value);
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const definition = reportDefinitions.find((item) => item.slug === slug);
  if (!definition) notFound();

  const session = await requireAuthorizedSession(
    'reports.view',
    `/reports/${slug}`,
  );
  const rows = await generateReportRows(slug);

  return (
    <AppShell active="Reports" user={session}>
      <main className="page-content report-detail-page">
        <section className="module-heading">
          <div>
            <p className="eyebrow">{definition.area} · LIVE REPORT</p>
            <h1>{definition.title}</h1>
            <p>{definition.description}</p>
          </div>
          <div className="heading-actions">
            <Button
              variant="outline"
              render={<a href={`/api/reports/${slug}?format=csv`} />}
            >
              <Download />
              Download CSV
            </Button>
            <Button
              variant="outline"
              render={<button type="button" onClick={undefined} />}
              disabled
            >
              <Printer />
              Print from browser
            </Button>
          </div>
        </section>

        <section className="report-trace-banner">
          <strong>Report basis</strong>
          <span>
            Generated from current Star Africa OS production records. QuickBooks
            balances remain identified as imported legacy values rather than
            Star Africa OS transactions.
          </span>
        </section>

        <section className="panel report-data-panel">
          <header>
            <div>
              <p className="eyebrow">RESULTS</p>
              <h2>{rows.length.toLocaleString('en-UG')} records</h2>
            </div>
          </header>
          <div className="table-scroll">
            <table className="report-data-table">
              <thead>
                <tr>
                  {definition.columns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {definition.columns.map((column) => (
                        <td key={column}>
                          {column === 'Source' &&
                          display((row as Record<string, unknown>)[column]) ===
                            'QuickBooks' ? (
                            <span className="quickbooks-source-badge">
                              Imported from QuickBooks
                            </span>
                          ) : (
                            display((row as Record<string, unknown>)[column])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={definition.columns.length} className="table-empty-cell">
                      No production records are available for this report yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
