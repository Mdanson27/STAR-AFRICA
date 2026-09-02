PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO companies (id,name,country_code,base_currency,timezone,created_at,updated_at) VALUES
('company-star-africa','Star Africa','UG','UGX','Africa/Kampala',1788328800000,1788328800000);

INSERT OR IGNORE INTO users (id,company_id,external_identity_id,email,display_name,department,status,created_at,updated_at) VALUES
('user-director','company-star-africa','demo-director','amina.nsubuga@example.test','Amina Nsubuga','Management','active',1788328800000,1788328800000),
('user-finance','company-star-africa','demo-finance','peter.mugisha@example.test','Peter Mugisha','Finance','active',1788328800000,1788328800000),
('user-procurement','company-star-africa','demo-procurement','grace.namusoke@example.test','Grace Namusoke','Procurement','active',1788328800000,1788328800000),
('user-projects','company-star-africa','demo-projects','daniel.okello@example.test','Daniel Okello','Projects','active',1788328800000,1788328800000);

INSERT OR IGNORE INTO roles (id,company_id,name,description,read_only,created_at,updated_at) VALUES
('role-super','company-star-africa','SUPER ADMIN','Full platform administration',0,1788328800000,1788328800000),
('role-director','company-star-africa','DIRECTOR','Executive visibility and approvals',0,1788328800000,1788328800000),
('role-finance','company-star-africa','FINANCE ADMIN','Finance, banking and reporting',0,1788328800000,1788328800000),
('role-accountant','company-star-africa','ACCOUNTANT','Accounting and reconciliation',0,1788328800000,1788328800000),
('role-procurement','company-star-africa','PROCUREMENT OFFICER','Procurement and supplier operations',0,1788328800000,1788328800000),
('role-project','company-star-africa','PROJECT MANAGER','Project delivery and budgets',0,1788328800000,1788328800000),
('role-site','company-star-africa','SITE MANAGER','Site operations',0,1788328800000,1788328800000),
('role-bids','company-star-africa','BIDS/TENDER OFFICER','Bid discovery and submissions',0,1788328800000,1788328800000),
('role-hr','company-star-africa','HR/PAYROLL','Employees and payroll',0,1788328800000,1788328800000),
('role-auditor','company-star-africa','AUDITOR/VIEWER','Read-only permitted information',1,1788328800000,1788328800000);

INSERT OR IGNORE INTO user_roles (user_id,role_id,assigned_at) VALUES
('user-director','role-director',1788328800000),('user-finance','role-finance',1788328800000),('user-procurement','role-procurement',1788328800000),('user-projects','role-project',1788328800000);

INSERT OR IGNORE INTO project_stages (id,company_id,name,sequence,enabled,created_at,updated_at) VALUES
('stage-award','company-star-africa','Award / Contract Stage',10,1,1788328800000,1788328800000),
('stage-handover','company-star-africa','Site Handover',20,1,1788328800000,1788328800000),
('stage-materials','company-star-africa','Secure Materials',30,1,1788328800000,1788328800000),
('stage-labour','company-star-africa','Labour Mobilisation',40,1,1788328800000,1788328800000),
('stage-execution','company-star-africa','Work Execution',50,1,1788328800000,1788328800000),
('stage-testing','company-star-africa','Testing / Completion',60,1,1788328800000,1788328800000),
('stage-retention','company-star-africa','Retention',70,1,1788328800000,1788328800000),
('stage-closed','company-star-africa','Closed',80,1,1788328800000,1788328800000);

INSERT OR IGNORE INTO customers (id,company_id,code,name,tin,email,phone,address,status,created_at,updated_at) VALUES
('customer-moh','company-star-africa','CUS-0012','Ministry of Health',NULL,'procurement@example.test','+256 000 000001','Kampala, Uganda','active',1788328800000,1788328800000),
('customer-gulu','company-star-africa','CUS-0007','Gulu City Council',NULL,'finance@example.test','+256 000 000002','Gulu, Uganda','active',1788328800000,1788328800000),
('customer-jms','company-star-africa','CUS-0019','Joint Medical Store',NULL,'accounts@example.test','+256 000 000003','Nsambya, Kampala','active',1788328800000,1788328800000),
('customer-wakiso','company-star-africa','CUS-0004','Wakiso District Local Government',NULL,'works@example.test','+256 000 000004','Wakiso, Uganda','active',1788328800000,1788328800000);

INSERT OR IGNORE INTO suppliers (id,company_id,code,name,tin,vat_registered,credit_terms_days,email,phone,status,created_at,updated_at) VALUES
('supplier-roofings','company-star-africa','SUP-0008','Roofings Uganda Demo',NULL,1,30,'sales@example.test','+256 000 100001','active',1788328800000,1788328800000),
('supplier-hardware','company-star-africa','SUP-0014','Kampala Hardware Supplies Demo',NULL,1,14,'orders@example.test','+256 000 100002','active',1788328800000,1788328800000);

