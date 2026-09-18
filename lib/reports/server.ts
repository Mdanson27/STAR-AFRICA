import 'server-only';

import { neon } from '@neondatabase/serverless';

const COMPANY_ID = 'company-star-africa';

function sqlClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not configured.');
  return neon(url);
}

export type ReportDefinition = {
  slug: string;
  title: string;
  area: string;
  description: string;
  columns: string[];
};

export const reportDefinitions: ReportDefinition[] = [
  {
    slug: 'chart-of-accounts',
    title: 'Chart of accounts & QuickBooks opening balances',
    area: 'Finance',
    description:
      'Full chart of accounts with preserved QuickBooks source references and legacy opening balances.',
    columns: ['Code', 'Account', 'Type', 'Opening balance', 'Source', 'Source ref'],
  },
  {
    slug: 'trial-balance',
    title: 'Trial balance',
    area: 'Finance',
    description:
      'Account balances combining preserved legacy opening balances with posted Star Africa OS journals.',
    columns: ['Code', 'Account', 'Type', 'Debit', 'Credit'],
  },
  {
    slug: 'receivables-aging',
    title: 'Accounts receivable aging',
    area: 'Sales',
    description:
      'Outstanding customer invoices grouped by current, 1–30, 31–60, 61–90 and 90+ day buckets.',
    columns: ['Customer', 'Current', '1–30', '31–60', '61–90', '90+', 'Total'],
  },
  {
    slug: 'payables-aging',
    title: 'Accounts payable aging',
    area: 'Purchases',
    description:
      'Outstanding supplier bills grouped by current, 1–30, 31–60, 61–90 and 90+ day buckets.',
    columns: ['Supplier', 'Current', '1–30', '31–60', '61–90', '90+', 'Total'],
  },
  {
    slug: 'project-financials',
    title: 'Project financial position',
    area: 'Projects',
    description:
      'Contract value, budget, committed value, recorded costs and delivery completion by project.',
    columns: ['Project', 'Client', 'Contract value', 'Budget', 'Committed', 'Recorded costs', 'Completion'],
  },
  {
    slug: 'bid-spend',
    title: 'Bid preparation spend',
    area: 'Bids',
    description:
      'Bid opportunities with recorded preparation spend and approval status.',
    columns: ['Reference', 'Opportunity', 'Organisation', 'Expenses', 'Spend', 'Currency'],
  },
  {
    slug: 'vat-summary',
    title: 'VAT summary',
    area: 'Tax',
    description:
      'VAT collected on customer invoices and VAT recorded on supplier bills for the selected production data.',
    columns: ['Metric', 'Amount'],
  },
  {
    slug: 'audit-log',
    title: 'Audit activity report',
    area: 'Administration',
    description:
      'Recent business and security-sensitive actions captured by the immutable audit trail.',
    columns: ['Time', 'User', 'Action', 'Entity', 'Record', 'Request ID'],
  },
  {
    slug: 'security-events',
    title: 'Security monitoring report',
    area: 'Security',
    description:
      'Authentication events, rate-limit findings, endpoint scans and security warnings.',
    columns: ['Time', 'Severity', 'Event', 'Route', 'Method', 'Request ID'],
  },
];

const money = (value: unknown) => String(value ?? '0');

export async function reportOverview() {
  const sql = sqlClient();
  const rows = await sql.query(
    `SELECT
      (SELECT COUNT(*) FROM accounts WHERE company_id=$1 AND active=1) AS accounts,
      (SELECT COUNT(*) FROM customers WHERE company_id=$1 AND archived_at IS NULL) AS customers,
      (SELECT COUNT(*) FROM suppliers WHERE company_id=$1 AND status='active') AS suppliers,
      (SELECT COUNT(*) FROM projects WHERE company_id=$1 AND archived_at IS NULL) AS projects,
      (SELECT COUNT(*) FROM invoices WHERE company_id=$1 AND status NOT IN ('draft','void')) AS invoices,
      (SELECT COUNT(*) FROM audit_logs WHERE company_id=$1) AS audit_events,
      (SELECT COUNT(*) FROM security_events WHERE company_id=$1 OR company_id IS NULL) AS security_events,
      (SELECT COUNT(*) FROM data_import_batches WHERE company_id=$1 AND status='completed') AS imports`,
    [COMPANY_ID],
  );
  const row = rows[0] ?? {};
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, Number(value ?? 0)]),
  ) as Record<string, number>;
}

