import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { requireSession } from '@/lib/security/session';
import { demoBids, formatMoney } from '@/lib/bids/demo-data';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Bid Analytics' };
export default async function BidAnalyticsPage() {
  const session = await requireSession('/bids/analytics');
  const decisions = demoBids.filter((bid) =>
    ['won', 'lost'].includes(bid.stage),
  );
  const won = decisions.filter((bid) => bid.stage === 'won');
  const categories = [...new Set(demoBids.map((bid) => bid.category))].map(
    (category) => ({
      category,
      count: demoBids.filter((bid) => bid.category === category).length,
      value: demoBids
        .filter((bid) => bid.category === category)
        .reduce((sum, bid) => sum + Number(bid.valueMinor), 0),
    }),
  );
  return (
    <AppShell
      active="Bids & tenders"
      user={{ name: session.name, role: session.role }}
    >
      <div className="page-content analytics-page">
        <div className="section-page-heading">
          <div>
            <p className="eyebrow">PERFORMANCE INTELLIGENCE</p>
            <h1>Bid analytics</h1>
            <p>
              Pipeline, conversion, spend and loss intelligence from fictional
              demo opportunities.
            </p>
          </div>
          <Link href="/bids">Back to overview</Link>
        </div>
        <section className="bid-kpis">
          <article>
            <span>Opportunities</span>
            <strong>{demoBids.length}</strong>
            <small>Current sample</small>
          </article>
          <article>
            <span>Submitted</span>
            <strong>
              {
                demoBids.filter((bid) =>
                  ['submitted', 'awaiting_result', 'won', 'lost'].includes(
                    bid.stage,
                  ),
                ).length
              }
            </strong>
            <small>Across all periods</small>
          </article>
          <article>
            <span>Win rate</span>
            <strong>
              {Math.round((won.length / decisions.length) * 100)}%
            </strong>
            <small>
              {won.length} of {decisions.length} decisions
            </small>
          </article>
          <article>
            <span>Pipeline value</span>
            <strong>
              {formatMoney(
                demoBids
                  .filter(
                    (bid) => !['won', 'lost', 'archived'].includes(bid.stage),
                  )
                  .reduce((sum, bid) => sum + Number(bid.valueMinor), 0),
              )}
            </strong>
            <small>Active opportunities</small>
          </article>
          <article>
            <span>Preparation spend</span>
            <strong>
              {formatMoney(
                demoBids.reduce((sum, bid) => sum + Number(bid.spendMinor), 0),
              )}
            </strong>
            <small>Budget vs actual tracked</small>
          </article>
          <article>
            <span>Average qualification</span>
            <strong>
              {Math.round(
                demoBids.reduce((sum, bid) => sum + bid.qualificationScore, 0) /
                  demoBids.length,
              )}
            </strong>
            <small>Weighted score</small>
          </article>
        </section>
        <div className="analytics-grid">
          <section className="panel analytics-card">
            <header>
              <div>
                <p className="panel-kicker">PIPELINE MIX</p>
                <h2>Value by category</h2>
              </div>
              <span>UGX</span>
            </header>
            <div className="bar-chart">
              {categories.map((item) => (
                <div key={item.category}>
                  <label>
                    <span>{item.category}</span>
                    <strong>{formatMoney(item.value)}</strong>
                  </label>
                  <i>
                    <b
                      style={{
                        width: `${Math.max(8, (item.value / Math.max(...categories.map((category) => category.value))) * 100)}%`,
                      }}
                    />
                  </i>
                </div>
              ))}
            </div>
          </section>
          <section className="panel analytics-card">
            <header>
              <div>
                <p className="panel-kicker">LOSS INTELLIGENCE</p>
                <h2>Recorded loss reasons</h2>
              </div>
              <span>Decisions</span>
            </header>
            <div className="loss-chart">
              <div style={{ '--share': '48%' } as React.CSSProperties}>
                <strong>48%</strong>
                <span>Competitor price advantage</span>
              </div>
              <div style={{ '--share': '27%' } as React.CSSProperties}>
                <strong>27%</strong>
                <span>Technical score</span>
              </div>
              <div style={{ '--share': '15%' } as React.CSSProperties}>
                <strong>15%</strong>
                <span>Experience criteria</span>
              </div>
              <div style={{ '--share': '10%' } as React.CSSProperties}>
                <strong>10%</strong>
                <span>Other / unknown</span>
              </div>
            </div>
          </section>
          <section className="panel analytics-card full">
            <header>
              <div>
                <p className="panel-kicker">OFFICER & SOURCE PERFORMANCE</p>
                <h2>Acquisition effectiveness</h2>
              </div>
            </header>
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Opportunities</th>
                  <th>Pursued</th>
                  <th>Submitted</th>
                  <th>Win rate</th>
                  <th>Average bid spend</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Manual</strong>
                  </td>
                  <td>5</td>
                  <td>4</td>
                  <td>3</td>
                  <td>50%</td>
                  <td>UGX 814K</td>
                </tr>
                <tr>
                  <td>
                    <strong>CSV Import</strong>
                  </td>
                  <td>2</td>
                  <td>2</td>
                  <td>1</td>
                  <td>—</td>
                  <td>UGX 925K</td>
                </tr>
                <tr>
                  <td>
                    <strong>Demo Provider</strong>
                  </td>
                  <td>2</td>
                  <td>1</td>
                  <td>0</td>
                  <td>—</td>
                  <td>UGX 155K</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
