import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { requireAuthorizedSession } from '@/lib/security/session';
import { demoBids, formatMoney, labelStage } from '@/lib/bids/demo-data';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Bid Archive' };
export default async function ArchivePage() {
  const session = await requireAuthorizedSession('bids.view','/bids/archive');
  const archived = demoBids.filter((bid) =>
    ['won', 'lost', 'cancelled', 'archived'].includes(bid.stage),
  );
  return (
    <AppShell
      active="Bids & tenders"
      user={session}
    >
      <div className="page-content archive-page">
        <div className="section-page-heading">
          <div>
            <p className="eyebrow">SEARCHABLE RECORDS</p>
            <h1>Bid archive</h1>
            <p>
              Closed opportunities remain searchable, permission-controlled and
              auditable.
            </p>
          </div>
          <Link href="/bids">Back to active pipeline</Link>
        </div>
        <section className="panel workspace-panel full">
          <header>
            <div>
              <p className="panel-kicker">CLOSED & ARCHIVED</p>
              <h2>{archived.length} retained opportunities</h2>
            </div>
          </header>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Reference / tender</th>
                  <th>Organisation</th>
                  <th>Value</th>
                  <th>Result</th>
                  <th>Preparation spend</th>
                  <th><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody>
                {archived.map((bid) => (
                  <tr key={bid.id}>
                    <td>
                      <strong>{bid.title}</strong>
                      <small>{bid.reference}</small>
                    </td>
                    <td>{bid.organization}</td>
                    <td>{formatMoney(bid.valueMinor)}</td>
                    <td>
                      <span className={`bid-status status-${bid.stage}`}>
                        {labelStage(bid.stage)}
                      </span>
                    </td>
                    <td>{formatMoney(bid.spendMinor)}</td>
                    <td>
                      <Link href={`/bids/${bid.id}`}>Open record</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
