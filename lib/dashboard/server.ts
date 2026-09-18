import 'server-only';

import { neon } from '@neondatabase/serverless';

const COMPANY_ID = 'company-star-africa';

function sqlClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not configured.');
  return neon(url);
}

export type ExecutiveDashboardData = {
  cashMinor: string;
  receivablesMinor: string;
  payablesMinor: string;
  activeProjects: number;
  openBids: number;
  pendingApprovals: number;
  overdueInvoices: number;
  openProjectIssues: number;
  bidsClosingSoon: number;
  projects: Array<{
    id: string;
    code: string;
    name: string;
    completion: number;
    health: string;
    stage: string;
    client: string;
  }>;
};

export async function loadExecutiveDashboard(): Promise<ExecutiveDashboardData> {
  const sql = sqlClient();
  const now = Date.now();
  const sevenDays = now + 7 * 24 * 60 * 60 * 1000;

  const [summary] = await sql.query(
    `SELECT
      COALESCE((
        SELECT SUM(CAST(legacy_opening_balance_minor AS numeric))
        FROM accounts
        WHERE company_id=$1 AND active=1 AND type='asset'
          AND lower(name) IN ('centenary bank','equity bank','i&m bank','petty cash')
      ),0)::text AS cash_minor,

      (
        COALESCE((
          SELECT SUM(CAST(legacy_opening_balance_minor AS numeric))
          FROM accounts
          WHERE company_id=$1 AND active=1 AND lower(name)='accounts receivable'
        ),0)
        +
        COALESCE((
          SELECT SUM(CAST(total_minor AS numeric)-CAST(paid_minor AS numeric))
          FROM invoices
          WHERE company_id=$1 AND status NOT IN ('draft','void','paid')
        ),0)
      )::text AS receivables_minor,

      (
        COALESCE((
          SELECT SUM(CAST(legacy_opening_balance_minor AS numeric))
          FROM accounts
          WHERE company_id=$1 AND active=1 AND lower(name)='accounts payable'
        ),0)
        +
        COALESCE((
          SELECT SUM(CAST(total_minor AS numeric)-CAST(paid_minor AS numeric))
          FROM supplier_bills
          WHERE company_id=$1 AND status NOT IN ('draft','void','paid')
        ),0)
      )::text AS payables_minor,

      (SELECT COUNT(*) FROM projects WHERE company_id=$1 AND archived_at IS NULL AND status NOT IN ('completed','closed'))::int AS active_projects,
      (SELECT COUNT(*) FROM bids WHERE company_id=$1 AND status NOT IN ('won','lost','archived'))::int AS open_bids,
      (SELECT COUNT(*) FROM approval_requests WHERE company_id=$1 AND status='pending')::int AS pending_approvals,
      (SELECT COUNT(*) FROM invoices WHERE company_id=$1 AND status NOT IN ('paid','void','draft') AND due_date<$2 AND CAST(total_minor AS numeric)>CAST(paid_minor AS numeric))::int AS overdue_invoices,
      (SELECT COUNT(*) FROM project_issues pi JOIN projects p ON p.id=pi.project_id WHERE p.company_id=$1 AND pi.status NOT IN ('closed','resolved'))::int AS open_project_issues,
      (SELECT COUNT(*) FROM bids WHERE company_id=$1 AND status NOT IN ('won','lost','archived') AND closes_at BETWEEN $2 AND $3)::int AS bids_closing_soon`,
    [COMPANY_ID, now, sevenDays],
  );

  const projects = await sql.query(
    `SELECT
       p.id,p.code,p.name,p.completion_basis_points,p.health,
       COALESCE(ps.name,'Unstaged') AS stage,
       c.name AS client
     FROM projects p
     JOIN customers c ON c.id=p.customer_id
     LEFT JOIN project_stages ps ON ps.id=p.stage_id
     WHERE p.company_id=$1
       AND p.archived_at IS NULL
       AND p.status NOT IN ('completed','closed')
     ORDER BY
       CASE WHEN p.health='at_risk' THEN 0 WHEN p.health='delayed' THEN 1 ELSE 2 END,
       p.updated_at DESC
     LIMIT 6`,
    [COMPANY_ID],
  );

  return {
    cashMinor: String(summary?.cash_minor ?? '0'),
    receivablesMinor: String(summary?.receivables_minor ?? '0'),
    payablesMinor: String(summary?.payables_minor ?? '0'),
    activeProjects: Number(summary?.active_projects ?? 0),
    openBids: Number(summary?.open_bids ?? 0),
    pendingApprovals: Number(summary?.pending_approvals ?? 0),
    overdueInvoices: Number(summary?.overdue_invoices ?? 0),
    openProjectIssues: Number(summary?.open_project_issues ?? 0),
    bidsClosingSoon: Number(summary?.bids_closing_soon ?? 0),
    projects: projects.map((row) => ({
      id: String(row.id),
      code: String(row.code),
      name: String(row.name),
      completion: Number(row.completion_basis_points ?? 0) / 100,
      health: String(row.health ?? 'on_track'),
      stage: String(row.stage ?? ''),
      client: String(row.client ?? ''),
    })),
  };
}
