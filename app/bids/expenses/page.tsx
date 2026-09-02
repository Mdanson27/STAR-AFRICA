import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { requireSession } from '@/lib/security/session';
import { hasPermission } from '@/lib/security/permissions';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Bid Expenses' };
const expenses = [
  [
    'BEX-2026-052',
    'MOH/SUPLS/26/114',
    '02 Sep',
    'Printing',
    'Kampala Print Demo',
    'UGX 420,000',
    'Draft',
  ],
  [
    'BEX-2026-047',
    'MOH/SUPLS/26/114',
    '28 Aug',
    'Bid security fee',
    'Demo Bank Uganda',
    'UGX 2,150,000',
    'Submitted',
  ],
  [
    'BEX-2026-044',
    'MOH/SUPLS/26/114',
    '22 Aug',
    'Site visit',
    'Star Africa fleet',
    'UGX 680,000',
    'Approved',
  ],
  [
    'BEX-2026-039',
    'KCCA/WRKS/26/044',
    '19 Aug',
    'Consultant',
    'Engineering Review Demo',
    'UGX 1,850,000',
    'Paid',
  ],
  [
    'BEX-2026-031',
    'JMS/MED/2026/031',
    '05 Aug',
    'Courier',
    'Safe Delivery Demo',
    'UGX 165,000',
    'Posted',
  ],
];
export default async function BidExpensesPage() {
  const session = await requireSession('/bids/expenses');
  const canCreate = hasPermission(session.permissions, 'bids.expenses.create');
  return (
    <AppShell
      active="Bids & tenders"
      user={{ name: session.name, role: session.role }}
    >
      <div className="page-content expenses-page">
        <div className="section-page-heading">
          <div>
            <p className="eyebrow">PREPARATION COST CONTROL</p>
            <h1>Bid expenses</h1>
            <p>
              Separate tender acquisition cost from contract pricing and project
              delivery.
            </p>
          </div>
          <div>
            {canCreate ? (
              <span className="access-chip">Expense recording permitted</span>
            ) : (
              <span className="locked-note">View only for {session.role}</span>
            )}
            <Link href="/bids">Back to overview</Link>
          </div>
        </div>
        <section className="bid-kpis">
          <article>
            <span>Total bid spend</span>
            <strong>UGX 4.82M</strong>
            <small>Current filtered period</small>
          </article>
          <article>
            <span>Average cost / bid</span>
            <strong>UGX 603K</strong>
            <small>8 opportunities</small>
          </article>
          <article>
            <span>Cost of won bids</span>
            <strong>UGX 460K</strong>
            <small>9.5% of spend</small>
          </article>
          <article>
            <span>Pending approval</span>
            <strong>UGX 2.57M</strong>
            <small>2 expense records</small>
          </article>
        </section>
        <section className="panel workspace-panel full">
          <header>
            <div>
              <p className="panel-kicker">EXPENSE REGISTER</p>
              <h2>Budget vs actual transactions</h2>
            </div>
          </header>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Expense</th>
                  <th>Bid</th>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Payee</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, index) => (
                      <td key={cell}>
                        {index === 0 ? (
                          <strong>{cell}</strong>
                        ) : index === 6 ? (
                          <span className="bid-status">{cell}</span>
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
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
