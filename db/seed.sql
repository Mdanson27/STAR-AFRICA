PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO companies (id,name,country_code,base_currency,timezone,created_at,updated_at) VALUES
('company-star-africa','Star Africa','UG','UGX','Africa/Kampala',1788328800000,1788328800000);

INSERT OR IGNORE INTO users (id,company_id,external_identity_id,email,display_name,department,status,created_at,updated_at) VALUES
('user-admin','company-star-africa','demo-admin','admin@starafrica.demo','Samuel Kato','Administration','active',1788328800000,1788328800000),
('user-director','company-star-africa','demo-director','director@starafrica.demo','Amina Nsubuga','Management','active',1788328800000,1788328800000),
('user-finance','company-star-africa','demo-finance','finance@starafrica.demo','Peter Mugisha','Finance','active',1788328800000,1788328800000),
('user-accountant','company-star-africa','demo-accountant','accountant@starafrica.demo','Ruth Namayanja','Finance','active',1788328800000,1788328800000),
('user-bids','company-star-africa','demo-bids','bids@starafrica.demo','Irene Adoch','Bids & Tenders','active',1788328800000,1788328800000),
('user-projects','company-star-africa','demo-projects','projects@starafrica.demo','Daniel Okello','Projects','active',1788328800000,1788328800000),
('user-procurement','company-star-africa','demo-procurement','procurement@starafrica.demo','Grace Namusoke','Procurement','active',1788328800000,1788328800000),
('user-hr','company-star-africa','demo-hr','hr@starafrica.demo','Sarah Nabwire','People','active',1788328800000,1788328800000),
('user-auditor','company-star-africa','demo-auditor','auditor@starafrica.demo','Joel Ssemanda','Audit','active',1788328800000,1788328800000);

UPDATE users SET external_identity_id='demo-director',email='director@starafrica.demo',display_name='Amina Nsubuga',department='Management' WHERE id='user-director';
UPDATE users SET external_identity_id='demo-finance',email='finance@starafrica.demo',display_name='Peter Mugisha',department='Finance' WHERE id='user-finance';
UPDATE users SET external_identity_id='demo-projects',email='projects@starafrica.demo',display_name='Daniel Okello',department='Projects' WHERE id='user-projects';
UPDATE users SET external_identity_id='demo-procurement',email='procurement@starafrica.demo',display_name='Grace Namusoke',department='Procurement' WHERE id='user-procurement';

INSERT OR IGNORE INTO roles (id,company_id,name,description,read_only,created_at,updated_at) VALUES
('role-super','company-star-africa','SUPER ADMIN','Full platform administration',0,1788328800000,1788328800000),
('role-director','company-star-africa','DIRECTOR','Executive visibility and approvals',0,1788328800000,1788328800000),
('role-finance','company-star-africa','FINANCE ADMIN','Finance, banking and reporting',0,1788328800000,1788328800000),
('role-accountant','company-star-africa','ACCOUNTANT','Accounting and reconciliation',0,1788328800000,1788328800000),
('role-procurement','company-star-africa','PROCUREMENT OFFICER','Procurement and supplier operations',0,1788328800000,1788328800000),
('role-project','company-star-africa','PROJECT MANAGER','Project delivery and budgets',0,1788328800000,1788328800000),
('role-site','company-star-africa','SITE MANAGER','Site operations',0,1788328800000,1788328800000),
('role-bids','company-star-africa','BIDS & TENDERS OFFICER','Bid discovery and submissions',0,1788328800000,1788328800000),
('role-hr','company-star-africa','HR / PAYROLL','Employees and payroll',0,1788328800000,1788328800000),
('role-auditor','company-star-africa','AUDITOR / VIEWER','Read-only permitted information',1,1788328800000,1788328800000);

UPDATE roles SET name='BIDS & TENDERS OFFICER' WHERE id='role-bids';
UPDATE roles SET name='HR / PAYROLL' WHERE id='role-hr';
UPDATE roles SET name='AUDITOR / VIEWER' WHERE id='role-auditor';

