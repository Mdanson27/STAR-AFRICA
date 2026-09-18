export type ModuleConfig = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  primaryAction: string;
  primaryHref?: string;
  secondaryAction?: string;
  tabs: string[];
  workflow?: string[];
  stats: { label: string; value: string; note: string }[];
  columns: string[];
  rows: string[][];
};

const emptyStats = (...labels: string[]) =>
  labels.map((label) => ({
    label,
    value: '0',
    note: 'No production records yet',
  }));

export const modules: ModuleConfig[] = [
  {
    slug: 'procurement',
    title: 'Procurement',
    eyebrow: 'Request to payment',
    description:
      'Manage controlled purchasing, supplier comparison, purchase orders, receipts and supplier bills from live production records.',
    primaryAction: 'New request',
    tabs: ['Requests', 'RFQs', 'Quotations', 'Purchase orders', 'Goods receipts', 'Supplier bills'],
    workflow: ['Request', 'Approve', 'RFQ', 'Compare', 'Order', 'Receive', 'Bill'],
    stats: emptyStats('Open requests', 'Awaiting approval', 'Purchase orders', 'Supplier bills'),
    columns: ['Reference', 'Purpose', 'Related record', 'Requested by', 'Value', 'Status'],
    rows: [],
  },
  {
    slug: 'suppliers',
    title: 'Suppliers',
    eyebrow: 'Supplier relationships',
    description:
      'Maintain approved suppliers, contact details, credit terms and purchasing history. Imported QuickBooks suppliers retain source references.',
    primaryAction: 'New supplier',
    tabs: ['Suppliers', 'Contacts', 'Bills', 'Payments', 'Performance'],
    stats: emptyStats('Active suppliers', 'Open bills', 'Outstanding', 'Due soon'),
    columns: ['Code', 'Supplier', 'Phone', 'Email', 'Terms', 'Status'],
    rows: [],
  },
  {
    slug: 'inventory',
    title: 'Inventory & materials',
    eyebrow: 'Stock control',
    description:
      'Track production stock, receipts, issues, project allocations, batches and valuation without seeded demonstration quantities.',
    primaryAction: 'New item',
    tabs: ['Items', 'Movements', 'Warehouses', 'Project allocations', 'Batches'],
    workflow: ['Purchase', 'Receive', 'Store', 'Allocate', 'Issue', 'Consume / return'],
    stats: emptyStats('Inventory items', 'Low stock', 'Reserved stock', 'Warehouses'),
    columns: ['SKU', 'Item', 'Category', 'Available', 'Reserved', 'Status'],
    rows: [],
  },
  {
    slug: 'invoices',
    title: 'Invoices',
    eyebrow: 'Bill to collect',
    description:
      'Create and manage customer invoices backed by production customer and project records.',
    primaryAction: 'New invoice',
    tabs: ['All invoices', 'Drafts', 'Awaiting approval', 'Outstanding', 'Credit notes'],
    workflow: ['Draft', 'Approve', 'Attach evidence', 'Send', 'Collect', 'Close'],
    stats: emptyStats('Outstanding', 'Overdue', 'Collected', 'Drafts'),
    columns: ['Invoice', 'Customer / project', 'Issued', 'Due', 'Total', 'Status'],
    rows: [],
  },
  {
    slug: 'payments',
    title: 'Payments',
    eyebrow: 'Collection control',
    description:
      'Record receipts and payments, allocate them to source documents and preserve a complete audit trail.',
    primaryAction: 'Record payment',
    tabs: ['Customer payments', 'Supplier payments', 'Allocations', 'Receipts', 'Expected'],
    workflow: ['Expected', 'Receive / pay', 'Allocate', 'Post', 'Reconcile'],
    stats: emptyStats('Received', 'Paid', 'Unallocated', 'Awaiting reconciliation'),
    columns: ['Reference', 'Party', 'Date', 'Amount', 'Allocation', 'Status'],
    rows: [],
  },
  {
    slug: 'finance',
    title: 'Finance & accounting',
    eyebrow: 'Controlled financial core',
    description:
      'Use the chart of accounts, journals and production reports while preserving QuickBooks opening balances as traceable legacy imports.',
    primaryAction: 'New journal',
    tabs: ['Overview', 'Chart of accounts', 'Journals', 'General ledger', 'Fiscal periods'],
    workflow: ['Prepare', 'Validate', 'Approve', 'Post', 'Report'],
    stats: emptyStats('Accounts', 'Posted journals', 'Unposted journals', 'Open periods'),
    columns: ['Journal', 'Date', 'Source', 'Memo', 'Debits = credits', 'Status'],
    rows: [],
  },
  {
    slug: 'banking',
    title: 'Banking & reconciliation',
    eyebrow: 'Ledger to statement',
    description:
      'Manage bank accounts, statement imports, matching, cheque controls and reconciliations from real production activity.',
    primaryAction: 'Import statement',
    tabs: ['Accounts', 'Transactions', 'Reconciliations', 'Cheques', 'Matching rules'],
    workflow: ['Import', 'Analyse', 'Suggest', 'Confirm', 'Resolve', 'Finalise'],
    stats: emptyStats('Bank accounts', 'Unmatched items', 'Open reconciliations', 'Cheques in transit'),
    columns: ['Date', 'Bank / account', 'Description', 'Reference', 'Amount', 'Match'],
    rows: [],
  },
  {
    slug: 'payroll',
    title: 'Payroll & HR',
    eyebrow: 'People and payroll',
    description:
      'Maintain authorised employee records, payroll runs, earnings, deductions, approvals and posting.',
    primaryAction: 'New employee',
    tabs: ['Employees', 'Payroll runs', 'Components', 'Payslips', 'Rules'],
    workflow: ['Draft', 'Calculate', 'Review', 'Approve', 'Pay', 'Post'],
    stats: emptyStats('Active employees', 'Current payroll', 'Pending approvals', 'Payslips'),
    columns: ['Employee', 'Department', 'Job title', 'Payment method', 'Current run', 'Status'],
    rows: [],
  },
  {
    slug: 'calendar',
    title: 'Operational calendar',
    eyebrow: 'Dates that matter',
    description:
      'Bring production deadlines, payment dates, project milestones, payroll and tax dates into one operational view.',
    primaryAction: 'New event',
    tabs: ['Month', 'Week', 'Agenda', 'Deadlines'],
    stats: emptyStats('Upcoming events', 'Bid deadlines', 'Project milestones', 'Payment dates'),
    columns: ['Date', 'Event', 'Area', 'Owner', 'Related record', 'Status'],
    rows: [],
  },
  {
    slug: 'administration',
    title: 'Administration',
    eyebrow: 'Governance and access',
    description:
      'Manage production users, roles, permissions, system audit activity, security monitoring and data migration history.',
    primaryAction: 'Manage users',
    tabs: ['Users', 'Roles', 'Permissions', 'Audit', 'Security', 'Data imports'],
    stats: emptyStats('Active users', 'Roles', 'Security warnings', 'Completed imports'),
    columns: ['Area', 'Record', 'Owner', 'Updated', 'Status'],
    rows: [],
  },
  {
    slug: 'settings',
    title: 'Settings',
    eyebrow: 'System configuration',
    description:
      'Configure company-wide production settings, numbering, fiscal periods, notifications and integrations.',
    primaryAction: 'Save settings',
    tabs: ['Company', 'Finance', 'Numbering', 'Notifications', 'Integrations'],
    stats: emptyStats('Configured areas', 'Connected services', 'Pending changes', 'Validation issues'),
    columns: ['Setting', 'Area', 'Value', 'Updated by', 'Updated', 'Status'],
    rows: [],
  },
];

export const moduleBySlug = (slug: string) =>
  modules.find((module) => module.slug === slug);
