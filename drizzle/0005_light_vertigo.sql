CREATE TABLE `customer_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`summary` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`occurred_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_customer_activity_date` ON `customer_activities` (`customer_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `customer_communications` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`contact_id` text,
	`type` text NOT NULL,
	`direction` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`subject` text NOT NULL,
	`summary` text NOT NULL,
	`outcome` text,
	`next_action` text,
	`follow_up_at` integer,
	`project_id` text,
	`bid_id` text,
	`invoice_id` text,
	`recorded_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`contact_id`) REFERENCES `customer_contacts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bid_id`) REFERENCES `bids`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_customer_communications_date` ON `customer_communications` (`customer_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `idx_customer_communications_followup` ON `customer_communications` (`follow_up_at`);--> statement-breakpoint
CREATE TABLE `customer_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`note` text NOT NULL,
	`pinned` integer DEFAULT false NOT NULL,
	`visibility` text DEFAULT 'internal' NOT NULL,
	`author_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_customer_notes_customer` ON `customer_notes` (`customer_id`,`pinned`);--> statement-breakpoint
CREATE TABLE `customer_statement_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`statement_id` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`reference` text NOT NULL,
	`description` text NOT NULL,
	`debit_minor` text DEFAULT '0' NOT NULL,
	`credit_minor` text DEFAULT '0' NOT NULL,
	`balance_minor` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`sequence` integer NOT NULL,
	FOREIGN KEY (`statement_id`) REFERENCES `customer_statements`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_customer_statement_lines` ON `customer_statement_lines` (`statement_id`,`sequence`);--> statement-breakpoint
CREATE TABLE `customer_statements` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`statement_number` text NOT NULL,
	`customer_id` text NOT NULL,
	`period_from` integer NOT NULL,
	`period_to` integer NOT NULL,
	`currency` text NOT NULL,
	`opening_balance_minor` text NOT NULL,
	`closing_balance_minor` text NOT NULL,
	`overdue_balance_minor` text NOT NULL,
	`retention_outstanding_minor` text NOT NULL,
	`options_json` text,
	`generated_by` text NOT NULL,
	`generated_at` integer NOT NULL,
	`sent_to` text,
	`sent_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`generated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_customer_statement_number` ON `customer_statements` (`company_id`,`statement_number`);--> statement-breakpoint
CREATE INDEX `idx_customer_statements_customer` ON `customer_statements` (`customer_id`,`generated_at`);--> statement-breakpoint
ALTER TABLE `customer_contacts` ADD `title` text;--> statement-breakpoint
ALTER TABLE `customer_contacts` ADD `first_name` text;--> statement-breakpoint
ALTER TABLE `customer_contacts` ADD `last_name` text;--> statement-breakpoint
ALTER TABLE `customer_contacts` ADD `alternative_phone` text;--> statement-breakpoint
ALTER TABLE `customer_contacts` ADD `whatsapp` text;--> statement-breakpoint
ALTER TABLE `customer_contacts` ADD `department` text;--> statement-breakpoint
ALTER TABLE `customer_contacts` ADD `preferred_channel` text;--> statement-breakpoint
ALTER TABLE `customer_contacts` ADD `contact_type` text DEFAULT 'Other' NOT NULL;--> statement-breakpoint
ALTER TABLE `customer_contacts` ADD `decision_maker` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `customer_contacts` ADD `billing_contact` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `customer_contacts` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `customer_contacts` ADD `status` text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `customer_contacts` ADD `archived_at` integer;--> statement-breakpoint
CREATE INDEX `idx_customer_contacts_email` ON `customer_contacts` (`email`);--> statement-breakpoint
ALTER TABLE `customers` ADD `trading_name` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `customer_type` text DEFAULT 'Company' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `category` text DEFAULT 'Other' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `industry` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `vat_registered` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `registration_number` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `website` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `correspondence_email` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `secondary_phone` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `country` text DEFAULT 'Uganda' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `district` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `city` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `postal_address` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `billing_contact` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `billing_email` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `preferred_currency` text DEFAULT 'UGX' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `payment_terms` text DEFAULT '30 days' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `due_days` integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `retention_applicable` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `retention_basis_points` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `credit_limit_minor` text DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `account_manager_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `customers` ADD `source` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `first_engagement_at` integer;--> statement-breakpoint
ALTER TABLE `customers` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `tags_json` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `archived_at` integer;--> statement-breakpoint
CREATE INDEX `idx_customers_company_status` ON `customers` (`company_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_customers_company_tin` ON `customers` (`company_id`,`tin`);--> statement-breakpoint
CREATE INDEX `idx_customers_company_email` ON `customers` (`company_id`,`email`);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id,code,description) VALUES
('perm-customers-view','customers.view','View permitted customer records'),
('perm-customers-create','customers.create','Create customer records'),
('perm-customers-edit','customers.edit','Edit customer records and internal notes'),
('perm-customers-archive','customers.archive','Archive customer records while preserving history'),
('perm-customers-contacts-view','customers.contacts.view','View customer contacts'),
('perm-customers-contacts-manage','customers.contacts.manage','Create and maintain customer contacts'),
('perm-customers-financials-view','customers.financials.view','View customer commercial and financial position'),
('perm-customers-outstanding-view','customers.outstanding.view','View customer receivables and aging'),
('perm-customers-retention-view','customers.retention.view','View customer retention balances'),
('perm-customers-statements-generate','customers.statements.generate','Generate immutable customer statement snapshots'),
('perm-customers-statements-send','customers.statements.send','Send or export customer statements'),
('perm-customers-communication-manage','customers.communication.manage','Record customer communications and follow-ups'),
('perm-customers-documents-manage','customers.documents.manage','Link and upload customer documents');
--> statement-breakpoint
INSERT OR IGNORE INTO role_permissions (role_id,permission_id)
SELECT 'role-super',id FROM permissions WHERE code LIKE 'customers.%';
--> statement-breakpoint
INSERT OR IGNORE INTO role_permissions (role_id,permission_id)
SELECT 'role-director',id FROM permissions WHERE code LIKE 'customers.%';
--> statement-breakpoint
INSERT OR IGNORE INTO role_permissions (role_id,permission_id)
SELECT 'role-finance',id FROM permissions WHERE code IN ('customers.view','customers.create','customers.edit','customers.contacts.view','customers.contacts.manage','customers.financials.view','customers.outstanding.view','customers.retention.view','customers.statements.generate','customers.statements.send','customers.communication.manage','customers.documents.manage');
--> statement-breakpoint
INSERT OR IGNORE INTO role_permissions (role_id,permission_id)
SELECT 'role-accountant',id FROM permissions WHERE code IN ('customers.view','customers.edit','customers.contacts.view','customers.financials.view','customers.outstanding.view','customers.retention.view','customers.statements.generate','customers.communication.manage','customers.documents.manage');
--> statement-breakpoint
INSERT OR IGNORE INTO role_permissions (role_id,permission_id)
SELECT role.id,permission.id FROM roles role CROSS JOIN permissions permission WHERE role.id IN ('role-project','role-bids') AND permission.code IN ('customers.view','customers.contacts.view','customers.contacts.manage','customers.communication.manage','customers.documents.manage');
--> statement-breakpoint
INSERT OR IGNORE INTO role_permissions (role_id,permission_id)
SELECT role.id,permission.id FROM roles role CROSS JOIN permissions permission WHERE role.id IN ('role-site','role-procurement') AND permission.code IN ('customers.view','customers.contacts.view','customers.communication.manage','customers.documents.manage');
--> statement-breakpoint
INSERT OR IGNORE INTO role_permissions (role_id,permission_id)
SELECT 'role-auditor',id FROM permissions WHERE code IN ('customers.view','customers.contacts.view','customers.financials.view','customers.outstanding.view','customers.retention.view');
--> statement-breakpoint
PRAGMA optimize;