export async function generateReportRows(slug: string) {
  const sql = sqlClient();
  const now = Date.now();

  if (slug === 'chart-of-accounts') {
    return sql.query(
      `SELECT
        code AS "Code",
        name AS "Account",
        type AS "Type",
        COALESCE(legacy_opening_balance_minor,'0') AS "Opening balance",
        COALESCE(source_system,'Star Africa OS') AS "Source",
        COALESCE(source_ref,'') AS "Source ref"
       FROM accounts
       WHERE company_id=$1 AND active=1
       ORDER BY code,name`,
      [COMPANY_ID],
    );
  }

  if (slug === 'trial-balance') {
    return sql.query(
      `SELECT
        a.code AS "Code",
        a.name AS "Account",
        a.type AS "Type",
        GREATEST(
          COALESCE(CAST(a.legacy_opening_balance_minor AS numeric),0) +
          COALESCE(SUM(CASE WHEN je.status='posted'
            THEN CAST(jl.debit_minor AS numeric)-CAST(jl.credit_minor AS numeric)
            ELSE 0 END),0),
          0
        )::text AS "Debit",
        ABS(LEAST(
          COALESCE(CAST(a.legacy_opening_balance_minor AS numeric),0) +
          COALESCE(SUM(CASE WHEN je.status='posted'
            THEN CAST(jl.debit_minor AS numeric)-CAST(jl.credit_minor AS numeric)
            ELSE 0 END),0),
          0
        ))::text AS "Credit"
       FROM accounts a
       LEFT JOIN journal_lines jl ON jl.account_id=a.id
       LEFT JOIN journal_entries je ON je.id=jl.journal_entry_id
       WHERE a.company_id=$1 AND a.active=1
       GROUP BY a.id,a.code,a.name,a.type,a.legacy_opening_balance_minor
       ORDER BY a.code,a.name`,
      [COMPANY_ID],
    );
  }

  if (slug === 'receivables-aging') {
    return sql.query(
      `SELECT
        c.name AS "Customer",
        SUM(CASE WHEN i.due_date >= $2 THEN CAST(i.total_minor AS numeric)-CAST(i.paid_minor AS numeric) ELSE 0 END)::text AS "Current",
        SUM(CASE WHEN i.due_date < $2 AND i.due_date >= $2-30*86400000 THEN CAST(i.total_minor AS numeric)-CAST(i.paid_minor AS numeric) ELSE 0 END)::text AS "1–30",
        SUM(CASE WHEN i.due_date < $2-30*86400000 AND i.due_date >= $2-60*86400000 THEN CAST(i.total_minor AS numeric)-CAST(i.paid_minor AS numeric) ELSE 0 END)::text AS "31–60",
        SUM(CASE WHEN i.due_date < $2-60*86400000 AND i.due_date >= $2-90*86400000 THEN CAST(i.total_minor AS numeric)-CAST(i.paid_minor AS numeric) ELSE 0 END)::text AS "61–90",
        SUM(CASE WHEN i.due_date < $2-90*86400000 THEN CAST(i.total_minor AS numeric)-CAST(i.paid_minor AS numeric) ELSE 0 END)::text AS "90+",
        SUM(CAST(i.total_minor AS numeric)-CAST(i.paid_minor AS numeric))::text AS "Total"
       FROM invoices i
       JOIN customers c ON c.id=i.customer_id
       WHERE i.company_id=$1
         AND i.status NOT IN ('draft','void','paid')
         AND CAST(i.total_minor AS numeric)>CAST(i.paid_minor AS numeric)
       GROUP BY c.id,c.name
       ORDER BY SUM(CAST(i.total_minor AS numeric)-CAST(i.paid_minor AS numeric)) DESC`,
      [COMPANY_ID, now],
    );
  }

  if (slug === 'payables-aging') {
    return sql.query(
      `SELECT
        s.name AS "Supplier",
        SUM(CASE WHEN b.due_date >= $2 THEN CAST(b.total_minor AS numeric)-CAST(b.paid_minor AS numeric) ELSE 0 END)::text AS "Current",
        SUM(CASE WHEN b.due_date < $2 AND b.due_date >= $2-30*86400000 THEN CAST(b.total_minor AS numeric)-CAST(b.paid_minor AS numeric) ELSE 0 END)::text AS "1–30",
        SUM(CASE WHEN b.due_date < $2-30*86400000 AND b.due_date >= $2-60*86400000 THEN CAST(b.total_minor AS numeric)-CAST(b.paid_minor AS numeric) ELSE 0 END)::text AS "31–60",
        SUM(CASE WHEN b.due_date < $2-60*86400000 AND b.due_date >= $2-90*86400000 THEN CAST(b.total_minor AS numeric)-CAST(b.paid_minor AS numeric) ELSE 0 END)::text AS "61–90",
        SUM(CASE WHEN b.due_date < $2-90*86400000 THEN CAST(b.total_minor AS numeric)-CAST(b.paid_minor AS numeric) ELSE 0 END)::text AS "90+",
        SUM(CAST(b.total_minor AS numeric)-CAST(b.paid_minor AS numeric))::text AS "Total"
       FROM supplier_bills b
       JOIN suppliers s ON s.id=b.supplier_id
       WHERE b.company_id=$1
         AND b.status NOT IN ('draft','void','paid')
         AND CAST(b.total_minor AS numeric)>CAST(b.paid_minor AS numeric)
       GROUP BY s.id,s.name
       ORDER BY SUM(CAST(b.total_minor AS numeric)-CAST(b.paid_minor AS numeric)) DESC`,
      [COMPANY_ID, now],
    );
  }

  if (slug === 'project-financials') {
    return sql.query(
      `SELECT
        p.code || ' · ' || p.name AS "Project",
        c.name AS "Client",
        p.contract_value_minor AS "Contract value",
        p.budget_minor AS "Budget",
        p.committed_minor AS "Committed",
        COALESCE(SUM(CAST(pe.total_minor AS numeric)),0)::text AS "Recorded costs",
        ROUND(CAST(p.completion_basis_points AS numeric)/100,2)::text || '%' AS "Completion"
       FROM projects p
       JOIN customers c ON c.id=p.customer_id
       LEFT JOIN project_expenses pe ON pe.project_id=p.id
       WHERE p.company_id=$1 AND p.archived_at IS NULL
       GROUP BY p.id,p.code,p.name,c.name,p.contract_value_minor,p.budget_minor,p.committed_minor,p.completion_basis_points
       ORDER BY p.created_at DESC`,
      [COMPANY_ID],
    );
  }

  if (slug === 'bid-spend') {
    return sql.query(
      `SELECT
        b.reference AS "Reference",
        b.title AS "Opportunity",
        b.organization AS "Organisation",
        COUNT(be.id)::text AS "Expenses",
        COALESCE(SUM(CAST(be.amount_minor AS numeric)+CAST(be.tax_minor AS numeric)),0)::text AS "Spend",
        b.currency AS "Currency"
       FROM bids b
       LEFT JOIN bid_expenses be ON be.bid_id=b.id
       WHERE b.company_id=$1
       GROUP BY b.id,b.reference,b.title,b.organization,b.currency
       ORDER BY COALESCE(SUM(CAST(be.amount_minor AS numeric)+CAST(be.tax_minor AS numeric)),0) DESC`,
      [COMPANY_ID],
    );
  }

  if (slug === 'vat-summary') {
    return sql.query(
      `SELECT 'VAT on customer invoices' AS "Metric",
              COALESCE(SUM(CAST(tax_minor AS numeric)),0)::text AS "Amount"
       FROM invoices WHERE company_id=$1 AND status NOT IN ('draft','void')
       UNION ALL
       SELECT 'VAT on supplier bills',
              COALESCE(SUM(CAST(tax_minor AS numeric)),0)::text
       FROM supplier_bills WHERE company_id=$1 AND status NOT IN ('draft','void')
       UNION ALL
       SELECT 'Net VAT position',
              (
                COALESCE((SELECT SUM(CAST(tax_minor AS numeric)) FROM invoices WHERE company_id=$1 AND status NOT IN ('draft','void')),0)
                -
                COALESCE((SELECT SUM(CAST(tax_minor AS numeric)) FROM supplier_bills WHERE company_id=$1 AND status NOT IN ('draft','void')),0)
              )::text`,
      [COMPANY_ID],
    );
  }

  if (slug === 'audit-log') {
    return sql.query(
      `SELECT
        to_char(to_timestamp(occurred_at/1000.0) AT TIME ZONE 'Africa/Kampala','YYYY-MM-DD HH24:MI:SS') AS "Time",
        COALESCE(user_id,'System') AS "User",
        action AS "Action",
        entity_type AS "Entity",
        entity_id AS "Record",
        COALESCE(request_id,'') AS "Request ID"
       FROM audit_logs
       WHERE company_id=$1
       ORDER BY occurred_at DESC
       LIMIT 500`,
      [COMPANY_ID],
    );
  }

  if (slug === 'security-events') {
    return sql.query(
      `SELECT
        to_char(to_timestamp(occurred_at/1000.0) AT TIME ZONE 'Africa/Kampala','YYYY-MM-DD HH24:MI:SS') AS "Time",
        severity AS "Severity",
        event_type AS "Event",
        COALESCE(route,'') AS "Route",
        COALESCE(method,'') AS "Method",
        COALESCE(request_id,'') AS "Request ID"
       FROM security_events
       WHERE company_id=$1 OR company_id IS NULL
       ORDER BY occurred_at DESC
       LIMIT 500`,
      [COMPANY_ID],
    );
  }

  throw new Error('Unknown report.');
}
