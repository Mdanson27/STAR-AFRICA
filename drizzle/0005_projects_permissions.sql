INSERT OR IGNORE INTO permissions (id,code,description) VALUES
('perm-dashboard-view','dashboard.executive.view','View executive dashboard'),
('perm-projects-view','projects.view','View projects'),('perm-projects-progress','projects.progress.edit','Update project progress'),
('perm-projects-team','projects.team.manage','Manage project teams'),('perm-projects-doc-view','projects.documents.view','View project documents'),
('perm-projects-doc-upload','projects.documents.upload','Upload project documents'),('perm-project-task-create','project_tasks.create','Create project tasks'),
('perm-project-task-edit','project_tasks.edit','Update project tasks'),('perm-project-ms-create','project_milestones.create','Create milestones'),
('perm-project-ms-edit','project_milestones.edit','Edit milestones'),('perm-project-ms-complete','project_milestones.complete','Complete milestones'),
('perm-project-ms-approve','project_milestones.approve','Approve milestones'),('perm-project-update-create','project_updates.create','Create site updates'),
('perm-project-material-view','project_materials.view','View project materials'),('perm-project-material-create','project_materials.create','Request and issue materials'),
('perm-project-expense-view','project_expenses.view','View project expenses'),('perm-project-expense-create','project_expenses.create','Create project expenses'),
('perm-project-budget-view','project_budget.view','View project budget'),('perm-project-budget-edit','project_budget.edit','Edit project budget'),
('perm-project-variation-create','project_variations.create','Create variations'),('perm-project-variation-approve','project_variations.approve','Approve variations'),
('perm-project-risk','project_risks.manage','Manage project risks'),('perm-project-issue','project_issues.manage','Manage project issues'),
('perm-project-labour','project_labour.create','Record project labour'),('perm-project-equipment','project_equipment.create','Record project equipment'),
('perm-project-certificate','project_certificates.create','Create project certificates'),('perm-project-invoice','project_invoices.create','Create project invoices'),
('perm-project-payment','project_payments.create','Record project payments'),('perm-project-retention','project_retention.manage','Manage project retention'),
('perm-project-audit','projects.audit.view','View project audit history'),
('perm-procurement-view','procurement.view','View procurement'),('perm-suppliers-view','suppliers.view','View suppliers'),
('perm-inventory-view','inventory.view','View inventory'),('perm-customers-view','customers.view','View customers'),
('perm-invoices-view','invoices.view','View invoices'),('perm-payments-view','payments.view','View payments'),
('perm-finance-view','finance.view','View finance'),('perm-banking-view','banking.view','View banking'),
('perm-payroll-view','payroll.view','View payroll'),('perm-documents-view','documents.view','View documents'),
('perm-reports-view','reports.view','View reports'),('perm-calendar-view','calendar.view','View calendar');
--> statement-breakpoint
INSERT OR IGNORE INTO role_permissions (role_id,permission_id)
SELECT 'role-director',id FROM permissions WHERE code IN (
'dashboard.executive.view','bids.view','projects.view','procurement.view','suppliers.view','inventory.view','customers.view','invoices.view','payments.view','finance.view','banking.view','payroll.view','documents.view','reports.view','calendar.view',
'projects.progress.edit','projects.team.manage','projects.documents.view','projects.documents.upload','project_tasks.create','project_tasks.edit','project_milestones.create','project_milestones.edit','project_milestones.complete','project_milestones.approve','project_updates.create','project_materials.view','project_materials.create','project_expenses.view','project_expenses.create','project_budget.view','project_budget.edit','project_variations.create','project_variations.approve','project_risks.manage','project_issues.manage','project_labour.create','project_equipment.create','project_certificates.create','project_invoices.create','project_payments.create','project_retention.manage','projects.audit.view');
--> statement-breakpoint
INSERT OR IGNORE INTO role_permissions (role_id,permission_id)
SELECT 'role-project',id FROM permissions WHERE code IN ('projects.view','projects.progress.edit','projects.team.manage','projects.documents.view','projects.documents.upload','project_tasks.create','project_tasks.edit','project_milestones.create','project_milestones.edit','project_milestones.complete','project_milestones.approve','project_updates.create','project_materials.view','project_materials.create','project_expenses.view','project_expenses.create','project_budget.view','project_budget.edit','project_variations.create','project_risks.manage','project_issues.manage','project_labour.create','project_equipment.create','project_certificates.create','documents.view');
