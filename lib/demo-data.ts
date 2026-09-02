import { formatUgx } from './presentation';

export const money = (value: number) => formatUgx(value);

export const kpis = [
  { label: 'Revenue', value: 4_820_000_000, delta: '+12.4%', tone: 'positive' },
  { label: 'Gross profit', value: 1_186_000_000, delta: '24.6% margin', tone: 'positive' },
  { label: 'Cash position', value: 742_600_000, delta: 'Across 4 accounts', tone: 'neutral' },
  { label: 'Receivables', value: 986_400_000, delta: 'UGX 214m overdue', tone: 'warning' },
];

export const cashFlow = [
  { month: 'Mar', income: 420, expenses: 310 }, { month: 'Apr', income: 590, expenses: 410 },
  { month: 'May', income: 530, expenses: 355 }, { month: 'Jun', income: 720, expenses: 475 },
  { month: 'Jul', income: 655, expenses: 430 }, { month: 'Aug', income: 880, expenses: 535 },
];

export const attentionItems = [
  { kind: 'Invoice', title: 'UNRA Interim Certificate #04', meta: 'UGX 184,500,000 · 18 days overdue', level: 'Urgent' },
  { kind: 'Bid', title: 'Mbarara Regional Hospital supply', meta: 'Closes 05 Sep · checklist 76%', level: 'Due soon' },
  { kind: 'Stock', title: 'Portland cement · Namanve', meta: '86 bags available · reorder at 120', level: 'Low stock' },
];

export const projects = [
  { code: 'SA-PRJ-024', name: 'Jinja Laboratory Refurbishment', client: 'Ministry of Health', stage: 'Work execution', progress: 68, budget: 890_000_000, spent: 521_600_000, profit: 164_800_000 },
  { code: 'SA-PRJ-021', name: 'Gulu Municipal Office Fit-out', client: 'Gulu City Council', stage: 'Interim payment', progress: 82, budget: 1_240_000_000, spent: 811_000_000, profit: 232_400_000 },
  { code: 'SA-PRJ-027', name: 'Entebbe Medical Stores Supply', client: 'Joint Medical Store', stage: 'Secure materials', progress: 34, budget: 680_000_000, spent: 189_400_000, profit: 91_500_000 },
];

export const activity = [
  { title: 'Payment allocated', meta: 'UGX 96,000,000 · INV-2026-0184', time: '24 min ago', tone: 'positive' },
  { title: 'Purchase order approved', meta: 'PO-2026-0098 · Roofings Uganda', time: '1 hr ago', tone: 'info' },
  { title: 'Bid checklist updated', meta: 'MOH/SUPLS/2026/114 · 16 of 21 complete', time: '2 hrs ago', tone: 'warning' },
  { title: 'Retention became eligible', meta: 'Wakiso Classroom Block · UGX 42,500,000', time: 'Yesterday', tone: 'positive' },
];
