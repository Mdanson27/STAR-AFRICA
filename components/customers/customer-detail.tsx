'use client';
/* eslint-disable jsx-a11y/label-has-associated-control, jsx-a11y/control-has-associated-label */
import Link from 'next/link';
import { useState } from 'react';
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  MessageSquare,
  Plus,
  Printer,
  ReceiptText,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { hasPermission } from '@/lib/security/permissions';
import { customerFinancialHealth } from '@/lib/customers/domain';
type WS = {
  customer: Record<string, unknown>;
  contacts: Array<Record<string, unknown>>;
  projects: Array<Record<string, unknown>>;
  invoices: Array<Record<string, unknown>>;
  payments: Array<Record<string, unknown>>;
  retention: Array<Record<string, unknown>>;
  communications: Array<Record<string, unknown>>;
  notes: Array<Record<string, unknown>>;
  statements: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  activities: Array<Record<string, unknown>>;
  bids: Array<Record<string, unknown>>;
};
const tabs = [
  'Overview',
  'Contacts',
  'Projects',
  'Bids',
  'Sales',
  'Invoices',
  'Payments',
  'Retention',
  'Statements',
  'Documents',
  'Communication',
  'Notes',
  'Activity',
] as const;
const s = (v: unknown) =>
  typeof v === 'string'
    ? v
    : v == null
      ? ''
      : typeof v === 'number' || typeof v === 'bigint' || typeof v === 'boolean'
        ? String(v)
        : JSON.stringify(v);
const n = (v: unknown) => Number(v ?? 0);
const money = (v: unknown, c = 'UGX') =>
  `${c} ${(n(v) / 100).toLocaleString('en-UG', { maximumFractionDigits: 0 })}`;
