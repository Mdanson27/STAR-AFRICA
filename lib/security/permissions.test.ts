import { describe, expect, it } from 'vitest';
import { defaultRolePermissions, hasPermission, requirePermission } from './permissions';

describe('server-side permission rules', () => {
  it('supports exact, module-wide, read-only and super-admin grants', () => {
    expect(hasPermission(['invoice.create'], 'invoice.create')).toBe(true);
    expect(hasPermission(['invoice.*'], 'invoice.approve')).toBe(true);
    expect(hasPermission(['*.view'], 'project.view')).toBe(true);
    expect(hasPermission(['*'], 'admin.users.manage')).toBe(true);
  });
  it('rejects missing grants with a clear message', () => expect(() => requirePermission(['invoice.view'], 'invoice.approve')).toThrow('You do not have permission to perform this action.'));
  it('demonstrates materially different bid rights by role', () => {
    expect(hasPermission(defaultRolePermissions.BIDS_OFFICER, 'bids.create')).toBe(true);
    expect(hasPermission(defaultRolePermissions.AUDITOR, 'bids.create')).toBe(false);
    expect(hasPermission(defaultRolePermissions.DIRECTOR, 'bids.approve')).toBe(true);
    expect(hasPermission(defaultRolePermissions.FINANCE_ADMIN, 'bids.expenses.approve')).toBe(true);
    expect(hasPermission(defaultRolePermissions.ACCOUNTANT, 'bids.submit')).toBe(false);
  });
  it('gives directors operational create rights used by Quick Create', () => {
    const grants = defaultRolePermissions.DIRECTOR;
    for (const permission of [
      'bids.create',
      'projects.create',
      'procurement.create',
      'customers.create',
      'invoices.create',
      'payments.create',
      'documents.upload',
    ]) expect(hasPermission(grants, permission)).toBe(true);
  });
  it('gives directors full project operations and every operational module view', () => {
    const grants = defaultRolePermissions.DIRECTOR;
    for (const permission of [
      'projects.view', 'procurement.view', 'inventory.view', 'suppliers.view',
      'project_tasks.create', 'project_milestones.approve', 'project_budget.edit',
      'project_expenses.approve', 'project_variations.approve', 'project_risks.manage',
      'project_certificates.create', 'project_invoices.create', 'project_payments.create',
    ]) expect(hasPermission(grants, permission)).toBe(true);
  });
});
