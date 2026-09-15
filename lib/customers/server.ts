import 'server-only';
import { env } from 'cloudflare:workers';
import { buildStatement, type StatementEvent } from './domain';

export type CustomerRegisterRow = {
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

export async function listCustomerPortfolio() {
  const result =
    await env.DB.prepare(`SELECT c.id,c.code,c.name,c.category,c.status,c.tin,c.email,c.phone,c.credit_limit_minor,
    (SELECT cc.name FROM customer_contacts cc WHERE cc.customer_id=c.id AND cc.primary_contact=1 AND cc.archived_at IS NULL LIMIT 1) primary_contact,
    (SELECT COUNT(*) FROM projects p WHERE p.customer_id=c.id AND p.status='active' AND p.archived_at IS NULL) active_projects,
    COALESCE((SELECT CAST(SUM(CAST(i.total_minor AS INTEGER)) AS TEXT) FROM invoices i WHERE i.customer_id=c.id AND i.status!='draft'),'0') total_billed_minor,
    COALESCE((SELECT CAST(SUM(CAST(i.total_minor AS INTEGER)-CAST(i.paid_minor AS INTEGER)) AS TEXT) FROM invoices i WHERE i.customer_id=c.id AND i.status NOT IN ('draft','void')),'0') outstanding_minor,
    COALESCE((SELECT CAST(SUM(CAST(r.amount_minor AS INTEGER)-CAST(r.received_minor AS INTEGER)) AS TEXT) FROM retentions r JOIN projects p ON p.id=r.project_id WHERE p.customer_id=c.id),'0') retention_minor,
    COALESCE((SELECT CAST(SUM(CAST(i.total_minor AS INTEGER)-CAST(i.paid_minor AS INTEGER)) AS TEXT) FROM invoices i WHERE i.customer_id=c.id AND i.due_date < ? AND CAST(i.total_minor AS INTEGER)>CAST(i.paid_minor AS INTEGER)),'0') overdue_minor
    FROM customers c WHERE c.company_id=? ORDER BY c.name`)
      .bind(Date.now(), 'company-star-africa')
      .all<CustomerRegisterRow>();
  return result.results;
}

export async function getCustomerModuleData() {
  const [portfolio, contacts, statements, communications, invoices, payments] =
    await Promise.all([
      listCustomerPortfolio(),
      env.DB.prepare(
        `SELECT cc.*,c.name customer_name FROM customer_contacts cc JOIN customers c ON c.id=cc.customer_id WHERE cc.archived_at IS NULL ORDER BY cc.updated_at DESC`,
      ).all(),
      env.DB.prepare(
        `SELECT s.*,c.name customer_name,u.display_name generated_by_name FROM customer_statements s JOIN customers c ON c.id=s.customer_id JOIN users u ON u.id=s.generated_by ORDER BY s.generated_at DESC`,
      ).all(),
      env.DB.prepare(
        `SELECT cm.*,c.name customer_name,ct.name contact_name,u.display_name recorded_by_name FROM customer_communications cm JOIN customers c ON c.id=cm.customer_id LEFT JOIN customer_contacts ct ON ct.id=cm.contact_id JOIN users u ON u.id=cm.recorded_by ORDER BY cm.occurred_at DESC`,
      ).all(),
      env.DB.prepare(
        `SELECT i.id,i.issue_date occurred_at,i.number reference,c.name customer_name,'Invoice' type,p.code project_code,'Customer invoice' description,i.total_minor gross_minor,i.tax_minor,i.retention_minor,(CAST(i.total_minor AS INTEGER)-CAST(i.retention_minor AS INTEGER)) net_minor,i.currency,i.status FROM invoices i JOIN customers c ON c.id=i.customer_id LEFT JOIN projects p ON p.id=i.project_id ORDER BY i.issue_date DESC`,
      ).all(),
      env.DB.prepare(
        `SELECT pay.id,pay.received_or_paid_at occurred_at,pay.reference,c.name customer_name,'Payment' type,p.code project_code,'Payment received' description,'0' gross_minor,'0' tax_minor,'0' retention_minor,pay.amount_minor net_minor,pay.currency,pay.status FROM payments pay JOIN customers c ON c.id=pay.customer_id LEFT JOIN projects p ON p.id=pay.project_id ORDER BY pay.received_or_paid_at DESC`,
      ).all(),
    ]);
  return {
    portfolio,
    contacts: contacts.results,
    statements: statements.results,
    communications: communications.results,
    salesHistory: [...invoices.results, ...payments.results].sort(
      (a, b) =>
        Number((b as { occurred_at: number }).occurred_at) -
        Number((a as { occurred_at: number }).occurred_at),
    ),
  };
}

export async function getCustomerWorkspace(customerId: string) {
  const customer = await env.DB.prepare(
    `SELECT c.*,u.display_name account_manager_name FROM customers c LEFT JOIN users u ON u.id=c.account_manager_id WHERE c.id=? AND c.company_id=?`,
  )
    .bind(customerId, 'company-star-africa')
    .first<Record<string, unknown>>();
  if (!customer) return null;
  const [
    contacts,
    projects,
    invoices,
    payments,
    retention,
    communications,
    notes,
    statements,
    documents,
    activities,
    bids,
  ] = await Promise.all([
    env.DB.prepare(
      'SELECT * FROM customer_contacts WHERE customer_id=? ORDER BY primary_contact DESC,billing_contact DESC,name',
    )
      .bind(customerId)
      .all(),
    env.DB.prepare(
      'SELECT p.*,u.display_name manager_name FROM projects p LEFT JOIN users u ON u.id=p.project_manager_id WHERE p.customer_id=? ORDER BY p.created_at DESC',
    )
      .bind(customerId)
      .all(),
    env.DB.prepare(
      'SELECT i.*,p.code project_code FROM invoices i LEFT JOIN projects p ON p.id=i.project_id WHERE i.customer_id=? ORDER BY i.issue_date DESC',
    )
      .bind(customerId)
      .all(),
    env.DB.prepare(
      `SELECT p.*,COALESCE((SELECT SUM(CAST(pa.amount_minor AS INTEGER)) FROM payment_allocations pa WHERE pa.payment_id=p.id),0) allocated_minor FROM payments p WHERE p.customer_id=? ORDER BY p.received_or_paid_at DESC`,
    )
      .bind(customerId)
      .all(),
    env.DB.prepare(
      `SELECT r.*,p.code project_code,i.number invoice_number FROM retentions r JOIN projects p ON p.id=r.project_id LEFT JOIN invoices i ON i.id=r.invoice_id WHERE p.customer_id=? ORDER BY r.expected_release_at`,
    )
      .bind(customerId)
      .all(),
    env.DB.prepare(
      `SELECT cc.*,ct.name contact_name,u.display_name recorded_by_name,p.code project_code FROM customer_communications cc LEFT JOIN customer_contacts ct ON ct.id=cc.contact_id LEFT JOIN users u ON u.id=cc.recorded_by LEFT JOIN projects p ON p.id=cc.project_id WHERE cc.customer_id=? ORDER BY cc.occurred_at DESC`,
    )
      .bind(customerId)
      .all(),
    env.DB.prepare(
      `SELECT n.*,u.display_name author_name FROM customer_notes n JOIN users u ON u.id=n.author_id WHERE n.customer_id=? ORDER BY n.pinned DESC,n.created_at DESC`,
    )
      .bind(customerId)
      .all(),
    env.DB.prepare(
      `SELECT s.*,u.display_name generated_by_name FROM customer_statements s JOIN users u ON u.id=s.generated_by WHERE s.customer_id=? ORDER BY s.generated_at DESC`,
    )
      .bind(customerId)
      .all(),
    env.DB.prepare(
      `SELECT d.id,d.internal_number,d.title,d.category,d.reference_number,d.document_date,d.ocr_status,d.created_at,u.display_name uploaded_by_name FROM document_links l JOIN documents d ON d.id=l.document_id JOIN users u ON u.id=d.uploaded_by WHERE l.entity_type='Customer' AND l.entity_id=? AND d.archived_at IS NULL ORDER BY d.created_at DESC`,
    )
      .bind(customerId)
      .all(),
    env.DB.prepare(
      `SELECT a.*,u.display_name actor_name FROM customer_activities a LEFT JOIN users u ON u.id=a.actor_id WHERE a.customer_id=? ORDER BY a.occurred_at DESC`,
    )
      .bind(customerId)
      .all(),
    env.DB.prepare(
      `SELECT b.*,u.display_name assigned_name FROM bids b LEFT JOIN users u ON u.id=b.assigned_to WHERE lower(b.organization)=lower(?) ORDER BY b.created_at DESC`,
    )
      .bind(String(customer.name))
      .all(),
  ]);
  return {
    customer,
    contacts: contacts.results,
    projects: projects.results,
    invoices: invoices.results,
    payments: payments.results,
    retention: retention.results,
    communications: communications.results,
    notes: notes.results,
    statements: statements.results,
    documents: documents.results,
    activities: activities.results,
    bids: bids.results,
  };
}

export async function generateStatementSnapshot(input: {
  customerId: string;
  from: number;
  to: number;
  currency: string;
  includePaid: boolean;
}) {
  const invoiceRows = await env.DB.prepare(
    `SELECT id,number,issue_date,total_minor,status FROM invoices WHERE customer_id=? AND currency=? AND issue_date<=? ${input.includePaid ? '' : "AND status!='paid'"}`,
  )
    .bind(input.customerId, input.currency, input.to)
    .all<{
      id: string;
      number: string;
      issue_date: number;
      total_minor: string;
      status: string;
    }>();
  const paymentRows = await env.DB.prepare(
    `SELECT id,reference,received_or_paid_at,amount_minor,status FROM payments WHERE customer_id=? AND currency=? AND received_or_paid_at<=? AND status!='expected'`,
  )
    .bind(input.customerId, input.currency, input.to)
    .all<{
      id: string;
      reference: string;
      received_or_paid_at: number;
      amount_minor: string;
      status: string;
    }>();
  const all: StatementEvent[] = [
    ...invoiceRows.results.map((row) => ({
      occurredAt: row.issue_date,
      reference: row.number,
      description: 'Customer invoice',
      debitMinor: row.total_minor,
      creditMinor: '0',
      entityType: 'Invoice',
      entityId: row.id,
    })),
    ...paymentRows.results.map((row) => ({
      occurredAt: row.received_or_paid_at,
      reference: row.reference,
      description: 'Payment received',
      debitMinor: '0',
      creditMinor: row.amount_minor,
      entityType: 'Payment',
      entityId: row.id,
    })),
  ];
  const opening = all
    .filter((event) => event.occurredAt < input.from)
    .reduce(
      (sum, event) =>
        sum + BigInt(event.debitMinor) - BigInt(event.creditMinor),
      0n,
    )
    .toString();
  return {
    opening,
    ...buildStatement(
      opening,
      all.filter(
        (event) =>
          event.occurredAt >= input.from && event.occurredAt <= input.to,
      ),
    ),
  };
}

export async function getStatement(statementId: string) {
  const statement = await env.DB.prepare(
    `SELECT s.*,c.name customer_name,c.code customer_code,c.tin,c.address,u.display_name generated_by_name FROM customer_statements s JOIN customers c ON c.id=s.customer_id JOIN users u ON u.id=s.generated_by WHERE s.id=?`,
  )
    .bind(statementId)
    .first();
  if (!statement) return null;
  const lines = await env.DB.prepare(
    'SELECT * FROM customer_statement_lines WHERE statement_id=? ORDER BY sequence',
  )
    .bind(statementId)
    .all();
  const invoices = await env.DB.prepare(
    `SELECT due_date,total_minor,paid_minor FROM invoices WHERE customer_id=? AND currency=? AND status NOT IN ('draft','void','paid')`,
  )
    .bind(String(statement.customer_id), String(statement.currency))
    .all<{ due_date: number; total_minor: string; paid_minor: string }>();
  const generated = Number(statement.generated_at);
  const aging = { current: 0n, days30: 0n, days60: 0n, days90: 0n, over90: 0n };
  for (const row of invoices.results) {
    const balance = BigInt(row.total_minor) - BigInt(row.paid_minor);
    const days = Math.floor((generated - row.due_date) / 86400000);
    if (days <= 0) aging.current += balance;
    else if (days <= 30) aging.days30 += balance;
    else if (days <= 60) aging.days60 += balance;
    else if (days <= 90) aging.days90 += balance;
    else aging.over90 += balance;
  }
  return {
    statement,
    lines: lines.results,
    aging: Object.fromEntries(
      Object.entries(aging).map(([key, value]) => [key, value.toString()]),
    ),
  };
}
