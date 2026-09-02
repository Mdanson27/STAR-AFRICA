'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Archive,
  BarChart3,
  Columns3,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  LayoutList,
  Plus,
  Search,
  Star,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { hasPermission } from '@/lib/security/permissions';
import { deadlineState } from '@/lib/bids/domain';
import { formatMoney, labelStage, type DemoBid } from '@/lib/bids/demo-data';

const activeStages = new Set([
  'new',
  'reviewing',
  'qualification',
  'approved_to_pursue',
  'preparing',
  'internal_review',
  'ready_for_submission',
  'submitted',
  'awaiting_result',
]);

export function BidsOverview({
  bids,
  permissions,
}: {
  bids: DemoBid[];
  permissions: string[];
}) {
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState('active');
  const [view, setView] = useState<'table' | 'pipeline'>('table');
  const [watched, setWatched] = useState(false);
  const canCreate = hasPermission(permissions, 'bids.create');
  const canExport = hasPermission(permissions, 'bids.export');
  const filtered = useMemo(
    () =>
      bids.filter((bid) => {
        const needle = query.toLowerCase();
        const matches =
          !needle ||
          [
            bid.reference,
            bid.title,
            bid.organization,
            bid.category,
            bid.owner,
          ].some((value) => value.toLowerCase().includes(needle));
        const stageMatch =
          stage === 'all' ||
          (stage === 'active'
            ? activeStages.has(bid.stage)
            : bid.stage === stage);
        return matches && stageMatch && (!watched || bid.watched);
      }),
    [bids, query, stage, watched],
  );
  const active = bids.filter((bid) => activeStages.has(bid.stage));
  const submitted = bids.filter((bid) =>
    ['submitted', 'awaiting_result'].includes(bid.stage),
  );
  const won = bids.filter((bid) => bid.stage === 'won');
  const closed = bids.filter((bid) => ['won', 'lost'].includes(bid.stage));
  const pipeline = active.reduce((sum, bid) => sum + Number(bid.valueMinor), 0);
  const spend = bids.reduce((sum, bid) => sum + Number(bid.spendMinor), 0);
  const wonValue = won.reduce((sum, bid) => sum + Number(bid.valueMinor), 0);

  function exportCsv() {
    const headers = [
      'Reference',
      'Tender',
      'Organization',
      'Category',
      'Deadline',
      'Value',
      'Owner',
      'Progress',
      'Status',
    ];
    const rows = filtered.map((bid) => [
      bid.reference,
      bid.title,
      bid.organization,
      bid.category,
      bid.deadline,
      bid.valueMinor,
      bid.owner,
      String(bid.progress),
      labelStage(bid.stage),
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','),
      )
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'star-africa-bid-pipeline.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page-content bids-page">
      <section className="bids-heading">
        <div>
          <p className="eyebrow">OPPORTUNITY TO AWARD</p>
          <h1>Bids &amp; Tenders</h1>
          <p>
            Manage opportunities, qualification, preparation, submission and
            award.
          </p>
        </div>
        <div className="heading-actions">
          <Link
            className={buttonVariants({ variant: 'outline', size: 'lg' })}
            href="/bids/import"
          >
            <FileSpreadsheet /> Import opportunities
          </Link>
          <Button
            variant="outline"
            size="lg"
            onClick={exportCsv}
            disabled={!canExport}
            title={!canExport ? 'Your role cannot export bid data.' : undefined}
          >
            <Download /> Export
          </Button>
          {canCreate ? (
            <Link
              className={buttonVariants({ size: 'lg' })}
              href="/bids/opportunities/new"
            >
              <Plus /> New opportunity
            </Link>
          ) : null}
        </div>
      </section>
      {!canCreate ? (
        <div className="permission-banner">
          <Eye />
          <span>
            <strong>Read-only role view</strong>Your current role can inspect
            permitted bid records but cannot create or edit opportunities.
          </span>
        </div>
      ) : null}
      <section className="bid-kpis">
        <article>
          <span>Active pipeline</span>
          <strong>{active.length}</strong>
          <small>{formatMoney(pipeline)}</small>
        </article>
        <article>
          <span>Closing soon</span>
          <strong>
            {
              active.filter((bid) =>
                ['critical', 'approaching'].includes(
                  deadlineState(
                    new Date(bid.deadline),
                    new Date('2026-09-02T12:00:00+03:00'),
                  ).tone,
                ),
              ).length
            }
          </strong>
          <small>Within 7 days</small>
        </article>
        <article>
          <span>Submitted</span>
          <strong>{submitted.length}</strong>
          <small>
            {formatMoney(
              submitted.reduce((sum, bid) => sum + Number(bid.valueMinor), 0),
            )}
          </small>
        </article>
        <article>
          <span>Win rate</span>
          <strong>
            {closed.length
              ? `${Math.round((won.length / closed.length) * 100)}%`
              : '—'}
          </strong>
          <small>
            {won.length} of {closed.length} decisions
          </small>
        </article>
        <article>
          <span>Bid spend</span>
          <strong>{formatMoney(spend)}</strong>
          <small>Preparation actuals</small>
        </article>
        <article>
          <span>Value won</span>
          <strong>{formatMoney(wonValue)}</strong>
          <small>Current year</small>
        </article>
      </section>
      <nav className="bids-subnav" aria-label="Bids workspace">
        <Link className="active" href="/bids">
          Overview
        </Link>
        <Link href="/bids?view=opportunities">Opportunities</Link>
        <button type="button" onClick={() => setView('pipeline')}>
          Pipeline
        </button>
        <Link href="/bids/expenses">Bid expenses</Link>
        <Link href="/bids/analytics">Analytics</Link>
        <Link href="/bids/archive">Archive</Link>
      </nav>
      <section className="panel bid-register">
        <div className="bid-toolbar">
          <div>
            <h2>Opportunity register</h2>
            <span>
              {filtered.length} records · fictional demonstration data
            </span>
          </div>
          <div className="bid-toolbar-actions">
            <label>
              <Search />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, reference, organisation…"
              />
            </label>
            <select
              aria-label="Filter status"
              value={stage}
              onChange={(event) => setStage(event.target.value)}
            >
              <option value="active">Active pipeline</option>
              <option value="all">All statuses</option>
              <option value="preparing">Preparing</option>
              <option value="awaiting_result">Awaiting result</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
            <button
              className={watched ? 'active' : ''}
              onClick={() => setWatched((value) => !value)}
            >
              <Star /> Watched
            </button>
            <span className="view-switch">
              <button
                className={view === 'table' ? 'active' : ''}
                onClick={() => setView('table')}
                aria-label="Table view"
              >
                <LayoutList />
              </button>
              <button
                className={view === 'pipeline' ? 'active' : ''}
                onClick={() => setView('pipeline')}
                aria-label="Pipeline view"
              >
                <Columns3 />
              </button>
            </span>
          </div>
        </div>
        {view === 'table' ? (
          <div className="table-scroll">
            <table className="bids-table">
              <thead>
                <tr>
                  <th>Reference / tender</th>
                  <th>Organisation</th>
                  <th>Deadline</th>
                  <th>Value</th>
                  <th>Owner</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bid) => {
                  const deadline = deadlineState(
                    new Date(bid.deadline),
                    new Date('2026-09-02T12:00:00+03:00'),
                  );
                  return (
                    <tr key={bid.id}>
                      <td>
                        <Link href={`/bids/${bid.id}`} aria-label={`Open ${bid.title}`}>
                          <strong>{bid.title}</strong>
                          <span>
                            {bid.reference} · {bid.category}
                          </span>
                        </Link>
                      </td>
                      <td>{bid.organization}</td>
                      <td>
                        <span className={`deadline deadline-${deadline.tone}`}>
                          {deadline.label}
                        </span>
                        <small>
                          {new Date(bid.deadline).toLocaleDateString('en-UG', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </small>
                      </td>
                      <td>{formatMoney(bid.valueMinor, bid.currency)}</td>
                      <td>{bid.owner}</td>
                      <td>
                        <div className="bid-progress">
                          <progress aria-label={`${bid.title} completion`} value={bid.progress} max="100" />
                          <span>{bid.progress}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`bid-status status-${bid.stage}`}>
                          {labelStage(bid.stage)}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/bids/${bid.id}`}
                          aria-label={`View ${bid.title}`}
                        >
                          <Eye />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Pipeline bids={filtered} />
        )}
        {!filtered.length ? (
          <div className="bid-empty">
            <Filter />
            <h3>No opportunities match</h3>
            <p>Clear a filter or try a broader search.</p>
          </div>
        ) : null}
      </section>
      <section className="bid-foot-actions">
        <Link href="/bids/analytics">
          <BarChart3 /> Open bid analytics
        </Link>
        <Link href="/bids/archive">
          <Archive /> Search archive
        </Link>
      </section>
    </div>
  );
}

function Pipeline({ bids }: { bids: DemoBid[] }) {
  const stages = [
    'new',
    'reviewing',
    'qualification',
    'preparing',
    'internal_review',
    'ready_for_submission',
    'submitted',
    'awaiting_result',
  ];
  return (
    <div className="pipeline-scroll">
      <div className="pipeline-board">
        {stages.map((stage) => (
          <section key={stage}>
            <header>
              <strong>{labelStage(stage)}</strong>
              <span>{bids.filter((bid) => bid.stage === stage).length}</span>
            </header>
            {bids
              .filter((bid) => bid.stage === stage)
              .map((bid) => (
                <Link
                  key={bid.id}
                  href={`/bids/${bid.id}`}
                  className="pipeline-card"
                >
                  <span>{bid.reference}</span>
                  <strong>{bid.title}</strong>
                  <small>{bid.organization}</small>
                  <div>
                    <b>{formatMoney(bid.valueMinor)}</b>
                    <em>{bid.progress}%</em>
                  </div>
                  <progress aria-label={`${bid.title} completion`} value={bid.progress} max="100" />
                </Link>
              ))}
          </section>
        ))}
      </div>
    </div>
  );
}
