import { describe, expect, it } from 'vitest';
import { buildStatement, customerFinancialHealth, moneyInputToMinor } from './domain';

describe('customer statements', () => {
  it('sorts transactions deterministically and uses exact minor-unit arithmetic', () => {
    const result = buildStatement('1000', [
      { occurredAt: 20, reference: 'PAY-1', description: 'Payment', debitMinor: '0', creditMinor: '500', entityType: 'payment', entityId: 'p1' },
      { occurredAt: 10, reference: 'INV-1', description: 'Invoice', debitMinor: '2500', creditMinor: '0', entityType: 'invoice', entityId: 'i1' },
    ]);

    expect(result.lines.map((line) => line.reference)).toEqual(['INV-1', 'PAY-1']);
    expect(result.lines.map((line) => line.balanceMinor)).toEqual(['3500', '3000']);
    expect(result.closingBalanceMinor).toBe('3000');
  });
});

describe('customer financial health', () => {
  it('prioritizes exposure, overdue debt, payment due, and retention', () => {
    expect(customerFinancialHealth({ outstandingMinor: '101', overdueMinor: '0', retentionMinor: '0', creditLimitMinor: '100' })).toBe('High exposure');
    expect(customerFinancialHealth({ outstandingMinor: '100', overdueMinor: '1', retentionMinor: '0', creditLimitMinor: '1000' })).toBe('Overdue');
    expect(customerFinancialHealth({ outstandingMinor: '100', overdueMinor: '0', retentionMinor: '0', creditLimitMinor: '1000' })).toBe('Payment due');
    expect(customerFinancialHealth({ outstandingMinor: '0', overdueMinor: '0', retentionMinor: '1', creditLimitMinor: '0' })).toBe('Retention outstanding');
    expect(customerFinancialHealth({ outstandingMinor: '0', overdueMinor: '0', retentionMinor: '0', creditLimitMinor: '0' })).toBe('Healthy');
  });
});

describe('customer money inputs', () => {
  it('normalizes entered major units to integer minor units', () => {
    expect(moneyInputToMinor('UGX 12,345.67')).toBe('1234567');
    expect(moneyInputToMinor('invalid')).toBe('0');
  });
});
