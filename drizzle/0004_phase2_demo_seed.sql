-- Production structural bootstrap.
-- Historical demonstration users, bids, expenses and notifications were removed
-- for Production V1. This migration now creates only the company authorization
-- baseline needed by a fresh installation.

INSERT OR IGNORE INTO companies (id,name,country_code,base_currency,timezone,created_at,updated_at) VALUES ('company-star-africa','Star Africa','UG','UGX','Africa/Kampala',1788328800000,1788328800000);
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