INSERT OR IGNORE INTO user_roles (user_id,role_id,assigned_at) VALUES
('user-admin','role-super',1788328800000),('user-director','role-director',1788328800000),('user-finance','role-finance',1788328800000),('user-accountant','role-accountant',1788328800000),('user-bids','role-bids',1788328800000),('user-projects','role-project',1788328800000),('user-procurement','role-procurement',1788328800000),('user-hr','role-hr',1788328800000),('user-auditor','role-auditor',1788328800000);

INSERT OR IGNORE INTO permissions (id,code,description) VALUES
('perm-bids-view','bids.view','View permitted bid records'),('perm-bids-create','bids.create','Create opportunities'),('perm-bids-edit','bids.edit','Edit opportunities'),('perm-bids-delete','bids.delete','Delete bids'),('perm-bids-archive','bids.archive','Archive bids'),('perm-bids-qualify','bids.qualify','Prepare qualification assessment'),('perm-bids-assign','bids.assign','Assign bid ownership'),('perm-bids-submit','bids.submit','Record final submission'),('perm-bids-approve','bids.approve','Approve bid decisions'),('perm-bids-award','bids.award','Record award or loss'),('perm-bids-docs-view','bids.documents.view','View bid documents'),('perm-bids-docs-upload','bids.documents.upload','Upload bid documents'),('perm-bids-docs-verify','bids.documents.verify','Verify bid documents'),('perm-bids-exp-view','bids.expenses.view','View bid expenses'),('perm-bids-exp-create','bids.expenses.create','Create bid expenses'),('perm-bids-exp-approve','bids.expenses.approve','Approve bid expenses'),('perm-bids-financials','bids.financials.view','View bid financials'),('perm-bids-pricing','bids.pricing.edit','Edit bid pricing'),('perm-bids-security','bids.security.manage','Manage bid security'),('perm-bids-team','bids.team.manage','Manage bid team'),('perm-bids-settings','bids.settings.manage','Manage bid settings'),('perm-bids-export','bids.export','Export bid data'),('perm-bids-audit','bids.audit.view','View bid audit records'),('perm-bids-analytics','bids.analytics.view','View bid analytics');

INSERT OR IGNORE INTO role_permissions (role_id,permission_id)
SELECT 'role-super',id FROM permissions;
INSERT OR IGNORE INTO role_permissions (role_id,permission_id)
SELECT 'role-director',id FROM permissions WHERE code IN ('bids.view','bids.financials.view','bids.expenses.view','bids.approve','bids.award','bids.analytics.view','bids.export','bids.audit.view');
INSERT OR IGNORE INTO role_permissions (role_id,permission_id)
SELECT 'role-bids',id FROM permissions WHERE code IN ('bids.view','bids.create','bids.edit','bids.qualify','bids.assign','bids.submit','bids.documents.view','bids.documents.upload','bids.documents.verify','bids.expenses.view','bids.expenses.create','bids.financials.view','bids.pricing.edit','bids.team.manage','bids.export','bids.analytics.view');
INSERT OR IGNORE INTO role_permissions (role_id,permission_id)
SELECT 'role-finance',id FROM permissions WHERE code IN ('bids.view','bids.financials.view','bids.expenses.view','bids.expenses.approve','bids.security.manage','bids.analytics.view','bids.export');
INSERT OR IGNORE INTO role_permissions (role_id,permission_id)
SELECT 'role-accountant',id FROM permissions WHERE code IN ('bids.view','bids.expenses.view','bids.financials.view','bids.export');
INSERT OR IGNORE INTO role_permissions (role_id,permission_id)
SELECT 'role-project',id FROM permissions WHERE code IN ('bids.view','bids.documents.view');
INSERT OR IGNORE INTO role_permissions (role_id,permission_id)
SELECT 'role-procurement',id FROM permissions WHERE code IN ('bids.view','bids.documents.view');
INSERT OR IGNORE INTO role_permissions (role_id,permission_id)
SELECT 'role-auditor',id FROM permissions WHERE code IN ('bids.view','bids.documents.view','bids.expenses.view','bids.financials.view','bids.audit.view','bids.export');

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

UPDATE bids SET id='moh-lab-2026' WHERE id='bid-moh-lab' AND reference='MOH/SUPLS/26/114';

