export const DEMO_PASSWORD = 'Demo123!';

export const demoAccountsByRole = {
  SUPER_ADMIN: { id: 'user-admin', employeeId: 'employee-admin', name: 'Samuel Kato', email: 'admin@starafrica.demo', department: 'Administration', position: 'Super Administrator' },
  DIRECTOR: { id: 'user-director', employeeId: 'employee-director', name: 'Amina Nsubuga', email: 'director@starafrica.demo', department: 'Management', position: 'Director' },
  FINANCE_ADMIN: { id: 'user-finance', employeeId: 'employee-finance', name: 'Peter Mugisha', email: 'finance@starafrica.demo', department: 'Finance', position: 'Finance Manager' },
  ACCOUNTANT: { id: 'user-accountant', employeeId: 'employee-accountant', name: 'Ruth Namayanja', email: 'accountant@starafrica.demo', department: 'Finance', position: 'Accountant' },
  BIDS_OFFICER: { id: 'user-bids', employeeId: 'employee-bids', name: 'Irene Adoch', email: 'bids@starafrica.demo', department: 'Bids & Tenders', position: 'Bids & Tenders Officer' },
  PROJECT_MANAGER: { id: 'user-projects', employeeId: 'employee-projects', name: 'Daniel Okello', email: 'projects@starafrica.demo', department: 'Projects', position: 'Project Manager' },
  SITE_MANAGER: { id: 'user-site', employeeId: 'employee-site', name: 'Moses Kato', email: 'site@starafrica.demo', department: 'Projects', position: 'Site Manager' },
  PROCUREMENT_OFFICER: { id: 'user-procurement', employeeId: 'employee-procurement', name: 'Grace Namusoke', email: 'procurement@starafrica.demo', department: 'Procurement', position: 'Procurement Officer' },
  HR_PAYROLL: { id: 'user-hr', employeeId: 'employee-hr', name: 'Sarah Nabwire', email: 'hr@starafrica.demo', department: 'People', position: 'HR Officer' },
  AUDITOR: { id: 'user-auditor', employeeId: 'employee-auditor', name: 'Joel Ssemanda', email: 'auditor@starafrica.demo', department: 'Audit', position: 'Internal Auditor' },
} as const;

export type DemoRole = keyof typeof demoAccountsByRole;

export const demoAccounts = Object.entries(demoAccountsByRole).map(([role, account]) => ({ ...account, role: role as DemoRole }));

export function findDemoAccount(email: string) {
  return demoAccounts.find((account) => account.email === email.trim().toLowerCase());
}
