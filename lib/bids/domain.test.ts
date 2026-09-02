import { describe, expect, it } from 'vitest';
import { canTransition, deadlineState, likelyDuplicate, pricingLine, qualificationRecommendation, qualificationScore, securityExpiryState, submissionReadiness, sumMinor } from './domain';

describe('bids lifecycle domain', () => {
  it('calculates weighted qualification scores and recommendation', () => { expect(qualificationScore([{ weight:60, score:80 }, { weight:40, score:50 }])).toBe(68); expect(qualificationRecommendation(68)).toBe('REVIEW'); });
  it('rejects invalid lifecycle transitions', () => { expect(canTransition('preparing','internal_review')).toBe(true); expect(canTransition('new','submitted')).toBe(false); });
  it('calculates pricing with exact integer minor units', () => { expect(pricingLine({ quantity:'2.000', unitCostMinor:'10000', markupBasisPoints:1000, taxBasisPoints:1800 })).toEqual({ costMinor:'20000', sellingMinor:'22000', taxMinor:'3960', totalMinor:'25960' }); });
  it('returns exact readiness blockers', () => { const result = submissionReadiness({ mandatoryRequirementsComplete:false, requiredDocumentsPresent:true, documentsValid:true, pricingApproved:false, technicalApproved:true, securityValid:true, finalApprovalComplete:true, deadline:new Date('2030-01-01') }, new Date('2026-01-01')); expect(result.ready).toBe(false); expect(result.blockers).toHaveLength(2); });
  it('calculates deadline severity', () => { expect(deadlineState(new Date('2026-01-05'), new Date('2026-01-01')).tone).toBe('approaching'); expect(deadlineState(new Date('2025-12-31'), new Date('2026-01-01')).label).toBe('Closed'); });
  it('detects duplicate references', () => { expect(likelyDuplicate({ reference:' ABC-1 ', organization:'X', title:'Y', deadline:'2026-01-01' }, [{ reference:'abc/1', organization:'Z', title:'Q', deadline:'2026-02-01' }])).toBeTruthy(); });
  it('totals bid expenses with exact minor-unit arithmetic', () => { expect(sumMinor(['25000000','215000000','68000000'])).toBe('308000000'); });
  it('classifies bid security expiry thresholds', () => { expect(securityExpiryState(new Date('2026-09-10'),true,new Date('2026-09-02'),14)).toBe('expiring_soon'); expect(securityExpiryState(new Date('2026-09-01'),true,new Date('2026-09-02'))).toBe('expired'); expect(securityExpiryState(null,false)).toBe('not_required'); });
  it('allows result recording only after submission is awaiting a decision', () => { expect(canTransition('awaiting_result','won')).toBe(true); expect(canTransition('preparing','won')).toBe(false); });
});
