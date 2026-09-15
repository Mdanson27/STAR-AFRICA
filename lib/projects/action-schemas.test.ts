import { describe, expect, it } from 'vitest';
import { materialRequestSchema, materialUsageSchema, milestoneSchema, riskSchema } from './action-schemas';

describe('project entity validation', () => {
  it('accepts a complete milestone and coerces its business values', () => {
    const result = milestoneSchema.safeParse({
      name: 'Foundation complete', description: 'Complete foundations for Block A', stage: 'In Progress',
      responsiblePerson: 'Project Manager', plannedStartDate: '2026-09-03', dueDate: '2026-09-30',
      weight: '15', priority: 'high', deliverable: 'Signed foundation inspection',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.weight).toBe(15);
  });

  it('rejects a material request without a positive quantity', () => {
    const result = materialRequestSchema.safeParse({
      material: 'Cement', specification: '42.5N', unit: 'bags', quantity: '0', availableQuantity: '0',
      requiredDate: '2026-09-10', activity: 'Foundation', deliveryLocation: 'Main store', priority: 'normal',
      estimatedUnitCost: '42000', purpose: 'Concrete works',
    });
    expect(result.success).toBe(false);
  });

  it('prevents recording more material used than issued', () => {
    const result = materialUsageSchema.safeParse({
      material: 'Cement', quantityIssued: '10', quantityUsed: '12', quantityReturned: '0',
      date: '2026-09-03', activity: 'Foundation', issuedBy: 'Storekeeper', receivedBy: 'Foreman',
    });
    expect(result.success).toBe(false);
  });

  it('limits risk likelihood and impact to the five-point scale', () => {
    const result = riskSchema.safeParse({
      title: 'Late steel', description: 'Rebar delivery may miss the programme', category: 'procurement',
      likelihood: '6', impact: '4', owner: 'Project Manager', mitigation: 'Confirm alternate supplier',
      contingency: 'Resequence works', targetDate: '2026-09-12',
    });
    expect(result.success).toBe(false);
  });
});