const date = (v: unknown) =>
  v
    ? new Date(n(v)).toLocaleDateString('en-UG', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';
const nice = (v: unknown) =>
  s(v)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
export function CustomerDetail({
  workspace: w,
  permissions,
}: {
  workspace: WS;
  permissions: readonly string[];
}) {
  const c = w.customer;
  const [tab, setTab] = useState<(typeof tabs)[number]>('Overview');
  const [dialog, setDialog] = useState<
    'edit' | 'contact' | 'communication' | 'note' | 'statement' | null
  >(null);
  const [error, setError] = useState('');
  const [now] = useState(() => Date.now());
  const financial = hasPermission(permissions, 'customers.financials.view');
  const billed = w.invoices.reduce(
    (x, r) => x + BigInt(s(r.total_minor) || '0'),
    0n,
  );
  const outstanding = w.invoices.reduce(
    (x, r) =>
      x + BigInt(s(r.total_minor) || '0') - BigInt(s(r.paid_minor) || '0'),
    0n,
  );
  const overdue = w.invoices
    .filter(
      (r) =>
        n(r.due_date) < now &&
        BigInt(s(r.total_minor) || '0') > BigInt(s(r.paid_minor) || '0'),
    )
    .reduce(
      (x, r) => x + BigInt(s(r.total_minor)) - BigInt(s(r.paid_minor)),
      0n,
    );
  const retention = w.retention.reduce(
    (x, r) =>
      x + BigInt(s(r.amount_minor) || '0') - BigInt(s(r.received_minor) || '0'),
    0n,
  );
  const primary = w.contacts.find((x) => Boolean(x.primary_contact));
  const health = customerFinancialHealth({
    outstandingMinor: outstanding.toString(),
    overdueMinor: overdue.toString(),
    retentionMinor: retention.toString(),
    creditLimitMinor: s(c.credit_limit_minor) || '0',
  });
  const reload = () => window.location.reload();
  const archive = async () => {
    if (
      !confirm(
        'Archive this customer? Historical projects, invoices, payments, statements, communications and documents will remain intact.',
      )
    )
      return;
    const r = await fetch(`/api/customers/${s(c.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'archive' }),
    });
    if (r.ok) window.location.assign('/customers');
    else setError('Customer could not be archived.');
  };
  return (
    <main className="page-content customer-detail-page">
      <header className="customer-detail-head">
        <div>
          <Link href="/customers">
            <ArrowLeft />
            Back to customers
          </Link>
          <div className="customer-identity">
            <span>
              <Building2 />
            </span>
            <div>
              <p className="eyebrow">
                {s(c.code)} · {nice(c.customer_type)}
              </p>
              <h1>{s(c.name)}</h1>
              <p>
                <MapPin />
                {[c.city, c.district, c.country].filter(Boolean).join(', ') ||
                  'Address not set'}
              </p>
            </div>
          </div>
        </div>
        <div>
          <span className={`customer-status ${s(c.status)}`}>
            {nice(c.status)}
          </span>
          <span
            className={`financial-health ${health.toLowerCase().replaceAll(' ', '-')}`}
          >
            {health}
          </span>
          <div className="heading-actions">
            {hasPermission(permissions, 'customers.edit') ? (
              <Button variant="outline" onClick={() => setDialog('edit')}>
                Edit customer
              </Button>
            ) : null}
            {hasPermission(permissions, 'customers.contacts.manage') ? (
              <Button variant="outline" onClick={() => setDialog('contact')}>
                <UserPlus />
                Add contact
              </Button>
            ) : null}
            {hasPermission(permissions, 'customers.communication.manage') ? (
              <Button
                variant="outline"
                onClick={() => setDialog('communication')}
              >
                <MessageSquare />
                Record communication
              </Button>
            ) : null}
            {hasPermission(permissions, 'customers.statements.generate') ? (
              <Button onClick={() => setDialog('statement')}>
                <ReceiptText />
                Generate statement
              </Button>
            ) : null}
          </div>
        </div>
      </header>
      {error ? (
        <div className="form-error">
          <AlertTriangle />
          {error}
        </div>
      ) : null}
      <section className="customer-position">
        <article>
          <span>Primary contact</span>
          <strong>{s(primary?.name) || 'Not assigned'}</strong>
          <small>
            {s(primary?.email) || s(primary?.phone) || 'Add a customer contact'}
          </small>
        </article>
        <article>
          <span>Account owner</span>
          <strong>{s(c.account_manager_name) || 'Not assigned'}</strong>
          <small>{s(c.payment_terms)} payment terms</small>
        </article>
        {financial ? (
          <>
            <article>
              <span>Lifetime billed</span>
              <strong>{money(billed, s(c.preferred_currency) || 'UGX')}</strong>
              <small>{w.invoices.length} invoices</small>
            </article>
            <article>
              <span>Outstanding</span>
              <strong>
                {money(outstanding, s(c.preferred_currency) || 'UGX')}
              </strong>
              <small>
                {money(overdue, s(c.preferred_currency) || 'UGX')} overdue
              </small>
            </article>
            <article>
              <span>Retention</span>
              <strong>
                {money(retention, s(c.preferred_currency) || 'UGX')}
              </strong>
              <small>Across {w.retention.length} records</small>
            </article>
          </>
        ) : null}
      </section>
      <nav className="customer-detail-tabs">
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
      <section className="customer-tab-content">
        {tab === 'Overview' ? (
          <Overview w={w} financial={financial} health={health} />
        ) : null}
        {tab === 'Contacts' ? (
          <ContactCards
            rows={w.contacts}
            canAdd={hasPermission(permissions, 'customers.contacts.manage')}
            add={() => setDialog('contact')}
          />
        ) : null}
        {tab === 'Projects' ? (
          <DataTable
            rows={w.projects}
            cols={[
              ['code', 'Project'],
              ['name', 'Name'],
              ['contract_value_minor', 'Contract value'],
              ['completion_basis_points', 'Progress'],
              ['manager_name', 'Manager'],
              ['planned_completion_at', 'Expected completion'],
              ['health', 'Health'],
              ['status', 'Status'],
            ]}
            moneyKeys={financial ? ['contract_value_minor'] : []}
            linkBase="/projects"
          />
        ) : null}
        {tab === 'Bids' ? (
          <DataTable
            rows={w.bids}
            cols={[
              ['reference', 'Reference'],
              ['title', 'Tender'],
              ['published_at', 'Published'],
              ['estimated_value_minor', 'Value'],
              ['status', 'Status'],
              ['assigned_name', 'Officer'],
            ]}
            moneyKeys={financial ? ['estimated_value_minor'] : []}
            linkBase="/bids"
          />
        ) : null}
        {tab === 'Sales' ? (
          <DataTable
            rows={[
              ...w.invoices.map((r) => ({
                ...r,
                type: 'Invoice',
                reference: r.number,
                date: r.issue_date,
                amount: r.total_minor,
              })),
              ...w.payments.map((r) => ({
                ...r,
                type: 'Payment',
                date: r.received_or_paid_at,
                amount: r.amount_minor,
              })),
            ].sort((a, b) => n(b.date) - n(a.date))}
            cols={[
              ['date', 'Date'],
              ['reference', 'Reference'],
              ['type', 'Type'],
              ['project_code', 'Project'],
              ['amount', 'Amount'],
              ['status', 'Status'],
            ]}
            moneyKeys={['amount']}
          />
        ) : null}
        {tab === 'Invoices' ? (
          <DataTable
            rows={w.invoices}
            cols={[
              ['number', 'Invoice'],
              ['project_code', 'Project'],
              ['issue_date', 'Invoice date'],
              ['due_date', 'Due'],
              ['total_minor', 'Total'],
              ['paid_minor', 'Paid'],
              ['status', 'Status'],
            ]}
            moneyKeys={['total_minor', 'paid_minor']}
          />
        ) : null}
        {tab === 'Payments' ? (
          <DataTable
            rows={w.payments}
            cols={[
              ['reference', 'Reference'],
              ['received_or_paid_at', 'Date'],
              ['method', 'Method'],
              ['amount_minor', 'Amount'],
              ['allocated_minor', 'Allocated'],
              ['status', 'Status'],
            ]}
            moneyKeys={['amount_minor', 'allocated_minor']}
          />
        ) : null}
        {tab === 'Retention' ? (
          <DataTable
            rows={w.retention}
            cols={[
              ['project_code', 'Project'],
              ['invoice_number', 'Invoice'],
              ['basis_points', 'Rate'],
              ['amount_minor', 'Held'],
              ['received_minor', 'Released'],
              ['expected_release_at', 'Eligible'],
              ['status', 'Status'],
            ]}
            moneyKeys={['amount_minor', 'received_minor']}
          />
        ) : null}
        {tab === 'Statements' ? (
          <StatementList
            rows={w.statements}
            generate={() => setDialog('statement')}
            canGenerate={hasPermission(
              permissions,
              'customers.statements.generate',
            )}
          />
        ) : null}
        {tab === 'Documents' ? (
          <Documents
            rows={w.documents}
            customerId={s(c.id)}
            canManage={hasPermission(permissions, 'customers.documents.manage')}
          />
        ) : null}
        {tab === 'Communication' ? (
          <Communications
            rows={w.communications}
            add={() => setDialog('communication')}
            canAdd={hasPermission(
              permissions,
              'customers.communication.manage',
            )}
          />
        ) : null}
        {tab === 'Notes' ? (
          <Notes
            rows={w.notes}
            add={() => setDialog('note')}
            canAdd={hasPermission(permissions, 'customers.edit')}
          />
        ) : null}
        {tab === 'Activity' ? <Timeline rows={w.activities} /> : null}
      </section>
      {hasPermission(permissions, 'customers.archive') ? (
        <div className="customer-archive">
          <Button variant="destructive" onClick={archive}>
            <Archive />
            Archive customer
          </Button>
          <span>Historical relationships remain intact.</span>
        </div>
      ) : null}
      <ActionDialog
        type={dialog}
        setType={setDialog}
        customer={c}
        customerId={s(c.id)}
        contacts={w.contacts}
        projects={w.projects}
        currency={s(c.preferred_currency) || 'UGX'}
        done={reload}
      />
    </main>
  );
}
function Overview({
  w,
  financial,
  health,
}: {
  w: WS;
  financial: boolean;
  health: string;
}) {
  const c = w.customer;
  return (
    <div className="customer-overview-grid">
      <article className="panel">
        <header>
          <p className="eyebrow">Customer profile</p>
          <h2>Organization</h2>
        </header>
        <dl>
          <div>
            <dt>Legal name</dt>
            <dd>{s(c.name)}</dd>
          </div>
          <div>
            <dt>TIN</dt>
            <dd>{s(c.tin) || '—'}</dd>
          </div>
          <div>
            <dt>Category</dt>
            <dd>{s(c.category)}</dd>
          </div>
          <div>
            <dt>Main email</dt>
            <dd>{s(c.email) || '—'}</dd>
          </div>
          <div>
            <dt>Main phone</dt>
            <dd>{s(c.phone) || '—'}</dd>
          </div>
          <div>
            <dt>Billing email</dt>
            <dd>{s(c.billing_email) || '—'}</dd>
          </div>
          <div>
            <dt>Payment terms</dt>
            <dd>{s(c.payment_terms)}</dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>{s(c.address) || '—'}</dd>
          </div>
        </dl>
      </article>
      <article className="panel">
        <header>
          <p className="eyebrow">Project position</p>
          <h2>Delivery relationship</h2>
        </header>
        <div className="overview-metrics">
          <div>
            <strong>
              {w.projects.filter((p) => p.status === 'active').length}
            </strong>
            <span>Active projects</span>
          </div>
          <div>
            <strong>
              {w.projects.filter((p) => p.status === 'completed').length}
            </strong>
            <span>Completed</span>
          </div>
          <div>
            <strong>
              {w.projects.filter((p) => p.health === 'at_risk').length}
            </strong>
            <span>At risk</span>
          </div>
        </div>
      </article>
      {financial ? (
        <article className="panel">
          <header>
            <p className="eyebrow">Commercial health</p>
            <h2>{health}</h2>
          </header>
          <p className="overview-copy">
            Derived transparently from current receivables, overdue invoices,
            credit limit, and retention. Customer lifecycle status remains
            separate.
          </p>
        </article>
      ) : null}
      <article className="panel">
        <header>
          <p className="eyebrow">Recent activity</p>
          <h2>Relationship timeline</h2>
        </header>
        <Timeline rows={w.activities.slice(0, 5)} />
      </article>
    </div>
  );
}
function DataTable({
  rows,
  cols,
  moneyKeys = [],
  linkBase,
}: {
  rows: Array<Record<string, unknown>>;
  cols: Array<[string, string]>;
  moneyKeys?: string[];
  linkBase?: string;
}) {
  return rows.length ? (
    <div className="panel table-scroll">
      <table className="customer-detail-table">
        <thead>
          <tr>
            {cols.map(([, l]) => (
              <th key={l}>{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={s(r.id) || i}>
              {cols.map(([k], column) => (
                <td key={k}>
                  {column === 0 && linkBase ? (
                    <Link
                      className="table-action"
                      href={`${linkBase}/${s(r.id)}`}
                    >
                      {nice(r[k]) || 'Open'}
                    </Link>
                  ) : moneyKeys.includes(k) ? (
                    money(
                      r[k],
                      s(r.currency) || s(r.contract_currency) || 'UGX',
                    )
                  ) : k.endsWith('_at') || k.includes('date') ? (
                    date(r[k])
                  ) : k === 'completion_basis_points' ? (
                    `${n(r[k]) / 100}%`
                  ) : k === 'basis_points' ? (
                    `${n(r[k]) / 100}%`
                  ) : (
                    nice(r[k]) || '—'
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty
      title="No records"
      text="No linked authoritative records exist for this customer."
    />
  );
}
function ContactCards({
  rows,
  canAdd,
  add,
}: {
  rows: Array<Record<string, unknown>>;
  canAdd: boolean;
  add: () => void;
}) {
  return rows.length ? (
    <div className="contact-grid">
      {rows.map((r) => (
        <article className="panel" key={s(r.id)}>
          <header>
            <span>
              {s(r.name)
                .split(' ')
                .map((x) => x[0])
                .join('')
                .slice(0, 2)}
            </span>
            <div>
              <h3>{s(r.name)}</h3>
              <p>{s(r.job_title) || s(r.contact_type)}</p>
            </div>
            {r.primary_contact ? <i>Primary</i> : null}
          </header>
          <dl>
            <div>
              <dt>Phone</dt>
              <dd>{s(r.phone) || '—'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{s(r.email) || '—'}</dd>
            </div>
            <div>
              <dt>Department</dt>
              <dd>{s(r.department) || '—'}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{s(r.contact_type)}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  ) : (
    <Empty
      title="No contacts"
      text="No contacts have been added for this customer."
      action={canAdd ? 'Add contact' : undefined}
      click={add}
    />
  );
}
function StatementList({
  rows,
  generate,
  canGenerate,
}: {
  rows: Array<Record<string, unknown>>;
  generate: () => void;
  canGenerate: boolean;
}) {
  return (
    <>
      {rows.length ? (
        <DataTable
          rows={rows}
          cols={[
            ['statement_number', 'Statement'],
            ['period_from', 'From'],
            ['period_to', 'To'],
            ['closing_balance_minor', 'Balance'],
            ['overdue_balance_minor', 'Overdue'],
            ['generated_by_name', 'Generated by'],
            ['generated_at', 'Generated'],
          ]}
          moneyKeys={['closing_balance_minor', 'overdue_balance_minor']}
        />
      ) : (
        <Empty
          title="No statements"
          text="Generate a deterministic statement from invoices and payments."
          action={canGenerate ? 'Generate statement' : undefined}
          click={generate}
        />
      )}{' '}
      {rows.length ? (
        <div className="statement-links">
          {rows.map((r) => (
            <Button
              key={s(r.id)}
              variant="outline"
              render={<Link href={`/customers/statements/${s(r.id)}`} />}
            >
              <Printer />
              {s(r.statement_number)}
            </Button>
          ))}
        </div>
      ) : null}
    </>
  );
}
function Documents({
  rows,
  customerId,
  canManage,
}: {
  rows: Array<Record<string, unknown>>;
  customerId: string;
  canManage: boolean;
}) {
  return (
    <>
      {canManage ? (
        <div className="tab-actions">
          <Button
            render={
              <Link
                href={`/documents/upload?relatedModule=Customer&relatedRecordId=${customerId}`}
              />
            }
          >
            <Plus />
            Upload customer document
          </Button>
        </div>
      ) : null}
      {rows.length ? (
        <DataTable
          rows={rows}
          cols={[
            ['internal_number', 'Document'],
            ['title', 'Title'],
            ['category', 'Type'],
            ['reference_number', 'Reference'],
            ['document_date', 'Date'],
            ['uploaded_by_name', 'Uploaded by'],
            ['ocr_status', 'OCR'],
          ]}
          linkBase="/documents"
        />
      ) : (
        <Empty
          title="No customer documents"
          text="Documents linked in Documents & OCR will appear here."
        />
      )}
    </>
  );
}
function Communications({
  rows,
  add,
  canAdd,
}: {
  rows: Array<Record<string, unknown>>;
  add: () => void;
  canAdd: boolean;
}) {
  return (
    <>
      {canAdd ? (
        <div className="tab-actions">
          <Button onClick={add}>
            <Plus />
            Record communication
          </Button>
        </div>
      ) : null}
      {rows.length ? (
        <div className="communication-timeline">
          {rows.map((r) => (
            <article className="panel" key={s(r.id)}>
              <span>
                <MessageSquare />
              </span>
              <div>
                <p>
                  {date(r.occurred_at)} · {nice(r.type)} · {nice(r.direction)}
                </p>
                <h3>{s(r.subject)}</h3>
                <strong>
                  {s(r.contact_name) || 'General customer contact'}
                </strong>
                <p>{s(r.summary)}</p>
                {r.outcome ? (
                  <aside>
                    <b>Outcome</b>
                    {s(r.outcome)}
                  </aside>
                ) : null}
                {r.next_action ? (
                  <aside>
                    <b>Next action</b>
                    {s(r.next_action)}{' '}
                    {r.follow_up_at ? `by ${date(r.follow_up_at)}` : ''}
                  </aside>
                ) : null}
                <small>Recorded by {s(r.recorded_by_name)}</small>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="No communication"
          text="No communication has been recorded yet."
          action={canAdd ? 'Record communication' : undefined}
          click={add}
        />
      )}
    </>
  );
}
function Notes({
  rows,
  add,
  canAdd,
}: {
  rows: Array<Record<string, unknown>>;
  add: () => void;
  canAdd: boolean;
}) {
  return (
    <>
      {canAdd ? (
        <div className="tab-actions">
          <Button onClick={add}>
            <Plus />
            Add internal note
          </Button>
        </div>
      ) : null}
      {rows.length ? (
        <div className="notes-grid">
          {rows.map((r) => (
            <article className="panel" key={s(r.id)}>
              {r.pinned ? <i>Pinned</i> : null}
              <p>{s(r.note)}</p>
              <small>
                {s(r.author_name)} · {date(r.created_at)}
              </small>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="No internal notes"
          text="Notes are private and never appear on statements."
          action={canAdd ? 'Add note' : undefined}
          click={add}
        />
      )}
    </>
  );
}
function Timeline({ rows }: { rows: Array<Record<string, unknown>> }) {
  return (
    <div className="customer-timeline">
      {rows.length ? (
        rows.map((r) => (
          <div key={s(r.id)}>
            <span />
            <p>
              <strong>{nice(r.action)}</strong>
              {s(r.summary)}
              <small>
                {date(r.occurred_at)}
                {r.actor_name ? ` · ${s(r.actor_name)}` : ''}
              </small>
            </p>
          </div>
        ))
      ) : (
        <p className="empty-inline">No activity yet.</p>
      )}
    </div>
  );
}
function Empty({
  title,
  text,
  action,
  click,
}: {
  title: string;
  text: string;
  action?: string;
  click?: () => void;
}) {
  return (
    <div className="panel customer-tab-empty">
      <Mail />
      <h3>{title}</h3>
      <p>{text}</p>
      {action ? (
        <Button onClick={click}>
          <Plus />
          {action}
        </Button>
      ) : null}
    </div>
  );
}
function ActionDialog({
  type,
  setType,
  customer,
  customerId,
  contacts,
  projects,
  currency,
  done,
}: {
  type: 'edit' | 'contact' | 'communication' | 'note' | 'statement' | null;
  setType: (v: null) => void;
  customer: Record<string, unknown>;
  customerId: string;
  contacts: Array<Record<string, unknown>>;
  projects: Array<Record<string, unknown>>;
  currency: string;
  done: () => void;
}) {
  const editDefaults = {
    name: s(customer.name),
    status: s(customer.status),
    category: s(customer.category),
    email: s(customer.email),
    phone: s(customer.phone),
    notes: s(customer.notes),
  };
  const [changes, setF] = useState<Record<string, unknown>>({});
  const f = type === 'edit' ? { ...editDefaults, ...changes } : changes;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const send = async () => {
    setBusy(true);
    setErr('');
    const editing = type === 'edit';
    const r = await fetch(
      editing
        ? `/api/customers/${customerId}`
        : `/api/customers/${customerId}/actions`,
      {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? f : { type, ...f, currency }),
      },
    );
    const b = (await r.json()) as { error?: string };
    setBusy(false);
    if (!r.ok) {
      setErr(b.error || 'Could not save.');
      return;
    }
    setType(null);
    setF({});
    done();
  };
  return (
    <Dialog
      open={Boolean(type)}
      onOpenChange={(o) => {
        if (!o) setType(null);
      }}
    >
      <DialogContent className="customer-action-dialog">
        <DialogHeader>
          <DialogTitle>
            {type === 'edit'
              ? 'Edit customer'
              : type === 'contact'
                ? 'Add contact'
                : type === 'communication'
                  ? 'Record communication'
                  : type === 'note'
                    ? 'Add internal note'
                    : 'Generate customer statement'}
          </DialogTitle>
          <DialogDescription>
            Saved to the customer relationship record and audit history.
          </DialogDescription>
        </DialogHeader>
        <div className="customer-dialog-form">
          {type === 'edit' ? (
            <>
              <F label="Organization name *" k="name" f={f} set={setF} />
              <Sel
                label="Status"
                k="status"
                values={['active', 'inactive', 'on_hold', 'blocked']}
                f={f}
                set={setF}
              />
              <Sel
                label="Category"
                k="category"
                values={[
                  'Government',
                  'NGO',
                  'Private Company',
                  'Hospital/Medical',
                  'Education',
                  'Local Government',
                  'International Organisation',
                  'Other',
                ]}
                f={f}
                set={setF}
              />
              <F label="Main phone" k="phone" f={f} set={setF} />
              <F label="Main email" k="email" type="email" f={f} set={setF} />
              <label className="wide">
                <span>Internal notes</span>
                <Textarea
                  aria-label="Internal notes"
                  value={s(f.notes)}
                  onChange={(e) => setF({ ...f, notes: e.target.value })}
                />
              </label>
            </>
          ) : null}
          {type === 'contact' ? (
            <>
              <F label="Full name *" k="name" f={f} set={setF} />
              <F label="Job title" k="jobTitle" f={f} set={setF} />
              <F label="Department" k="department" f={f} set={setF} />
              <F label="Phone" k="phone" f={f} set={setF} />
              <F label="Email" k="email" type="email" f={f} set={setF} />
              <F label="WhatsApp" k="whatsapp" f={f} set={setF} />
              <Sel
                label="Contact role"
                k="contactType"
                values={[
                  'Primary',
                  'Finance',
                  'Procurement',
                  'Technical',
                  'Project',
                  'Director/Management',
                  'Legal',
                  'Other',
                ]}
                f={f}
                set={setF}
              />
              <Sel
                label="Preferred channel"
                k="preferredChannel"
                values={['Email', 'Phone', 'WhatsApp']}
                f={f}
                set={setF}
              />
              <CheckBox label="Primary contact" k="primary" f={f} set={setF} />
              <CheckBox label="Billing contact" k="billing" f={f} set={setF} />
            </>
          ) : null}
          {type === 'communication' ? (
            <>
              <Sel
                label="Type"
                k="communicationType"
                values={[
                  'Email',
                  'Call',
                  'WhatsApp',
                  'Meeting',
                  'Letter',
                  'Site Meeting',
                  'Portal Communication',
                  'Other',
                ]}
                f={f}
                set={setF}
              />
              <Sel
                label="Direction"
                k="direction"
                values={['Outbound', 'Inbound']}
                f={f}
                set={setF}
              />
              <label>
                <span>Contact</span>
                <NativeSelect
                  aria-label="Contact"
                  onChange={(e) => setF({ ...f, contactId: e.target.value })}
                >
                  <option value="">General</option>
                  {contacts.map((x) => (
                    <option value={s(x.id)} key={s(x.id)}>
                      {s(x.name)}
                    </option>
                  ))}
                </NativeSelect>
              </label>
              <F
                label="Date / time"
                k="occurredAt"
                type="datetime-local"
                f={f}
                set={setF}
              />
              <F label="Subject *" k="subject" f={f} set={setF} />
              <label className="wide">
                <span>Summary *</span>
                <Textarea
                  aria-label="Summary"
                  onChange={(e) => setF({ ...f, summary: e.target.value })}
                />
              </label>
              <F label="Outcome" k="outcome" f={f} set={setF} />
              <F label="Next action" k="nextAction" f={f} set={setF} />
              <F
                label="Follow-up"
                k="followUpAt"
                type="datetime-local"
                f={f}
                set={setF}
              />
              <label>
                <span>Related project</span>
                <NativeSelect
                  aria-label="Related project"
                  onChange={(e) => setF({ ...f, projectId: e.target.value })}
                >
                  <option value="">None</option>
                  {projects.map((x) => (
                    <option value={s(x.id)} key={s(x.id)}>
                      {s(x.code)} — {s(x.name)}
                    </option>
                  ))}
                </NativeSelect>
              </label>
            </>
          ) : null}
          {type === 'note' ? (
            <>
              <label className="wide">
                <span>Internal note *</span>
                <Textarea
                  aria-label="Internal note"
                  onChange={(e) => setF({ ...f, note: e.target.value })}
                />
              </label>
              <CheckBox label="Pin note" k="pinned" f={f} set={setF} />
            </>
          ) : null}
          {type === 'statement' ? (
            <>
              <F label="From date" k="from" type="date" f={f} set={setF} />
              <F label="To date" k="to" type="date" f={f} set={setF} />
              <CheckBox
                label="Include paid transactions"
                k="includePaid"
                f={f}
                set={setF}
              />
              <CheckBox
                label="Include retention summary"
                k="includeRetention"
                f={f}
                set={setF}
              />
            </>
          ) : null}
        </div>
        {err ? <div className="form-error">{err}</div> : null}
        <footer>
          <Button variant="outline" onClick={() => setType(null)}>
            Cancel
          </Button>
          <Button disabled={busy} onClick={send}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
function F({
  label,
  k,
  type = 'text',
  f,
  set,
}: {
  label: string;
  k: string;
  type?: string;
  f: Record<string, unknown>;
  set: (v: Record<string, unknown>) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <Input
        aria-label={label}
        type={type}
        value={s(f[k])}
        onChange={(e) => set({ ...f, [k]: e.target.value })}
      />
    </label>
  );
}
function Sel({
  label,
  k,
  values,
  f,
  set,
}: {
  label: string;
  k: string;
  values: string[];
  f: Record<string, unknown>;
  set: (v: Record<string, unknown>) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <NativeSelect
        aria-label={label}
        value={s(f[k])}
        onChange={(e) => set({ ...f, [k]: e.target.value })}
      >
        <option value="">Select</option>
        {values.map((v) => (
          <option key={v}>{v}</option>
        ))}
      </NativeSelect>
    </label>
  );
}
function CheckBox({
  label,
  k,
  f,
  set,
}: {
  label: string;
  k: string;
  f: Record<string, unknown>;
  set: (v: Record<string, unknown>) => void;
}) {
  return (
    <label className="dialog-check">
      <input
        type="checkbox"
        checked={Boolean(f[k])}
        onChange={(e) => set({ ...f, [k]: e.target.checked })}
      />
      <span>{label}</span>
    </label>
  );
}
