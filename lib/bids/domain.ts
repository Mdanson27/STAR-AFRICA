export const BID_STAGES = ['new', 'reviewing', 'qualification', 'approved_to_pursue', 'preparing', 'internal_review', 'ready_for_submission', 'submitted', 'awaiting_result', 'won', 'lost', 'cancelled', 'archived'] as const;
export type BidStage = typeof BID_STAGES[number];

export const BID_TRANSITIONS: Record<BidStage, readonly BidStage[]> = {
  new: ['reviewing', 'cancelled'], reviewing: ['qualification', 'cancelled'], qualification: ['approved_to_pursue', 'cancelled'],
  approved_to_pursue: ['preparing', 'cancelled'], preparing: ['internal_review', 'cancelled'], internal_review: ['preparing', 'ready_for_submission'],
  ready_for_submission: ['submitted', 'preparing'], submitted: ['awaiting_result'], awaiting_result: ['won', 'lost', 'cancelled'],
  won: ['archived'], lost: ['archived'], cancelled: ['archived'], archived: [],
};

export type QualificationCriterion = { weight: number; score: number };
export function qualificationScore(criteria: readonly QualificationCriterion[]) {
  const weight = criteria.reduce((sum, item) => sum + item.weight, 0);
  if (!weight) return 0;
  return Math.round(criteria.reduce((sum, item) => sum + item.weight * Math.max(0, Math.min(100, item.score)), 0) / weight);
}

export function qualificationRecommendation(score: number) {
  return score >= 70 ? 'PURSUE' : score >= 50 ? 'REVIEW' : 'DO NOT PURSUE';
}

export function canTransition(from: BidStage, to: BidStage) {
  return BID_TRANSITIONS[from].includes(to);
}

export function pricingLine(input: { quantity: string; unitCostMinor: string; markupBasisPoints: number; taxBasisPoints: number }) {
  const quantityThousandths = BigInt(input.quantity.replace('.', '').padEnd(input.quantity.includes('.') ? input.quantity.split('.')[0].length + 3 : input.quantity.length + 3, '0'));
  const cost = (BigInt(input.unitCostMinor) * quantityThousandths) / 1000n;
  const selling = cost + (cost * BigInt(input.markupBasisPoints)) / 10000n;
  const tax = (selling * BigInt(input.taxBasisPoints)) / 10000n;
  return { costMinor: cost.toString(), sellingMinor: selling.toString(), taxMinor: tax.toString(), totalMinor: (selling + tax).toString() };
}

export type ReadinessInput = { mandatoryRequirementsComplete: boolean; requiredDocumentsPresent: boolean; documentsValid: boolean; pricingApproved: boolean; technicalApproved: boolean; securityValid: boolean; finalApprovalComplete: boolean; deadline: Date };
export function submissionReadiness(input: ReadinessInput, now = new Date()) {
  const blockers: string[] = [];
  if (!input.mandatoryRequirementsComplete) blockers.push('Mandatory requirements are incomplete.');
  if (!input.requiredDocumentsPresent) blockers.push('Required final documents are missing.');
  if (!input.documentsValid) blockers.push('A required document is expired or unverified.');
  if (!input.pricingApproved) blockers.push('Pricing approval is outstanding.');
  if (!input.technicalApproved) blockers.push('Technical approval is outstanding.');
  if (!input.securityValid) blockers.push('Bid security is missing, expired or invalid.');
  if (!input.finalApprovalComplete) blockers.push('Final submission approval is outstanding.');
  if (input.deadline.getTime() <= now.getTime()) blockers.push('The submission deadline has passed.');
  return { ready: blockers.length === 0, blockers };
}

export function deadlineState(deadline: Date, now = new Date()) {
  const hours = (deadline.getTime() - now.getTime()) / 3_600_000;
  if (hours <= 0) return { tone: 'expired', label: 'Closed' } as const;
  if (hours < 24) return { tone: 'critical', label: `${Math.ceil(hours)} hours remaining` } as const;
  const days = Math.ceil(hours / 24);
  return { tone: days <= 3 ? 'critical' : days <= 7 ? 'approaching' : 'normal', label: `${days} days remaining` } as const;
}

export function sumMinor(values: readonly string[]) {
  return values.reduce((sum, value) => sum + BigInt(value), 0n).toString();
}

export function securityExpiryState(expiry: Date | null, required: boolean, now = new Date(), warningDays = 14) {
  if (!required) return 'not_required' as const;
  if (!expiry) return 'required' as const;
  const remainingDays = (expiry.getTime() - now.getTime()) / 86_400_000;
  if (remainingDays <= 0) return 'expired' as const;
  if (remainingDays <= warningDays) return 'expiring_soon' as const;
  return 'active' as const;
}

export function likelyDuplicate(candidate: { reference: string; organization: string; title: string; deadline: string }, existing: readonly { reference: string; organization: string; title: string; deadline: string }[]) {
  const normalize = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
  return existing.find((item) => normalize(item.reference) === normalize(candidate.reference) || (normalize(item.organization) === normalize(candidate.organization) && normalize(item.title) === normalize(candidate.title) && item.deadline === candidate.deadline));
}
