'use client';
/* eslint-disable jsx-a11y/control-has-associated-label */
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BarChart3, Download, Mail, Plus, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hasPermission } from '@/lib/security/permissions';
import { customerFinancialHealth } from '@/lib/customers/domain';

type Row = {
  id: string;
  code: string;
  name: string;
  category: string;
  status: string;
  tin: string | null;
  email: string | null;
  phone: string | null;
  primary_contact: string | null;
  active_projects: number;
  total_billed_minor: string;
  outstanding_minor: string;
  retention_minor: string;
  overdue_minor: string;
  credit_limit_minor: string;
};
type Data = {
  portfolio: Row[];
  contacts: Array<Record<string, unknown>>;
  statements: Array<Record<string, unknown>>;
  communications: Array<Record<string, unknown>>;
  salesHistory: Array<Record<string, unknown>>;
};
const money = (minor: unknown, currency = 'UGX') =>
  `${currency} ${(Number(minor ?? 0) / 100).toLocaleString('en-UG', { maximumFractionDigits: 0 })}`;
const text = (v: unknown) =>
  typeof v === 'string'
    ? v
    : v == null
      ? ''
      : typeof v === 'number' || typeof v === 'bigint' || typeof v === 'boolean'
        ? String(v)
        : JSON.stringify(v);
const nice = (v: unknown) =>
  text(v)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
