export const defaultRolePermissions: Record<string, readonly string[]> = {
  SUPER_ADMIN: ['*'],
  DIRECTOR: [
    'dashboard.executive.view',
    'bids.view','bids.create','bids.edit','bids.assign','bids.submit',
    'projects.view','projects.create','projects.edit','projects.assign',
    'procurement.view','procurement.create',
    'suppliers.view','suppliers.create',
    'inventory.view','inventory.create',
    'customers.view',
    'invoices.view','invoices.create',
    'payments.view','payments.create',
    'finance.view','banking.view',
    'payroll.view','payroll.create','employees.view','employees.create',
    'documents.view','documents.upload','documents.edit','documents.delete','documents.ocr','documents.verify','documents.download',
    'reports.view','calendar.view',
    'bids.financials.view','bids.expenses.view','bids.approve','bids.award','bids.analytics.view','bids.export','bids.audit.view',
    'projects.portfolio.view','projects.financials.view','projects.costs.view','projects.margin.view','projects.contract_value.view','projects.approve','projects.archive','projects.analytics.view','projects.export','projects.progress.edit','projects.team.manage','projects.documents.view','projects.documents.upload',
    'project_tasks.create','project_tasks.edit','project_milestones.create','project_milestones.edit','project_milestones.complete','project_milestones.approve','project_updates.create','project_materials.view','project_materials.create','project_expenses.view','project_expenses.create','project_expenses.approve','project_budget.view','project_budget.edit','project_variations.create','project_variations.approve','project_risks.manage','project_issues.manage','project_labour.create','project_equipment.create','project_certificates.create','project_invoices.create','project_payments.create','project_retention.manage','projects.audit.view'
  ],
  FINANCE_ADMIN: ['finance.view','invoices.view','invoices.create','payments.view','payments.create','banking.view','reports.view','documents.view','documents.upload','documents.edit','documents.ocr','documents.verify','documents.download','projects.view','projects.financials.view','projects.costs.view','project_expenses.view','project_expenses.approve','project_expenses.post','bids.view','bids.financials.view','bids.expenses.view','bids.expenses.approve','bids.analytics.view','bids.export'],
  ACCOUNTANT: ['finance.view','invoices.view','invoices.create','payments.view','payments.create','banking.view','reports.view','documents.view','documents.upload','documents.edit','documents.ocr','documents.verify','documents.download','projects.view','projects.financials.view','projects.costs.view','project_expenses.view','project_expenses.approve','project_expenses.post','bids.view','bids.expenses.view','bids.financials.view','bids.export'],
  PROCUREMENT_OFFICER: ['procurement.view','procurement.create','suppliers.view','suppliers.create','inventory.view','documents.view','documents.upload','documents.edit','documents.ocr','documents.verify','documents.download','projects.view','project_materials.view','project_materials.fulfill','bids.view','bids.documents.view'],
  PROJECT_MANAGER: ['projects.view','projects.create','projects.edit','projects.assign','projects.progress.edit','projects.team.manage','projects.documents.view','projects.documents.upload','project_tasks.create','project_tasks.edit','project_milestones.create','project_milestones.edit','project_milestones.complete','project_milestones.approve','project_updates.create','project_materials.view','project_materials.create','project_expenses.view','project_expenses.create','project_risks.manage','project_issues.manage','project_variations.create','project_budget.view','project_budget.edit','project_labour.create','project_equipment.create','project_certificates.create','documents.view','documents.upload','documents.edit','documents.ocr','documents.verify','documents.download','bids.view','bids.documents.view'],
  SITE_MANAGER: ['projects.view','projects.progress.edit','projects.documents.view','projects.documents.upload','project_tasks.create','project_tasks.edit','project_milestones.edit','project_milestones.complete','project_updates.create','project_materials.view','project_materials.create','project_expenses.view','project_expenses.create','project_risks.manage','project_issues.manage','project_incidents.create','project_labour.create','project_equipment.create','documents.view','documents.upload','documents.edit','documents.ocr','documents.verify','documents.download'],
  BIDS_OFFICER: ['bids.view','bids.create','bids.edit','bids.qualify','bids.assign','bids.submit','bids.documents.view','bids.documents.upload','bids.documents.verify','bids.expenses.view','bids.expenses.create','bids.financials.view','bids.pricing.edit','bids.team.manage','bids.export','bids.analytics.view','documents.view','documents.upload','documents.edit','documents.ocr','documents.verify','documents.download'],
  HR_PAYROLL: ['payroll.view','payroll.create','employees.view','employees.create','documents.view','documents.upload','documents.download'],
  AUDITOR: ['reports.view','audit.view','documents.view','documents.download','bids.view','bids.documents.view','bids.expenses.view','bids.financials.view','bids.audit.view','bids.export','projects.view','projects.documents.view','projects.financials.view','projects.costs.view','projects.contract_value.view','project_expenses.view','project_budget.view'],
};

const customerRolePermissions: Partial<Record<string, readonly string[]>> = {
  DIRECTOR: ['customers.create','customers.edit','customers.archive','customers.contacts.view','customers.contacts.manage','customers.financials.view','customers.outstanding.view','customers.retention.view','customers.statements.generate','customers.statements.send','customers.communication.manage','customers.documents.manage'],
  FINANCE_ADMIN: ['customers.view','customers.create','customers.edit','customers.contacts.view','customers.contacts.manage','customers.financials.view','customers.outstanding.view','customers.retention.view','customers.statements.generate','customers.statements.send','customers.communication.manage','customers.documents.manage'],
  ACCOUNTANT: ['customers.view','customers.edit','customers.contacts.view','customers.financials.view','customers.outstanding.view','customers.retention.view','customers.statements.generate','customers.communication.manage','customers.documents.manage'],
  PROJECT_MANAGER: ['customers.view','customers.contacts.view','customers.contacts.manage','customers.communication.manage','customers.documents.manage'],
  SITE_MANAGER: ['customers.view','customers.contacts.view','customers.communication.manage','customers.documents.manage'],
  BIDS_OFFICER: ['customers.view','customers.contacts.view','customers.contacts.manage','customers.communication.manage','customers.documents.manage'],
  PROCUREMENT_OFFICER: ['customers.view','customers.contacts.view','customers.communication.manage','customers.documents.manage'],
  AUDITOR: ['customers.view','customers.contacts.view','customers.financials.view','customers.outstanding.view','customers.retention.view'],
};
for (const [role, grants] of Object.entries(customerRolePermissions)) defaultRolePermissions[role] = [...(defaultRolePermissions[role] ?? []), ...(grants ?? [])];

export function hasPermission(grants: readonly string[], required: string) {
  return grants.some((grant) => grant === '*' || grant === required || (grant.endsWith('.*') && required.startsWith(grant.slice(0, -1))) || (grant === '*.view' && required.endsWith('.view')));
}

export function requirePermission(grants: readonly string[], required: string) {
  if (!hasPermission(grants, required)) throw new Error('You do not have permission to perform this action.');
}

export const firstPermittedPath = (permissions: readonly string[]) => {
  const candidates: Array<[string,string]> = [
    ['dashboard.executive.view','/dashboard'], ['bids.view','/bids'], ['projects.view','/projects'],
    ['procurement.view','/procurement'], ['finance.view','/finance'], ['invoices.view','/invoices'],
    ['payroll.view','/payroll'], ['reports.view','/reports'], ['documents.view','/documents'],
  ];
  return candidates.find(([permission]) => hasPermission(permissions,permission))?.[1] ?? '/access-restricted';
};