INSERT OR IGNORE INTO bids (id,company_id,reference,title,organization,category,source,source_url,published_at,closes_at,currency,estimated_value_minor,status,assigned_to,created_at,updated_at) VALUES
('bid-moh-lab','company-star-africa','MOH/SUPLS/26/114','Laboratory equipment framework','Ministry of Health','Laboratory equipment','Manual',NULL,1785650400000,1788598800000,'UGX','1520000000','preparing','user-director',1785650400000,1788328800000);

INSERT OR IGNORE INTO projects (id,company_id,code,name,customer_id,bid_id,category,location,contract_currency,contract_value_minor,budget_minor,retention_basis_points,starts_at,planned_completion_at,stage_id,status,completion_basis_points,project_manager_id,created_at,updated_at) VALUES
('project-jinja','company-star-africa','SA-PRJ-024','Jinja Laboratory Refurbishment','customer-moh',NULL,'Construction','Jinja','UGX','1180000000','890000000',500,1777586400000,1798678800000,'stage-execution','active',6800,'user-projects',1777586400000,1788328800000),
('project-gulu','company-star-africa','SA-PRJ-021','Gulu Municipal Office Fit-out','customer-gulu',NULL,'Furniture and construction','Gulu','UGX','1540000000','1240000000',500,1769907600000,1785531600000,'stage-execution','active',8200,'user-projects',1769907600000,1788328800000);

INSERT OR IGNORE INTO fiscal_years (id,company_id,name,starts_at,ends_at,status,created_at,updated_at) VALUES
('fy-2026','company-star-africa','FY 2026',1767229200000,1798765199000,'open',1767229200000,1788328800000);
INSERT OR IGNORE INTO accounting_periods (id,fiscal_year_id,name,starts_at,ends_at,status,locked_by,locked_at) VALUES
('period-2026-09','fy-2026','September 2026',1788210000000,1790801999000,'open',NULL,NULL);

INSERT OR IGNORE INTO accounts (id,company_id,code,name,type,normal_balance,parent_id,active,created_at,updated_at) VALUES
('account-bank','company-star-africa','1010','Bank — Operating','asset','debit',NULL,1,1788328800000,1788328800000),
('account-ar','company-star-africa','1100','Accounts Receivable','asset','debit',NULL,1,1788328800000,1788328800000),
('account-retention','company-star-africa','1110','Retention Receivable','asset','debit',NULL,1,1788328800000,1788328800000),
('account-ap','company-star-africa','2000','Accounts Payable','liability','credit',NULL,1,1788328800000,1788328800000),
('account-vat','company-star-africa','2105','VAT Payable','liability','credit',NULL,1,1788328800000,1788328800000),
('account-revenue','company-star-africa','4000','Contract Revenue','income','credit',NULL,1,1788328800000,1788328800000),
('account-cos','company-star-africa','5000','Project Cost of Sales','cost_of_sales','debit',NULL,1,1788328800000,1788328800000),
('account-bid-expense','company-star-africa','6200','Bid Preparation Expense','expense','debit',NULL,1,1788328800000,1788328800000);

INSERT OR IGNORE INTO warehouses (id,company_id,code,name,location,active,created_at,updated_at) VALUES
('warehouse-namanve','company-star-africa','WH-NAM','Namanve Main Stores','Namanve Industrial Park',1,1788328800000,1788328800000);
INSERT OR IGNORE INTO inventory_items (id,company_id,sku,name,category,unit,quantity_minor,reserved_minor,reorder_level_minor,average_cost_minor,currency,tracks_batch,created_at,updated_at) VALUES
('item-cement','company-star-africa','MAT-CEM-001','Portland cement 42.5N','Construction','bag','8600','4400','12000','3850000','UGX',0,1788328800000,1788328800000),
('item-centrifuge','company-star-africa','LAB-CEN-014','Bench centrifuge 4000 rpm','Laboratory','unit','1800','1200','400','740000000','UGX',1,1788328800000,1788328800000);

INSERT OR IGNORE INTO invoices (id,company_id,number,customer_id,project_id,issue_date,due_date,currency,subtotal_minor,discount_minor,tax_minor,retention_minor,total_minor,paid_minor,status,journal_entry_id,created_at,updated_at) VALUES
('invoice-gulu-04','company-star-africa','INV-2026-0184','customer-gulu','project-gulu',1785704400000,1786914000000,'UGX','164830508','0','29669492','10000000','184500000','0','overdue',NULL,1785704400000,1788328800000);

INSERT OR IGNORE INTO tax_rules (id,company_id,name,code,basis_points,effective_at,applicability,inclusive,active,configuration_json,created_at,updated_at) VALUES
('tax-vat-demo','company-star-africa','VAT — configurable demo rate','VAT',1800,1767229200000,'sales_and_purchases',0,1,'{"notice":"Verify the current statutory rate before production use"}',1788328800000,1788328800000);

INSERT OR IGNORE INTO company_settings (id,company_id,key,value_json,updated_by,created_at,updated_at) VALUES
('setting-retention','company-star-africa','projects.defaultRetentionBasisPoints','500','user-director',1788328800000,1788328800000),
('setting-numbering','company-star-africa','finance.invoiceNumberPattern','"INV-{YYYY}-{####}"','user-finance',1788328800000,1788328800000);
