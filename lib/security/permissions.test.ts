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
    expect(hasPermission(defaultRolePermissions['BIDS & TENDERS OFFICER'], 'bids.create')).toBe(true);
    expect(hasPermission(defaultRolePermissions['AUDITOR / VIEWER'], 'bids.create')).toBe(false);
    expect(hasPermission(defaultRolePermissions.DIRECTOR, 'bids.approve')).toBe(true);
    expect(hasPermission(defaultRolePermissions['FINANCE ADMIN'], 'bids.expenses.approve')).toBe(true);
    expect(hasPermission(defaultRolePermissions.ACCOUNTANT, 'bids.submit')).toBe(false);
  });
});
