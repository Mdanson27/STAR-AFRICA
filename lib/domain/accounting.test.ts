import { describe, expect, it } from 'vitest';
import { customerPaymentPosting, invoicePosting, reverseJournal, validateJournal } from './accounting';

describe('central accounting posting engine', () => {
  it('rejects unbalanced journals', () => {
    expect(() => validateJournal({ sourceType: 'manual', sourceId: 'one', memo: 'bad', currency: 'UGX', lines: [
      { accountCode: '1000', description: 'Cash', debitMinor: '100', creditMinor: '0' },
      { accountCode: '4000', description: 'Revenue', debitMinor: '0', creditMinor: '99' },
    ] })).toThrow(/out of balance/i);
  });
  it('posts invoice, VAT and retention as a balanced journal', () => {
    const journal = invoicePosting({ invoiceId: 'inv-1', number: 'INV-001', customerId: 'cus-1', projectId: 'prj-1', currency: 'UGX', subtotalMinor: '100000', taxMinor: '18000', retentionMinor: '5000' });
    expect(validateJournal(journal)).toEqual({ debitMinor: '118000', creditMinor: '118000', balanced: true });
  });
  it('creates balanced customer payment and reversal entries', () => {
    const payment = customerPaymentPosting({ paymentId: 'pay-1', reference: 'FT-88', customerId: 'cus-1', currency: 'UGX', amountMinor: '95000', bankAccountCode: '1010' });
    expect(validateJournal(payment).balanced).toBe(true);
    expect(validateJournal(reverseJournal(payment, 'rev-1')).balanced).toBe(true);
  });
});