INSERT OR IGNORE INTO bids (id,company_id,reference,title,organization,description,category,subcategory,source,source_url,location,procurement_method,published_at,clarification_deadline,closes_at,expected_award_at,currency,estimated_value_minor,tender_fee_minor,security_required,bid_validity_days,priority,status,assigned_to,created_at,updated_at) VALUES
('moh-lab-2026','company-star-africa','MOH/SUPLS/26/114','National laboratory equipment framework','Ministry of Health','Supply, installation and commissioning of laboratory equipment for regional referral hospitals.','Laboratory equipment','Diagnostic equipment','Manual',NULL,'Kampala & regional hospitals','Open domestic bidding',1785650400000,1788422400000,1788598800000,1793154000000,'UGX','152000000000','25000000',1,120,'critical','ready_for_submission','user-bids',1785650400000,1788328800000);

INSERT OR IGNORE INTO bids (id,company_id,reference,title,organization,description,category,source,location,procurement_method,published_at,closes_at,expected_award_at,currency,estimated_value_minor,priority,status,assigned_to,created_at,updated_at) VALUES
('kcca-drainage-2026','company-star-africa','KCCA/WRKS/26/044','Drainage rehabilitation — Lot 2','Kampala Capital City Authority','Rehabilitation of priority drainage channels and associated civil works.','Construction','CSV Import','Kampala','Open domestic bidding',1786482000000,1789110000000,1794704400000,'UGX','286000000000','high','preparing','user-bids',1786482000000,1788328800000),
('unicef-furniture-2026','company-star-africa','UNICEF/UGA/2026/881','School furniture supply framework','UNICEF Uganda','Manufacture and delivery of durable classroom desks and teacher furniture.','Furniture','Demo Provider','Northern Uganda','Request for proposal',1787173200000,1789801200000,1795996800000,'UGX','94000000000','medium','qualification','user-bids',1787173200000,1788328800000),
('nwsc-refurb-2026','company-star-africa','NWSC/CONS/26/209','Regional office refurbishment','National Water & Sewerage Corporation','Interior refurbishment, furniture and electrical works.','Construction','Manual','Mbarara','Open domestic bidding',1787691600000,1790409600000,1796691600000,'UGX','68000000000','medium','reviewing','user-bids',1787691600000,1788328800000),
('jms-medical-2026','company-star-africa','JMS/MED/2026/031','Essential medical supplies distribution','Joint Medical Store','Supply and distribution of consumable medical products.','Medical supplies','CSV Import','Uganda','Open international bidding',1782853200000,1787900400000,1789765200000,'UGX','211000000000','high','awaiting_result','user-bids',1782853200000,1788328800000),
('muk-library-2026','company-star-africa','MAK/SUPLS/25/192','Library shelving and study furniture','Makerere University','Supply and installation of shelving and study furniture.','Furniture','Manual','Kampala','Open domestic bidding',1777932000000,1781766000000,1786482000000,'UGX','43000000000','medium','won','user-bids',1777932000000,1788328800000),
('gulu-works-2026','company-star-africa','GCC/WRKS/25-26/072','Municipal market maintenance works','Gulu City Council','Maintenance and safety upgrades at municipal markets.','Construction','Manual','Gulu','Open domestic bidding',1779141600000,1780038000000,1784494800000,'UGX','57000000000','low','lost','user-bids',1779141600000,1788328800000),
('unra-ppe-2026','company-star-africa','UNRA/SUPLS/25-26/318','Protective equipment supply','Uganda National Roads Authority','Standards-compliant PPE for road maintenance teams.','General supply','Demo Provider','Uganda','Request for quotations',1772920800000,1776157200000,1782075600000,'UGX','31500000000','low','archived','user-bids',1772920800000,1788328800000);

INSERT OR IGNORE INTO bid_requirements (id,bid_id,requirement,description,category,required,owner_id,due_at,status,uploaded,verified,verified_by,verified_at,notes,created_at,updated_at) VALUES
('req-incorp','moh-lab-2026','Certificate of incorporation','Current certified company registration','company_documentation',1,'user-bids',1788426000000,'verified',1,1,'user-bids',1788249600000,NULL,1787000000000,1788249600000),
('req-tax','moh-lab-2026','URA tax clearance certificate','Valid tax clearance','tax',1,'user-finance',1788426000000,'verified',1,1,'user-finance',1788249600000,NULL,1787000000000,1788249600000),
('req-nssf','moh-lab-2026','NSSF clearance','Current employer clearance','legal',1,'user-hr',1788426000000,'ready_for_review',1,0,NULL,NULL,NULL,1787000000000,1788249600000),
('req-auth','moh-lab-2026','Manufacturer authorisations','Original authorisation letters','technical',1,'user-bids',1788512400000,'in_progress',0,0,NULL,NULL,NULL,1787000000000,1788249600000),
('req-bidform','moh-lab-2026','Signed bid form','Director-signed final bid form','submission',1,'user-director',1788595200000,'not_started',0,0,NULL,NULL,NULL,1787000000000,1788249600000);

