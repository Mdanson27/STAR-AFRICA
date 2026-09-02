INSERT OR IGNORE INTO companies (id,name,country_code,base_currency,timezone,created_at,updated_at) VALUES ('company-star-africa','Star Africa','UG','UGX','Africa/Kampala',1788328800000,1788328800000);
--> statement-breakpoint
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
--> statement-breakpoint
INSERT OR IGNORE INTO roles (id,company_id,name,description,read_only,created_at,updated_at) VALUES
('role-super','company-star-africa','SUPER ADMIN','Full platform administration',0,1788328800000,1788328800000),
('role-director','company-star-africa','DIRECTOR','Executive visibility and approvals',0,1788328800000,1788328800000),
('role-finance','company-star-africa','FINANCE ADMIN','Finance, security and expense approval',0,1788328800000,1788328800000),
('role-accountant','company-star-africa','ACCOUNTANT','Accounting review and reporting',0,1788328800000,1788328800000),
('role-bids','company-star-africa','BIDS & TENDERS OFFICER','Bid discovery and submissions',0,1788328800000,1788328800000),
('role-project','company-star-africa','PROJECT MANAGER','Won-bid handover visibility',0,1788328800000,1788328800000),
('role-procurement','company-star-africa','PROCUREMENT OFFICER','Tender supply requirements visibility',0,1788328800000,1788328800000),
('role-hr','company-star-africa','HR / PAYROLL','Employees and payroll',0,1788328800000,1788328800000),
('role-auditor','company-star-africa','AUDITOR / VIEWER','Read-only permitted information',1,1788328800000,1788328800000);
--> statement-breakpoint
INSERT OR IGNORE INTO user_roles (user_id,role_id,assigned_at) VALUES
('user-admin','role-super',1788328800000),('user-director','role-director',1788328800000),('user-finance','role-finance',1788328800000),('user-accountant','role-accountant',1788328800000),('user-bids','role-bids',1788328800000),('user-projects','role-project',1788328800000),('user-procurement','role-procurement',1788328800000),('user-hr','role-hr',1788328800000),('user-auditor','role-auditor',1788328800000);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id,code,description) VALUES
('perm-bids-view','bids.view','View permitted bid records'),('perm-bids-create','bids.create','Create opportunities'),('perm-bids-edit','bids.edit','Edit opportunities'),('perm-bids-delete','bids.delete','Delete bids'),('perm-bids-archive','bids.archive','Archive bids'),('perm-bids-qualify','bids.qualify','Prepare qualification assessment'),('perm-bids-assign','bids.assign','Assign bid ownership'),('perm-bids-submit','bids.submit','Record final submission'),('perm-bids-approve','bids.approve','Approve bid decisions'),('perm-bids-award','bids.award','Record award or loss'),('perm-bids-docs-view','bids.documents.view','View bid documents'),('perm-bids-docs-upload','bids.documents.upload','Upload bid documents'),('perm-bids-docs-verify','bids.documents.verify','Verify bid documents'),('perm-bids-exp-view','bids.expenses.view','View bid expenses'),('perm-bids-exp-create','bids.expenses.create','Create bid expenses'),('perm-bids-exp-approve','bids.expenses.approve','Approve bid expenses'),('perm-bids-financials','bids.financials.view','View bid financials'),('perm-bids-pricing','bids.pricing.edit','Edit bid pricing'),('perm-bids-security','bids.security.manage','Manage bid security'),('perm-bids-team','bids.team.manage','Manage bid team'),('perm-bids-settings','bids.settings.manage','Manage bid settings'),('perm-bids-export','bids.export','Export bid data'),('perm-bids-audit','bids.audit.view','View bid audit records'),('perm-bids-analytics','bids.analytics.view','View bid analytics');
--> statement-breakpoint
INSERT OR IGNORE INTO role_permissions (role_id,permission_id) SELECT 'role-super',id FROM permissions;
--> statement-breakpoint
INSERT OR IGNORE INTO role_permissions (role_id,permission_id) SELECT 'role-director',id FROM permissions WHERE code IN ('bids.view','bids.financials.view','bids.expenses.view','bids.approve','bids.award','bids.analytics.view','bids.export','bids.audit.view');
--> statement-breakpoint
INSERT OR IGNORE INTO role_permissions (role_id,permission_id) SELECT 'role-bids',id FROM permissions WHERE code IN ('bids.view','bids.create','bids.edit','bids.qualify','bids.assign','bids.submit','bids.documents.view','bids.documents.upload','bids.documents.verify','bids.expenses.view','bids.expenses.create','bids.financials.view','bids.pricing.edit','bids.team.manage','bids.export','bids.analytics.view');
--> statement-breakpoint
INSERT OR IGNORE INTO role_permissions (role_id,permission_id) SELECT 'role-finance',id FROM permissions WHERE code IN ('bids.view','bids.financials.view','bids.expenses.view','bids.expenses.approve','bids.security.manage','bids.analytics.view','bids.export');
--> statement-breakpoint
INSERT OR IGNORE INTO role_permissions (role_id,permission_id) SELECT 'role-accountant',id FROM permissions WHERE code IN ('bids.view','bids.expenses.view','bids.financials.view','bids.export');
--> statement-breakpoint
INSERT OR IGNORE INTO role_permissions (role_id,permission_id) SELECT 'role-project',id FROM permissions WHERE code IN ('bids.view','bids.documents.view');
--> statement-breakpoint
INSERT OR IGNORE INTO role_permissions (role_id,permission_id) SELECT 'role-procurement',id FROM permissions WHERE code IN ('bids.view','bids.documents.view');
--> statement-breakpoint
INSERT OR IGNORE INTO role_permissions (role_id,permission_id) SELECT 'role-auditor',id FROM permissions WHERE code IN ('bids.view','bids.documents.view','bids.expenses.view','bids.financials.view','bids.audit.view','bids.export');
--> statement-breakpoint
INSERT OR IGNORE INTO bids (id,company_id,reference,title,organization,description,category,subcategory,source,location,procurement_method,published_at,clarification_deadline,closes_at,expected_award_at,currency,estimated_value_minor,tender_fee_minor,security_required,bid_validity_days,priority,status,assigned_to,created_at,updated_at) VALUES
('moh-lab-2026','company-star-africa','MOH/SUPLS/26/114','National laboratory equipment framework','Ministry of Health','Supply, installation and commissioning of laboratory equipment for regional referral hospitals.','Laboratory equipment','Diagnostic equipment','Manual','Kampala & regional hospitals','Open domestic bidding',1785650400000,1788422400000,1788598800000,1793154000000,'UGX','152000000000','25000000',1,120,'critical','ready_for_submission','user-bids',1785650400000,1788328800000),
('kcca-drainage-2026','company-star-africa','KCCA/WRKS/26/044','Drainage rehabilitation — Lot 2','Kampala Capital City Authority','Rehabilitation of priority drainage channels and associated civil works.','Construction',NULL,'CSV Import','Kampala','Open domestic bidding',1786482000000,NULL,1789110000000,1794704400000,'UGX','286000000000','0',0,NULL,'high','preparing','user-bids',1786482000000,1788328800000),
('unicef-furniture-2026','company-star-africa','UNICEF/UGA/2026/881','School furniture supply framework','UNICEF Uganda','Manufacture and delivery of durable classroom desks and teacher furniture.','Furniture',NULL,'Demo Provider','Northern Uganda','Request for proposal',1787173200000,NULL,1789801200000,1795996800000,'UGX','94000000000','0',0,NULL,'medium','qualification','user-bids',1787173200000,1788328800000),
('nwsc-refurb-2026','company-star-africa','NWSC/CONS/26/209','Regional office refurbishment','National Water & Sewerage Corporation','Interior refurbishment, furniture and electrical works.','Construction',NULL,'Manual','Mbarara','Open domestic bidding',1787691600000,NULL,1790409600000,1796691600000,'UGX','68000000000','0',0,NULL,'medium','reviewing','user-bids',1787691600000,1788328800000),
('jms-medical-2026','company-star-africa','JMS/MED/2026/031','Essential medical supplies distribution','Joint Medical Store','Supply and distribution of consumable medical products.','Medical supplies',NULL,'CSV Import','Uganda','Open international bidding',1782853200000,NULL,1787900400000,1789765200000,'UGX','211000000000','0',0,NULL,'high','awaiting_result','user-bids',1782853200000,1788328800000),
('muk-library-2026','company-star-africa','MAK/SUPLS/25/192','Library shelving and study furniture','Makerere University','Supply and installation of shelving and study furniture.','Furniture',NULL,'Manual','Kampala','Open domestic bidding',1777932000000,NULL,1781766000000,1786482000000,'UGX','43000000000','0',0,NULL,'medium','won','user-bids',1777932000000,1788328800000),
('gulu-works-2026','company-star-africa','GCC/WRKS/25-26/072','Municipal market maintenance works','Gulu City Council','Maintenance and safety upgrades at municipal markets.','Construction',NULL,'Manual','Gulu','Open domestic bidding',1779141600000,NULL,1780038000000,1784494800000,'UGX','57000000000','0',0,NULL,'low','lost','user-bids',1779141600000,1788328800000),
('unra-ppe-2026','company-star-africa','UNRA/SUPLS/25-26/318','Protective equipment supply','Uganda National Roads Authority','Standards-compliant PPE for road maintenance teams.','General supply',NULL,'Demo Provider','Uganda','Request for quotations',1772920800000,NULL,1776157200000,1782075600000,'UGX','31500000000','0',0,NULL,'low','archived','user-bids',1772920800000,1788328800000);
--> statement-breakpoint
INSERT OR IGNORE INTO bid_requirements (id,bid_id,requirement,description,category,required,owner_id,due_at,status,uploaded,verified,verified_by,verified_at,created_at,updated_at) VALUES
('req-incorp','moh-lab-2026','Certificate of incorporation','Current certified company registration','company_documentation',1,'user-bids',1788426000000,'verified',1,1,'user-bids',1788249600000,1787000000000,1788249600000),
('req-tax','moh-lab-2026','URA tax clearance certificate','Valid tax clearance','tax',1,'user-finance',1788426000000,'verified',1,1,'user-finance',1788249600000,1787000000000,1788249600000),
('req-nssf','moh-lab-2026','NSSF clearance','Current employer clearance','legal',1,'user-hr',1788426000000,'ready_for_review',1,0,NULL,NULL,1787000000000,1788249600000),
('req-auth','moh-lab-2026','Manufacturer authorisations','Original authorisation letters','technical',1,'user-bids',1788512400000,'in_progress',0,0,NULL,NULL,1787000000000,1788249600000),
('req-bidform','moh-lab-2026','Signed bid form','Director-signed final bid form','submission',1,'user-director',1788595200000,'not_started',0,0,NULL,NULL,1787000000000,1788249600000);
--> statement-breakpoint
INSERT OR IGNORE INTO bid_expenses (id,bid_id,expense_number,category,description,supplier_payee,currency,amount_minor,tax_minor,payment_method,approval_status,accounting_status,incurred_at,created_by,created_at,updated_at) VALUES
('exp-moh-1','moh-lab-2026','BEX-2026-041','Tender document','Tender document fee','Ministry cashier','UGX','25000000','0','cash','paid','posted',1787299200000,'user-bids',1787299200000,1787299200000),
('exp-moh-2','moh-lab-2026','BEX-2026-047','Bid security fee','Bank guarantee issuance fee','Demo Bank Uganda','UGX','215000000','0','bank_transfer','submitted','unposted',1787896800000,'user-bids',1787896800000,1787896800000);
--> statement-breakpoint
INSERT OR IGNORE INTO bid_qualifications (id,bid_id,score_basis_points,recommendation,status,decision,decision_reason,prepared_by,decided_by,decided_at,created_at,updated_at) VALUES ('qual-moh','moh-lab-2026',8600,'pursue','approved','approved_to_pursue','Strong strategic fit and proven delivery experience.','user-bids','user-director',1787126400000,1786867200000,1787126400000);
--> statement-breakpoint
INSERT OR IGNORE INTO bid_securities (id,bid_id,type,issuer,security_number,amount_minor,currency,issue_date,expiry_date,validity_days,beneficiary,fee_minor,status,return_expected_at,created_at,updated_at) VALUES ('security-moh','moh-lab-2026','bank_guarantee','Demo Bank Uganda','BG-2026-00881','3040000000','UGX',1787896800000,1799010000000,120,'Ministry of Health','215000000','active',1799096400000,1787896800000,1787896800000);
--> statement-breakpoint
INSERT OR IGNORE INTO bid_approvals (id,bid_id,type,approver_id,decision,comments,decided_at,created_at) VALUES
('approval-moh-pursuit','moh-lab-2026','pursuit','user-director','approved','Strong fit and acceptable exposure.',1787126400000,1787126400000),
('approval-moh-pricing','moh-lab-2026','pricing','user-finance','approved','Margin and tax treatment reviewed.',1788324120000,1788324120000),
('approval-moh-final','moh-lab-2026','final_submission','user-director','pending',NULL,NULL,1788328800000);
--> statement-breakpoint
INSERT OR IGNORE INTO bid_activities (id,bid_id,actor_id,action,linked_entity_type,linked_entity_id,summary,occurred_at) VALUES
('activity-moh-1','moh-lab-2026','user-bids','bid.created','bid','moh-lab-2026','Opportunity created from manual provider.',1785650400000),
('activity-moh-2','moh-lab-2026','user-director','bid.pursuit.approved','bid_approval','approval-moh-pursuit','Pursuit approved.',1787126400000),
('activity-moh-3','moh-lab-2026','user-finance','bid.pricing.approved','bid_approval','approval-moh-pricing','Financial proposal v6 approved.',1788324120000);
--> statement-breakpoint
INSERT OR IGNORE INTO notifications (id,company_id,user_id,type,title,message,entity_type,entity_id,priority,created_at) VALUES
('notification-bid-deadline','company-star-africa','user-bids','bid.deadline','Submission approaching','MOH/SUPLS/26/114 closes within 3 days.','bid','moh-lab-2026','high',1788328800000),
('notification-bid-approval','company-star-africa','user-director','bid.approval_required','Final approval required','National laboratory equipment framework is awaiting final approval.','bid','moh-lab-2026','high',1788328800000),
('notification-security','company-star-africa','user-finance','bid.security','Bid security active','BG-2026-00881 is active and tracked through expiry.','bid','moh-lab-2026','normal',1788328800000);
