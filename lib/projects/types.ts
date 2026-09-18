export type ProjectRecord = {
  id: string;
  code: string;
  name: string;
  client: string;
  category: string;
  description: string;
  location: string;
  priority: string;
  currency: string;
  contractValueMinor: string;
  budgetMinor: string;
  committedMinor: string;
  actualMinor: string;
  retentionBasisPoints: number;
  startsAt: string;
  plannedCompletionAt: string;
  stage: string;
  status: string;
  health: string;
  completionBasisPoints: number;
  projectManager: string;
  siteManager: string;
};

export const projectStages = [
  'Awarded',
  'Contract Setup',
  'Site Handover',
  'Mobilization',
  'Materials Procurement',
  'Work Started',
  'In Progress',
  'Testing',
  'Practical Completion',
  'Retention Period',
  'Completed',
  'Closed',
];

export const money = (minor: string, currency = 'UGX') =>
  `${currency} ${(Number(minor) / 100 / 1_000_000).toLocaleString('en-UG', {
    maximumFractionDigits: 1,
  })}M`;

export const healthLabel = (health: string) =>
  health.replaceAll('_', ' ').replace(/\b\w/g, (match) => match.toUpperCase());
