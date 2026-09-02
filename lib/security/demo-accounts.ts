export const DEMO_PASSWORD = 'Demo123!';

export type DemoRole = keyof typeof demoAccountsByRole;

export const demoAccountsByRole = {
  'SUPER ADMIN': { id: 'user-admin', name: 'Samuel Kato', email: 'admin@starafrica.demo', department: 'Administration' },
  DIRECTOR: { id: 'user-director', name: 'Amina Nsubuga', email: 'director@starafrica.demo', department: 'Management' },
  'FINANCE ADMIN': { id: 'user-finance', name: 'Peter Mugisha', email: 'finance@starafrica.demo', department: 'Finance' },
  ACCOUNTANT: { id: 'user-accountant', name: 'Ruth Namayanja', email: 'accountant@starafrica.demo', department: 'Finance' },
  'BIDS & TENDERS OFFICER': { id: 'user-bids', name: 'Irene Adoch', email: 'bids@starafrica.demo', department: 'Bids & Tenders' },
  'PROJECT MANAGER': { id: 'user-projects', name: 'Daniel Okello', email: 'projects@starafrica.demo', department: 'Projects' },
  'PROCUREMENT OFFICER': { id: 'user-procurement', name: 'Grace Namusoke', email: 'procurement@starafrica.demo', department: 'Procurement' },
  'HR / PAYROLL': { id: 'user-hr', name: 'Sarah Nabwire', email: 'hr@starafrica.demo', department: 'People' },
  'AUDITOR / VIEWER': { id: 'user-auditor', name: 'Joel Ssemanda', email: 'auditor@starafrica.demo', department: 'Audit' },
} as const;

export const demoAccounts = Object.entries(demoAccountsByRole).map(([role, account]) => ({ ...account, role: role as DemoRole }));

export function findDemoAccount(email: string) {
  return demoAccounts.find((account) => account.email === email.trim().toLowerCase());
}
