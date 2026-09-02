export const defaultRolePermissions: Record<string, readonly string[]> = {
  'SUPER ADMIN': ['*'],
  DIRECTOR: ['dashboard.view', 'report.executive.view', 'approval.decide', 'finance.summary.view', 'project.view', 'bids.view', 'bids.financials.view', 'bids.expenses.view', 'bids.approve', 'bids.award', 'bids.analytics.view', 'bids.export', 'bids.audit.view'],
  'FINANCE ADMIN': ['dashboard.view', 'invoice.*', 'payment.*', 'journal.*', 'bank.*', 'report.financial.view', 'tax.manage', 'bids.view', 'bids.financials.view', 'bids.expenses.view', 'bids.expenses.approve', 'bids.security.manage', 'bids.analytics.view', 'bids.export'],
  ACCOUNTANT: ['dashboard.view', 'invoice.view', 'payment.record', 'journal.create', 'journal.post', 'bank.reconcile', 'report.financial.view', 'bids.view', 'bids.expenses.view', 'bids.financials.view', 'bids.export'],
  'PROCUREMENT OFFICER': ['dashboard.view', 'procurement.*', 'supplier.*', 'inventory.view', 'bids.view', 'bids.documents.view'],
  'PROJECT MANAGER': ['dashboard.view', 'project.*', 'procurement.request', 'inventory.allocate', 'budget.view', 'bids.view', 'bids.documents.view'],
  'SITE MANAGER': ['project.view', 'project.activity.create', 'inventory.issue', 'goods_receipt.create'],
  'BIDS & TENDERS OFFICER': ['dashboard.view', 'bids.view', 'bids.create', 'bids.edit', 'bids.qualify', 'bids.assign', 'bids.submit', 'bids.documents.view', 'bids.documents.upload', 'bids.documents.verify', 'bids.expenses.view', 'bids.expenses.create', 'bids.financials.view', 'bids.pricing.edit', 'bids.team.manage', 'bids.export', 'bids.analytics.view'],
  'HR / PAYROLL': ['dashboard.view', 'employee.*', 'payroll.prepare', 'payroll.view'],
  'AUDITOR / VIEWER': ['dashboard.view', 'bids.view', 'bids.documents.view', 'bids.expenses.view', 'bids.financials.view', 'bids.audit.view', 'bids.export', '*.view'],
};

export function hasPermission(grants: readonly string[], required: string) {
  return grants.some((grant) => grant === '*' || grant === required || (grant.endsWith('.*') && required.startsWith(grant.slice(0, -1))) || (grant === '*.view' && required.endsWith('.view')));
}

export function requirePermission(grants: readonly string[], required: string) {
  if (!hasPermission(grants, required)) throw new Error('You do not have permission to perform this action.');
}
