export type ModuleConfig = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  primaryAction: string;
  secondaryAction?: string;
  tabs: string[];
  workflow?: string[];
  stats: { label: string; value: string; note: string }[];
  columns: string[];
  rows: string[][];
};

export const modules: ModuleConfig[] = [
  {
    slug: 'bids', title: 'Bids & tenders', eyebrow: 'Opportunity to award',
    description: 'Qualify opportunities, assemble compliant submissions, track bid costs, and convert wins without re-entry.',
    primaryAction: 'New opportunity', secondaryAction: 'Import opportunities', tabs: ['Opportunities', 'Bid workspaces', 'Checklist', 'Expenses', 'Sources'],
    workflow: ['Discover', 'Qualify', 'Prepare', 'Approve', 'Submit', 'Award'],
    stats: [{ label: 'Active opportunities', value: '8', note: 'UGX 6.2B potential value' }, { label: 'Closing in 7 days', value: '3', note: '2 require bid security' }, { label: 'Bid spend YTD', value: 'UGX 48.6M', note: 'UGX 6.9M per win' }, { label: 'Win rate', value: '36.8%', note: '7 awards from 19 results' }],
    columns: ['Reference', 'Opportunity', 'Organisation', 'Deadline', 'Progress', 'Status'],
    rows: [['MOH/SUPLS/26/114', 'Laboratory equipment framework', 'Ministry of Health', '05 Sep 2026', '76%', 'Preparing'], ['KCCA/WRKS/26/044', 'Drainage rehabilitation — Lot 2', 'KCCA', '11 Sep 2026', '42%', 'Qualified'], ['UNICEF/UGA/2026/881', 'School furniture supply', 'UNICEF Uganda', '19 Sep 2026', '18%', 'Reviewing'], ['NWSC/CONS/26/209', 'Regional office refurbishment', 'NWSC', '26 Sep 2026', '8%', 'New']],
  },
  {
    slug: 'projects', title: 'Projects', eyebrow: 'Contract delivery',
    description: 'Control every awarded contract from site handover through execution, certification, retention, and closeout.',
    primaryAction: 'New project', secondaryAction: 'Project report', tabs: ['Portfolio', 'Timeline', 'Tasks', 'Budgets', 'Profitability'],
    workflow: ['Award', 'Handover', 'Mobilise', 'Execute', 'Test', 'Retain', 'Close'],
    stats: [{ label: 'Active projects', value: '12', note: 'UGX 8.7B contract value' }, { label: 'Budget utilisation', value: '61.4%', note: 'Across active portfolio' }, { label: 'Forecast profit', value: 'UGX 1.14B', note: '13.1% blended margin' }, { label: 'Requires attention', value: '3', note: '1 schedule, 2 payments' }],
    columns: ['Code', 'Project', 'Client', 'Stage', 'Completion', 'Forecast profit'],
    rows: [['SA-PRJ-024', 'Jinja Laboratory Refurbishment', 'Ministry of Health', 'Work execution', '68%', 'UGX 164.8M'], ['SA-PRJ-021', 'Gulu Municipal Office Fit-out', 'Gulu City Council', 'Interim payment', '82%', 'UGX 232.4M'], ['SA-PRJ-027', 'Entebbe Medical Stores Supply', 'Joint Medical Store', 'Secure materials', '34%', 'UGX 91.5M'], ['SA-PRJ-019', 'Wakiso Classroom Block', 'Wakiso DLG', 'Retention', '100%', 'UGX 118.2M']],
  },
  {
    slug: 'procurement', title: 'Procurement', eyebrow: 'Request to payment',
    description: 'Run controlled purchasing with approvals, supplier comparison, purchase orders, receipts, bills, and accounting traceability.',
    primaryAction: 'New request', secondaryAction: 'Create RFQ', tabs: ['Requests', 'RFQs', 'Quotations', 'Purchase orders', 'Goods receipts', 'Supplier bills'],
    workflow: ['Request', 'Approve', 'RFQ', 'Compare', 'Order', 'Receive', 'Bill'],
    stats: [{ label: 'Open requests', value: '14', note: '5 awaiting approval' }, { label: 'PO value this month', value: 'UGX 624M', note: '18 purchase orders' }, { label: 'Awaiting delivery', value: '7', note: 'UGX 214M committed' }, { label: 'Supplier credit', value: 'UGX 428M', note: 'UGX 88.4M due this week' }],
    columns: ['Reference', 'Purpose', 'Related to', 'Requested by', 'Value', 'Status'],
    rows: [['PR-2026-0142', 'Reinforcement steel and binding wire', 'SA-PRJ-024', 'Daniel Okello', 'UGX 84.6M', 'Approved'], ['PO-2026-0098', 'Roofing sheets — Lot A', 'SA-PRJ-021', 'Grace Namusoke', 'UGX 126.2M', 'Awaiting delivery'], ['RFQ-2026-0061', 'Laboratory benches', 'SA-PRJ-024', 'Irene Adoch', '3 quotations', 'Comparison'], ['GRN-2026-0087', 'Portland cement delivery', 'SA-PRJ-027', 'Moses Kato', '420 bags', 'Received']],
  },
  {
    slug: 'inventory', title: 'Inventory & materials', eyebrow: 'Stock control',
    description: 'Track materials by warehouse, batch, expiry, reservation, project issue, consumption, return, and valuation.',
    primaryAction: 'New item', secondaryAction: 'Receive stock', tabs: ['Items', 'Movements', 'Warehouses', 'Project allocations', 'Batches'],
    workflow: ['Purchase', 'Receive', 'Store', 'Allocate', 'Issue', 'Consume / return'],
    stats: [{ label: 'Inventory value', value: 'UGX 938M', note: '4 active locations' }, { label: 'Low stock items', value: '11', note: '3 affect active projects' }, { label: 'Reserved stock', value: 'UGX 284M', note: 'Across 7 projects' }, { label: 'Expiring in 90 days', value: '6', note: 'Medicines and reagents' }],
    columns: ['SKU', 'Item', 'Category', 'Available', 'Reserved', 'Status'],
    rows: [['MAT-CEM-001', 'Portland cement 42.5N', 'Construction', '86 bags', '44 bags', 'Low stock'], ['LAB-CEN-014', 'Bench centrifuge 4000 rpm', 'Laboratory', '18 units', '12 units', 'Available'], ['FUR-DSK-008', 'Executive desk 1.8m', 'Furniture', '27 units', '20 units', 'Available'], ['MED-GLV-102', 'Nitrile examination gloves', 'Medical', '140 boxes', '95 boxes', 'Reorder soon']],
  },
  {
    slug: 'customers', title: 'Customers & sales', eyebrow: 'Client relationships',
    description: 'See every client’s bids, projects, invoices, receipts, retention, communication, and outstanding position.',
    primaryAction: 'New customer', secondaryAction: 'Customer statement', tabs: ['Customers', 'Contacts', 'Sales history', 'Statements'],
    stats: [{ label: 'Active customers', value: '28', note: '11 with active projects' }, { label: 'Lifetime revenue', value: 'UGX 18.4B', note: 'Since migration opening' }, { label: 'Outstanding', value: 'UGX 986M', note: 'UGX 214M overdue' }, { label: 'Retention', value: 'UGX 274.7M', note: 'Across 6 clients' }],
    columns: ['Code', 'Customer', 'Open projects', 'Billed YTD', 'Outstanding', 'Status'],
    rows: [['CUS-0012', 'Ministry of Health', '3', 'UGX 1.48B', 'UGX 266M', 'Active'], ['CUS-0007', 'Gulu City Council', '1', 'UGX 946M', 'UGX 184.5M', 'Overdue'], ['CUS-0019', 'Joint Medical Store', '2', 'UGX 786M', 'UGX 96M', 'Active'], ['CUS-0004', 'Wakiso District Local Government', '1', 'UGX 520M', 'UGX 42.5M', 'Retention']],
  },
  {
    slug: 'invoices', title: 'Invoices', eyebrow: 'Bill to collect',
    description: 'Create VAT-ready invoices, attach delivery evidence, send through a configured provider, and follow every balance to settlement.',
    primaryAction: 'New invoice', secondaryAction: 'Send statements', tabs: ['All invoices', 'Drafts', 'Awaiting approval', 'Outstanding', 'Credit notes'],
    workflow: ['Draft', 'Approve', 'Attach evidence', 'Send', 'Collect', 'Close'],
    stats: [{ label: 'Outstanding', value: 'UGX 986.4M', note: '22 open invoices' }, { label: 'Overdue', value: 'UGX 214.0M', note: '6 invoices require action' }, { label: 'Collected this month', value: 'UGX 684M', note: '82.4% collection rate' }, { label: 'Draft value', value: 'UGX 391M', note: '5 awaiting completion' }],
    columns: ['Invoice', 'Customer / project', 'Issued', 'Due', 'Total', 'Status'],
    rows: [['INV-2026-0184', 'Gulu City Council · SA-PRJ-021', '03 Aug 2026', '17 Aug 2026', 'UGX 184.5M', 'Overdue'], ['INV-2026-0192', 'Ministry of Health · SA-PRJ-024', '18 Aug 2026', '17 Sep 2026', 'UGX 266M', 'Sent'], ['INV-2026-0196', 'Joint Medical Store · SA-PRJ-027', '24 Aug 2026', '23 Sep 2026', 'UGX 96M', 'Partially paid'], ['INV-2026-0201', 'UNICEF Uganda · Furniture supply', '31 Aug 2026', '30 Sep 2026', 'UGX 142.8M', 'Draft']],
  },
  {
    slug: 'payments', title: 'Payments', eyebrow: 'Collection control',
    description: 'Record partial or multi-invoice receipts, preserve allocation history, issue receipts, and post through accounts receivable.',
    primaryAction: 'Record payment', secondaryAction: 'Payment reminder', tabs: ['Customer payments', 'Expected', 'Allocations', 'Receipts', 'Reminders'],
    workflow: ['Expected', 'Receive', 'Allocate', 'Post', 'Reconcile'],
    stats: [{ label: 'Received this month', value: 'UGX 684M', note: '18 payment receipts' }, { label: 'Expected next 30 days', value: 'UGX 771M', note: 'Across 13 invoices' }, { label: 'Unallocated', value: 'UGX 16.4M', note: '2 bank receipts' }, { label: 'Overdue expected', value: 'UGX 214M', note: 'Escalation queue active' }],
    columns: ['Reference', 'Customer', 'Received', 'Amount', 'Allocated', 'Status'],
    rows: [['PAY-2026-0118', 'Joint Medical Store', '02 Sep 2026', 'UGX 96M', 'INV-2026-0196', 'Posted'], ['PAY-2026-0117', 'Ministry of Health', '01 Sep 2026', 'UGX 140M', '2 invoices', 'Posted'], ['PAY-2026-0116', 'UNICEF Uganda', '30 Aug 2026', 'UGX 84.6M', 'INV-2026-0177', 'Reconciled'], ['PAY-2026-0115', 'Wakiso DLG', '28 Aug 2026', 'UGX 16.4M', 'Unallocated', 'Needs review']],
  },
  {
    slug: 'finance', title: 'Finance & accounting', eyebrow: 'Double-entry core',
    description: 'A controlled general ledger with balanced journals, period locks, central posting rules, reversals, and complete financial statements.',
    primaryAction: 'New journal', secondaryAction: 'Trial balance', tabs: ['Overview', 'Chart of accounts', 'Journals', 'General ledger', 'Fiscal periods'],
    workflow: ['Prepare', 'Validate', 'Approve', 'Post', 'Report'],
    stats: [{ label: 'Assets', value: 'UGX 6.84B', note: 'Current and non-current' }, { label: 'Liabilities', value: 'UGX 1.92B', note: 'Including taxes and payables' }, { label: 'Net income YTD', value: 'UGX 812M', note: '16.8% net margin' }, { label: 'Unposted journals', value: '4', note: 'UGX 128.6M total debits' }],
    columns: ['Journal', 'Date', 'Source', 'Memo', 'Debits = credits', 'Status'],
    rows: [['JE-2026-0912', '02 Sep 2026', 'Customer payment', 'Receipt PAY-2026-0118', 'UGX 96M', 'Posted'], ['JE-2026-0911', '01 Sep 2026', 'Supplier bill', 'Roofings Uganda BILL-7741', 'UGX 126.2M', 'Posted'], ['JE-2026-0910', '31 Aug 2026', 'Invoice', 'Invoice INV-2026-0201', 'UGX 142.8M', 'Draft'], ['JE-2026-0909', '31 Aug 2026', 'Payroll', 'August payroll accrual', 'UGX 86.7M', 'Approved']],
  },
  {
    slug: 'banking', title: 'Banking & reconciliation', eyebrow: 'Ledger to statement',
    description: 'Manage bank accounts, cheque controls, statement imports, suggested matches, exceptions, and signed-off reconciliations.',
    primaryAction: 'Import statement', secondaryAction: 'New reconciliation', tabs: ['Accounts', 'Transactions', 'Reconciliations', 'Cheques', 'Matching rules'],
    workflow: ['Import', 'Analyse', 'Suggest', 'Confirm', 'Resolve', 'Finalise'],
    stats: [{ label: 'Ledger balance', value: 'UGX 742.6M', note: 'Across 4 active accounts' }, { label: 'Unmatched items', value: '7', note: 'UGX 22.8M net value' }, { label: 'Accounts reconciled', value: '3 / 4', note: 'To 31 Aug 2026' }, { label: 'Cheques in transit', value: 'UGX 48.2M', note: '4 issued cheques' }],
    columns: ['Date', 'Bank / account', 'Description', 'Reference', 'Amount', 'Match'],
    rows: [['02 Sep 2026', 'Stanbic · 0421', 'JMS customer payment', 'FT2634518', '+ UGX 96M', 'Suggested'], ['01 Sep 2026', 'Centenary · 1884', 'Roofings supplier payment', 'CHQ-00481', '- UGX 72M', 'Matched'], ['31 Aug 2026', 'Stanbic · 0421', 'Monthly bank charges', 'CHG-0826', '- UGX 480K', 'Unmatched'], ['30 Aug 2026', 'DFCU · 9012', 'Director contribution', 'FT2629821', '+ UGX 40M', 'Matched']],
  },
  {
    slug: 'payroll', title: 'Payroll & HR', eyebrow: 'People and payroll',
    description: 'Maintain employee records and configurable earnings, deductions, approvals, payslips, payment, and ledger posting.',
    primaryAction: 'New employee', secondaryAction: 'Run payroll', tabs: ['Employees', 'Payroll runs', 'Components', 'Payslips', 'Rules'],
    workflow: ['Draft', 'Calculate', 'Review', 'Approve', 'Pay', 'Post'],
    stats: [{ label: 'Active employees', value: '42', note: '6 departments' }, { label: 'August gross payroll', value: 'UGX 102.4M', note: 'UGX 86.7M net pay' }, { label: 'Pending approvals', value: '1', note: 'September draft run' }, { label: 'Project labour MTD', value: 'UGX 38.2M', note: 'Allocated to 7 projects' }],
    columns: ['Employee', 'Department', 'Job title', 'Payment method', 'Current run', 'Status'],
    rows: [['SA-0042 · Daniel Okello', 'Projects', 'Senior Site Engineer', 'Stanbic Bank', 'UGX 4.8M', 'Active'], ['SA-0036 · Grace Namusoke', 'Procurement', 'Procurement Officer', 'Centenary Bank', 'UGX 3.6M', 'Active'], ['SA-0029 · Irene Adoch', 'Bids', 'Tender Specialist', 'Mobile money', 'UGX 3.2M', 'Active'], ['SA-0018 · Moses Kato', 'Operations', 'Warehouse Supervisor', 'DFCU Bank', 'UGX 2.7M', 'Active']],
  },
  {
    slug: 'documents', title: 'Documents & OCR', eyebrow: 'Evidence, extracted',
    description: 'Securely store business evidence, extract receipt and invoice fields, review results, and link originals to any business record.',
    primaryAction: 'Upload document', secondaryAction: 'OCR review queue', tabs: ['All documents', 'OCR queue', 'Needs review', 'Verified', 'Folders'],
    workflow: ['Upload', 'Process', 'Extract', 'Review', 'Confirm', 'Link'],
    stats: [{ label: 'Documents', value: '1,284', note: '18.6 GB secured in storage' }, { label: 'Awaiting OCR', value: '3', note: 'Development OCR provider' }, { label: 'Needs review', value: '7', note: 'Low-confidence extractions' }, { label: 'Verified this month', value: '186', note: '98.2% completion rate' }],
    columns: ['Document', 'Type', 'Linked record', 'Uploaded', 'OCR status', 'Verification'],
    rows: [['delivery-note-024-18.pdf', 'Delivery note', 'PO-2026-0098', '02 Sep 2026', 'Confirmed', 'Verified'], ['receipt-kampala-hardware.jpg', 'Receipt', 'SA-PRJ-024', '02 Sep 2026', 'Needs review', 'Pending'], ['work-certificate-04.pdf', 'Work certificate', 'INV-2026-0184', '01 Sep 2026', 'Not required', 'Verified'], ['roofings-invoice-7741.pdf', 'Supplier invoice', 'BILL-2026-0082', '01 Sep 2026', 'Extracted', 'Pending']],
  },
  {
    slug: 'reports', title: 'Reports centre', eyebrow: 'Decision-ready reporting',
    description: 'Generate filtered financial, sales, procurement, project, bid, banking, payroll, tax, and inventory reports.',
    primaryAction: 'Generate report', secondaryAction: 'Schedule report', tabs: ['Financial', 'Sales', 'Purchases', 'Projects', 'Bids', 'Banking', 'Payroll', 'Tax', 'Inventory'],
    stats: [{ label: 'Report packs', value: '24', note: 'Across 9 reporting areas' }, { label: 'Scheduled reports', value: '6', note: 'Next delivery Friday 08:00' }, { label: 'Exports this month', value: '38', note: 'PDF, Excel and CSV' }, { label: 'Current period', value: 'FY 2026', note: 'Jan–Dec · open' }],
    columns: ['Report', 'Area', 'Last generated', 'Format', 'Owner', 'Status'],
    rows: [['Monthly management accounts', 'Financial', '01 Sep 2026', 'PDF + Excel', 'Finance Admin', 'Ready'], ['Project profitability pack', 'Projects', '01 Sep 2026', 'PDF', 'Director', 'Ready'], ['Receivables aging', 'Sales', '02 Sep 2026', 'Excel', 'Accountant', 'Ready'], ['VAT period summary', 'Tax', '31 Aug 2026', 'PDF + CSV', 'Finance Admin', 'Draft']],
  },
  {
    slug: 'calendar', title: 'Operational calendar', eyebrow: 'Dates that matter',
    description: 'Bring bid deadlines, payment dates, milestones, retention releases, payroll, tax, and material deliveries into one view.',
    primaryAction: 'New event', secondaryAction: 'Calendar settings', tabs: ['Month', 'Week', 'Agenda', 'Deadlines'],
    stats: [{ label: 'This week', value: '18 events', note: '7 payment-related' }, { label: 'Bid deadlines', value: '3', note: 'Next closes 05 Sep' }, { label: 'Expected receipts', value: 'UGX 288M', note: 'Across 4 customers' }, { label: 'Milestones', value: '5', note: '2 require approval' }],
    columns: ['Date', 'Event', 'Category', 'Related record', 'Owner', 'Status'],
    rows: [['05 Sep · 11:00', 'Mbarara hospital bid closes', 'Bid deadline', 'MOH/SUPLS/26/114', 'Irene Adoch', 'Due soon'], ['07 Sep · 09:00', 'Jinja site progress review', 'Project milestone', 'SA-PRJ-024', 'Daniel Okello', 'Scheduled'], ['09 Sep · All day', 'Supplier payment due', 'Accounts payable', 'BILL-2026-0082', 'Finance', 'Due'], ['12 Sep · All day', 'Retention release eligible', 'Retention', 'SA-PRJ-019', 'Finance', 'Upcoming']],
  },
  {
    slug: 'notifications', title: 'Notifications', eyebrow: 'Actionable alerts',
    description: 'A permission-aware centre for deadlines, overdue money, approvals, stock, payroll, tax, OCR, and project exceptions.',
    primaryAction: 'Notification settings', tabs: ['All', 'Unread', 'Finance', 'Projects', 'Approvals'],
    stats: [{ label: 'Unread', value: '12', note: '3 high priority' }, { label: 'Approvals', value: '5', note: 'Oldest pending 2 days' }, { label: 'Financial alerts', value: '8', note: 'Invoices, bills and tax' }, { label: 'Operational alerts', value: '6', note: 'Projects, bids and stock' }],
    columns: ['Received', 'Notification', 'Category', 'Related record', 'Priority', 'Status'],
    rows: [['24 min ago', 'Payment received and allocated', 'Payments', 'PAY-2026-0118', 'Normal', 'Unread'], ['1 hr ago', 'Purchase order awaiting your approval', 'Approval', 'PO-2026-0102', 'High', 'Unread'], ['2 hrs ago', 'Bid checklist has 5 missing documents', 'Bids', 'MOH/SUPLS/26/114', 'High', 'Read'], ['Yesterday', 'Retention is now eligible for release', 'Retention', 'SA-PRJ-019', 'Normal', 'Read']],
  },
  {
    slug: 'administration', title: 'Administration', eyebrow: 'Control and governance',
    description: 'Manage users, granular roles, approval thresholds, tax rules, workflow stages, audit trails, migrations, and backups.',
    primaryAction: 'Invite user', secondaryAction: 'New role', tabs: ['Users', 'Roles & permissions', 'Approvals', 'Tax rules', 'Workflows', 'Audit log', 'Backups', 'Migration'],
    stats: [{ label: 'Active users', value: '18', note: 'Across 9 default roles' }, { label: 'Roles', value: '9', note: '146 permission grants' }, { label: 'Pending approvals', value: '5', note: '2 above manager threshold' }, { label: 'Last verified backup', value: 'Today', note: '02 Sep · 02:00 EAT' }],
    columns: ['User', 'Role', 'Department', 'Last active', 'MFA / identity', 'Status'],
    rows: [['Amina Nsubuga', 'Director', 'Management', 'Now', 'Workspace identity', 'Active'], ['Peter Mugisha', 'Finance Admin', 'Finance', '18 min ago', 'Workspace identity', 'Active'], ['Grace Namusoke', 'Procurement Officer', 'Procurement', '1 hr ago', 'Workspace identity', 'Active'], ['Daniel Okello', 'Project Manager', 'Projects', '2 hrs ago', 'Workspace identity', 'Active']],
  },
  {
    slug: 'integrations', title: 'Integrations', eyebrow: 'Provider architecture',
    description: 'Configure replaceable providers for email, OCR, file storage, bid discovery, bank data, backups, and QuickBooks migration.',
    primaryAction: 'Configure provider', tabs: ['Providers', 'Email', 'OCR', 'Storage', 'Bid sources', 'Bank data', 'QuickBooks'],
    stats: [{ label: 'Connected providers', value: '2', note: 'Workspace auth and object storage' }, { label: 'Development adapters', value: '4', note: 'Email, OCR, bids and bank import' }, { label: 'Needs credentials', value: '5', note: 'Production providers' }, { label: 'Health checks', value: '7 / 7', note: 'Interfaces responding' }],
    columns: ['Capability', 'Provider', 'Mode', 'Last check', 'Configuration', 'Status'],
    rows: [['Authentication', 'ChatGPT workspace identity', 'Live', 'Now', 'Platform managed', 'Connected'], ['File storage', 'Cloudflare R2', 'Live on hosting', 'Now', 'Binding: FILES', 'Ready'], ['Email', 'Development outbox', 'Development', '1 hr ago', 'SMTP/API key required', 'Demo'], ['OCR', 'Deterministic extractor', 'Development', '2 hrs ago', 'Production provider required', 'Demo']],
  },
  {
    slug: 'settings', title: 'Company settings', eyebrow: 'Star Africa defaults',
    description: 'Configure company identity, currency, fiscal periods, numbering, retention defaults, notifications, and document policies.',
    primaryAction: 'Save settings', tabs: ['Company', 'Finance', 'Numbering', 'Retention', 'Documents', 'Notifications'],
    stats: [{ label: 'Base currency', value: 'UGX', note: 'Multi-currency ready' }, { label: 'Country', value: 'Uganda', note: 'Africa/Kampala timezone' }, { label: 'Financial year', value: 'Jan–Dec', note: 'FY 2026 currently open' }, { label: 'Retention default', value: '5%', note: 'Override allowed per contract' }],
    columns: ['Setting', 'Current value', 'Scope', 'Updated by', 'Updated', 'Status'],
    rows: [['Base currency', 'UGX', 'Company', 'Finance Admin', '12 Aug 2026', 'Active'], ['Default retention', '5%', 'Projects', 'Director', '12 Aug 2026', 'Active'], ['Invoice numbering', 'INV-{YYYY}-{####}', 'Finance', 'Finance Admin', '03 Jul 2026', 'Active'], ['Document retention', '7 years', 'Documents', 'Super Admin', '03 Jul 2026', 'Active']],
  },
  {
    slug: 'suppliers', title: 'Suppliers', eyebrow: 'Supplier intelligence',
    description: 'Maintain vetted supplier profiles, credit terms, purchase history, documents, performance, banking metadata, and outstanding obligations.',
    primaryAction: 'New supplier', secondaryAction: 'Supplier statement', tabs: ['Suppliers', 'Contacts', 'Credit exposure', 'Performance', 'Documents'],
    stats: [{ label: 'Active suppliers', value: '46', note: 'Across 12 categories' }, { label: 'Purchased YTD', value: 'UGX 2.84B', note: '186 purchase orders' }, { label: 'Outstanding credit', value: 'UGX 428.3M', note: 'UGX 88.4M due this week' }, { label: 'Average delivery', value: '6.8 days', note: '91% on-time delivery' }],
    columns: ['Code', 'Supplier', 'Categories', 'Credit terms', 'Outstanding', 'Status'],
    rows: [['SUP-0008', 'Roofings Uganda Demo', 'Steel, roofing', '30 days', 'UGX 126.2M', 'Active'], ['SUP-0014', 'Kampala Hardware Supplies Demo', 'General hardware', '14 days', 'UGX 42.8M', 'Active'], ['SUP-0021', 'Nile Lab Solutions Demo', 'Laboratory equipment', '45 days', 'UGX 184M', 'Active'], ['SUP-0033', 'Pearl Office Furnishers Demo', 'Furniture', '30 days', 'UGX 75.3M', 'Review due']],
  },
];

export const moduleBySlug = (slug: string) => modules.find((item) => item.slug === slug);
