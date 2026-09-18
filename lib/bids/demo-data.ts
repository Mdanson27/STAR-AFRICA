import type { BidStage } from './domain';

export type DemoBid = {
  id: string;
  reference: string;
  title: string;
  organization: string;
  description: string;
  category: string;
  location: string;
  source: string;
  owner: string;
  deadline: string;
  valueMinor: string;
  currency: string;
  stage: BidStage;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  progress: number;
  qualificationScore: number;
  watched: boolean;
  spendMinor: string;
  readiness: number;
  published: string;
  expectedAward: string;
  procurementMethod: string;
};

// Compatibility exports only. Production V1 contains no seeded bid records.
export const demoBids: DemoBid[] = [];
export const requirements: Array<{
  name: string;
  category: string;
  owner: string;
  due: string;
  status: string;
  mandatory: boolean;
}> = [];
export const pricingLines: Array<{
  description: string;
  unit: string;
  quantity: number;
  unitCost: number;
  markup: number;
  selling: number;
}> = [];
export const activities: string[][] = [];

export function formatMoney(minor: string | number, currency = 'UGX') {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(minor) / 100);
}

export function labelStage(stage: string) {
  return stage
    .split('_')
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');
}
