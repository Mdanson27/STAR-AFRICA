export const defaultRolePermissions: Record<string, readonly string[]> = {
  'SUPER ADMIN': ['*'],
  DIRECTOR: ['dashboard.view', 'report.executive.view', 'approval.decide', 'finance.summary.view', 'project.view', 'bid.view'],
  'FINANCE ADMIN': ['invoice.*', 'payment.*', 'journal.*', 'bank.*', 'report.financial.view', 'tax.manage'],
  ACCOUNTANT: ['invoice.view', 'payment.record', 'journal.create', 'journal.post', 'bank.reconcile', 'report.financial.view'],
  'PROCUREMENT OFFICER': ['procurement.*', 'supplier.*', 'inventory.view'],
  'PROJECT MANAGER': ['project.*', 'procurement.request', 'inventory.allocate', 'budget.view'],
  'SITE MANAGER': ['project.view', 'project.activity.create', 'inventory.issue', 'goods_receipt.create'],
  'BIDS/TENDER OFFICER': ['bid.*', 'document.upload'],
  'HR/PAYROLL': ['employee.*', 'payroll.prepare', 'payroll.view'],
  'AUDITOR/VIEWER': ['*.view'],
};

export function hasPermission(grants: readonly string[], required: string) {
  return grants.some((grant) => grant === '*' || grant === required || (grant.endsWith('.*') && required.startsWith(grant.slice(0, -1))) || (grant === '*.view' && required.endsWith('.view')));
}

export function requirePermission(grants: readonly string[], required: string) {
  if (!hasPermission(grants, required)) throw new Error('Forbidden');
}
