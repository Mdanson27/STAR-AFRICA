import { describe, expect, it } from 'vitest';
import { allocatePayment, calculateInvoice } from './invoicing';
import { calculateRetention, convertWinningBidToProject, resolveApprovalRoute } from './workflows';

describe('invoice and payment calculations', () => {
  it('calculates invoice totals without floating point arithmetic', () => {
    const result = calculateInvoice([{ quantityMinor: '250', unitPriceMinor: '10000', taxBasisPoints: 1800 }], '1000', 500);
    expect(result).toEqual({ currency: 'UGX', subtotalMinor: '25000', discountMinor: '1000', taxMinor: '4500', retentionMinor: '1425', totalMinor: '27075', grossMinor: '28500' });
  });
  it('supports multi-invoice allocations and preserves an unallocated balance', () => {
    expect(allocatePayment('100000', [{ invoiceId: 'a', outstandingMinor: '70000', allocationMinor: '70000' }, { invoiceId: 'b', outstandingMinor: '50000', allocationMinor: '25000' }])).toEqual({ allocatedMinor: '95000', unallocatedMinor: '5000' });
  });
  it('prevents over-allocation', () => {
    expect(() => allocatePayment('100', [{ invoiceId: 'a', outstandingMinor: '80', allocationMinor: '90' }])).toThrow(/exceeds outstanding/i);
  });
});

describe('cross-module workflows', () => {
  it('converts only a winning bid and keeps its source link', () => {
    const project = convertWinningBidToProject({ id: 'bid-1', status: 'won', title: 'Clinic works', customerId: 'cus-1', estimatedValueMinor: '500000', currency: 'UGX' }, 'SA-PRJ-100');
    expect(project.bidId).toBe('bid-1'); expect(project.code).toBe('SA-PRJ-100');
  });
  it('calculates configurable retention exactly', () => {
    expect(calculateRetention('100000', 500, '2000')).toEqual({ baseMinor: '100000', basisPoints: 500, amountMinor: '5000', receivedMinor: '2000', balanceMinor: '3000' });
  });
  it('selects configured approval bands', () => {
    const bands = [{ upToMinor: '1000', requiredRoles: ['MANAGER'] }, { upToMinor: null, requiredRoles: ['FINANCE ADMIN', 'DIRECTOR'] }];
    expect(resolveApprovalRoute('5000', bands)).toEqual(['FINANCE ADMIN', 'DIRECTOR']);
  });
});