const tabs = [
  'Customers',
  'Contacts',
  'Sales History',
  'Statements',
  'Communication',
  'Analytics',
] as const;
export function CustomersWorkspace({
  data,
  permissions,
}: {
  data: Data;
  permissions: readonly string[];
}) {
  const [tab, setTab] = useState<(typeof tabs)[number]>('Customers');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const financial = hasPermission(permissions, 'customers.financials.view');
  const customers = useMemo(
    () =>
      data.portfolio.filter(
        (c) =>
          (status === 'All' || c.status === status) &&
          `${c.name} ${c.code} ${c.tin ?? ''} ${c.email ?? ''} ${c.phone ?? ''} ${c.primary_contact ?? ''}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [data.portfolio, query, status],
  );
  const totals = data.portfolio.reduce(
    (a, c) => ({
      billed: a.billed + BigInt(c.total_billed_minor),
      outstanding: a.outstanding + BigInt(c.outstanding_minor),
      retention: a.retention + BigInt(c.retention_minor),
    }),
    { billed: 0n, outstanding: 0n, retention: 0n },
  );
  const exportCsv = () => {
    const rows = [
      [
        'Code',
        'Customer',
        'Category',
        'Primary contact',
        'Active projects',
        'Billed',
        'Outstanding',
        'Retention',
        'Status',
      ],
      ...customers.map((c) => [
        c.code,
        c.name,
        c.category,
        c.primary_contact ?? '',
        String(c.active_projects),
        c.total_billed_minor,
        c.outstanding_minor,
        c.retention_minor,
        c.status,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob(
        [
          rows
            .map((r) => r.map((v) => `"${v.replaceAll('"', '""')}"`).join(','))
            .join('\n'),
        ],
        { type: 'text/csv' },
      ),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'star-africa-customers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <main className="page-content customers-workspace">
      <section className="module-heading">
        <div>
          <p className="eyebrow">Commercial relationships</p>
          <h1>Customers &amp; Sales</h1>
          <p>
            See every client’s contacts, projects, invoices, payments,
            retention, communication, and outstanding position.
          </p>
        </div>
        <div className="heading-actions">
          <Button variant="outline" onClick={exportCsv}>
            <Download />
            Export
          </Button>
          {hasPermission(permissions, 'customers.create') ? (
            <Button render={<Link href="/customers/new" />}>
              <Plus />
              New customer
            </Button>
          ) : null}
        </div>
      </section>
      <section className="customer-kpis">
        <article>
          <span>Active customers</span>
          <strong>
            {data.portfolio.filter((c) => c.status === 'active').length}
          </strong>
          <small>
            {data.portfolio.filter((c) => c.active_projects > 0).length} with
            active projects
          </small>
        </article>
        {financial ? (
          <>
            <article>
              <span>Lifetime billed</span>
              <strong>{money(totals.billed)}</strong>
              <small>From authoritative invoices</small>
            </article>
            <article>
              <span>Outstanding receivables</span>
              <strong>{money(totals.outstanding)}</strong>
              <small>
                {
                  data.portfolio.filter((c) => BigInt(c.overdue_minor) > 0n)
                    .length
                }{' '}
                customers overdue
              </small>
            </article>
            <article>
              <span>Retention outstanding</span>
              <strong>{money(totals.retention)}</strong>
              <small>Held across customer projects</small>
            </article>
          </>
        ) : (
          <article className="customer-kpi-restricted">
            <span>Commercial financials</span>
            <strong>Restricted</strong>
            <small>Your role can view customer relationships.</small>
          </article>
        )}
      </section>
      <section className="panel customers-panel">
        <nav className="customer-tabs">
          {tabs.map((t) => (
            <button
              key={t}
              className={tab === t ? 'active' : ''}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </nav>
        <header className="customer-toolbar">
          <div>
            <h2>{tab}</h2>
            <p>
              {tab === 'Sales History'
                ? 'Authoritative commercial transactions — not customer summaries'
                : `${tab} relationship records`}
            </p>
          </div>
          <div>
            <label>
              <Search />
              <input
                aria-label={`Search ${tab}`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${tab.toLowerCase()}…`}
              />
            </label>
            {tab === 'Customers' ? (
              <select
                aria-label="Customer status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_hold">On Hold</option>
                <option value="archived">Archived</option>
              </select>
            ) : null}
          </div>
        </header>
        {tab === 'Customers' ? (
          <div className="table-scroll">
            <table className="customer-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Primary contact</th>
                  <th>Category</th>
                  <th>Active projects</th>
                  {financial ? (
                    <>
                      <th>Total billed</th>
                      <th>Outstanding</th>
                      <th>Retention</th>
                    </>
                  ) : null}
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/customers/${c.id}`}>
                        <strong>{c.name}</strong>
                        <small>
                          {c.code} {c.tin ? `· TIN ${c.tin}` : ''}
                        </small>
                      </Link>
                    </td>
                    <td>{c.primary_contact || 'Not assigned'}</td>
                    <td>{c.category}</td>
                    <td>{c.active_projects}</td>
                    {financial ? (
                      <>
                        <td>{money(c.total_billed_minor)}</td>
                        <td>
                          <strong>{money(c.outstanding_minor)}</strong>
                          <small
                            className={
                              BigInt(c.overdue_minor) > 0n ? 'overdue' : ''
                            }
                          >
                            {customerFinancialHealth({
                              outstandingMinor: c.outstanding_minor,
                              overdueMinor: c.overdue_minor,
                              retentionMinor: c.retention_minor,
                              creditLimitMinor: c.credit_limit_minor,
                            })}
                          </small>
                        </td>
                        <td>{money(c.retention_minor)}</td>
                      </>
                    ) : null}
                    <td>
                      <span className={`customer-status ${c.status}`}>
                        {nice(c.status)}
                      </span>
                    </td>
                    <td>
                      <Link
                        className="table-action"
                        href={`/customers/${c.id}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {tab === 'Contacts' ? (
          <SimpleTable
            rows={data.contacts.filter((r) =>
              JSON.stringify(r).toLowerCase().includes(query.toLowerCase()),
            )}
            columns={[
              ['name', 'Name'],
              ['customer_name', 'Customer'],
              ['job_title', 'Position'],
              ['department', 'Department'],
              ['phone', 'Phone'],
              ['email', 'Email'],
              ['contact_type', 'Role'],
              ['primary_contact', 'Primary?'],
              ['status', 'Status'],
            ]}
          />
        ) : null}
        {tab === 'Sales History' ? (
          <SimpleTable
            moneyKeys={[
              'gross_minor',
              'tax_minor',
              'retention_minor',
              'net_minor',
            ]}
            rows={data.salesHistory.filter((r) =>
              JSON.stringify(r).toLowerCase().includes(query.toLowerCase()),
            )}
            columns={[
              ['occurred_at', 'Date'],
              ['reference', 'Reference'],
              ['customer_name', 'Customer'],
              ['type', 'Type'],
              ['project_code', 'Project'],
              ['description', 'Description'],
              ['gross_minor', 'Gross'],
              ['tax_minor', 'Tax'],
              ['retention_minor', 'Retention'],
              ['net_minor', 'Net'],
              ['status', 'Status'],
            ]}
          />
        ) : null}
        {tab === 'Statements' ? (
          <SimpleTable
            moneyKeys={['closing_balance_minor']}
            rows={data.statements}
            columns={[
              ['statement_number', 'Statement'],
              ['customer_name', 'Customer'],
              ['period_from', 'From'],
              ['period_to', 'To'],
              ['closing_balance_minor', 'Balance'],
              ['generated_by_name', 'Generated by'],
              ['generated_at', 'Generated'],
              ['sent_at', 'Sent'],
            ]}
          />
        ) : null}
        {tab === 'Communication' ? (
          <SimpleTable
            rows={data.communications.filter((r) =>
              JSON.stringify(r).toLowerCase().includes(query.toLowerCase()),
            )}
            columns={[
              ['occurred_at', 'Date'],
              ['customer_name', 'Customer'],
              ['type', 'Type'],
              ['direction', 'Direction'],
              ['subject', 'Subject'],
              ['contact_name', 'Contact'],
              ['recorded_by_name', 'Recorded by'],
            ]}
          />
        ) : null}
        {tab === 'Analytics' ? (
          <div className="customer-analytics">
            <article>
              <BarChart3 />
              <h3>Outstanding by customer</h3>
              {[...data.portfolio]
                .sort((a, b) =>
                  Number(
                    BigInt(b.outstanding_minor) - BigInt(a.outstanding_minor),
                  ),
                )
                .slice(0, 6)
                .map((c) => (
                  <div key={c.id}>
                    <span>{c.name}</span>
                    <strong>{money(c.outstanding_minor)}</strong>
                    <i
                      style={{
                        width: `${totals.outstanding ? Number((BigInt(c.outstanding_minor) * 100n) / totals.outstanding) : 0}%`,
                      }}
                    />
                  </div>
                ))}
            </article>
            <article>
              <Users />
              <h3>Customer project position</h3>
              {data.portfolio
                .filter((c) => c.active_projects > 0)
                .map((c) => (
                  <div key={c.id}>
                    <span>{c.name}</span>
                    <strong>{c.active_projects} active</strong>
                  </div>
                ))}
            </article>
          </div>
        ) : null}
      </section>
    </main>
  );
}
function SimpleTable({
  rows,
  columns,
  moneyKeys = [],
}: {
  rows: Array<Record<string, unknown>>;
  columns: Array<[string, string]>;
  moneyKeys?: string[];
}) {
  return rows.length ? (
    <div className="table-scroll">
      <table className="customer-table">
        <thead>
          <tr>
            {columns.map(([, l]) => (
              <th key={l}>{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={text(r.id) || String(i)}>
              {columns.map(([k]) => (
                <td key={k}>
                  {moneyKeys.includes(k)
                    ? money(r[k], text(r.currency) || 'UGX')
                    : k.includes('date') || k.includes('_at')
                      ? r[k]
                        ? new Date(Number(r[k])).toLocaleDateString('en-UG')
                        : '—'
                      : k === 'primary_contact'
                        ? r[k]
                          ? 'Yes'
                          : 'No'
                        : nice(r[k]) || '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="customer-empty">
      <Mail />
      <h3>No records yet</h3>
      <p>New customer activity will appear here.</p>
    </div>
  );
}
