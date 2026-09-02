import { describe, expect, it } from 'vitest';
import { hasPermission, requirePermission } from './permissions';

describe('server-side permission rules', () => {
  it('supports exact, module-wide, read-only and super-admin grants', () => {
    expect(hasPermission(['invoice.create'], 'invoice.create')).toBe(true);
    expect(hasPermission(['invoice.*'], 'invoice.approve')).toBe(true);
    expect(hasPermission(['*.view'], 'project.view')).toBe(true);
    expect(hasPermission(['*'], 'admin.users.manage')).toBe(true);
  });
  it('rejects missing grants', () => expect(() => requirePermission(['invoice.view'], 'invoice.approve')).toThrow('Forbidden'));
});