INSERT OR IGNORE INTO bid_expenses (id,bid_id,expense_number,category,description,supplier_payee,currency,amount_minor,tax_minor,payment_method,approval_status,accounting_status,incurred_at,created_by,created_at,updated_at) VALUES
('exp-moh-1','moh-lab-2026','BEX-2026-041','Tender document','Tender document fee','Ministry cashier','UGX','25000000','0','cash','paid','posted',1787299200000,'user-bids',1787299200000,1787299200000),
('exp-moh-2','moh-lab-2026','BEX-2026-047','Bid security fee','Bank guarantee issuance fee','Demo Bank Uganda','UGX','215000000','0','bank_transfer','submitted','unposted',1787896800000,'user-bids',1787896800000,1787896800000);

INSERT OR IGNORE INTO bid_qualifications (id,bid_id,score_basis_points,recommendation,status,decision,decision_reason,prepared_by,decided_by,decided_at,created_at,updated_at) VALUES
('qual-moh','moh-lab-2026',8600,'pursue','approved','approved_to_pursue','Strong strategic fit and proven delivery experience.','user-bids','user-director',1787126400000,1786867200000,1787126400000);
INSERT OR IGNORE INTO bid_securities (id,bid_id,type,issuer,security_number,amount_minor,currency,issue_date,expiry_date,validity_days,beneficiary,fee_minor,status,return_expected_at,created_at,updated_at) VALUES
('security-moh','moh-lab-2026','bank_guarantee','Demo Bank Uganda','BG-2026-00881','3040000000','UGX',1787896800000,1799010000000,120,'Ministry of Health','215000000','active',1799096400000,1787896800000,1787896800000);
INSERT OR IGNORE INTO bid_approvals (id,bid_id,type,approver_id,decision,comments,decided_at,created_at) VALUES
('approval-moh-pursuit','moh-lab-2026','pursuit','user-director','approved','Strong fit and acceptable exposure.',1787126400000,1787126400000),
('approval-moh-pricing','moh-lab-2026','pricing','user-finance','approved','Margin and tax treatment reviewed.',1788324120000,1788324120000),
('approval-moh-final','moh-lab-2026','final_submission','user-director','pending',NULL,NULL,1788328800000);
INSERT OR IGNORE INTO bid_activities (id,bid_id,actor_id,action,linked_entity_type,linked_entity_id,summary,occurred_at) VALUES
('activity-moh-1','moh-lab-2026','user-bids','bid.created','bid','moh-lab-2026','Opportunity created from manual provider.',1785650400000),
('activity-moh-2','moh-lab-2026','user-director','bid.pursuit.approved','bid_approval','approval-moh-pursuit','Pursuit approved.',1787126400000),
('activity-moh-3','moh-lab-2026','user-finance','bid.pricing.approved','bid_approval','approval-moh-pricing','Financial proposal v6 approved.',1788324120000);
INSERT OR IGNORE INTO notifications (id,company_id,user_id,type,title,message,entity_type,entity_id,priority,created_at) VALUES
('notification-bid-deadline','company-star-africa','user-bids','bid.deadline','Submission approaching','MOH/SUPLS/26/114 closes within 3 days.','bid','moh-lab-2026','high',1788328800000),
('notification-bid-approval','company-star-africa','user-director','bid.approval_required','Final approval required','National laboratory equipment framework is awaiting final approval.','bid','moh-lab-2026','high',1788328800000),
('notification-security','company-star-africa','user-finance','bid.security','Bid security active','BG-2026-00881 is active and tracked through expiry.','bid','moh-lab-2026','normal',1788328800000);

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
