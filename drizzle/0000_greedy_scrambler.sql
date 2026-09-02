CREATE TABLE `accounting_periods` (
	`id` text PRIMARY KEY NOT NULL,
	`fiscal_year_id` text NOT NULL,
	`name` text NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`locked_by` text,
	`locked_at` integer,
	FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`locked_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_accounting_period_year_name` ON `accounting_periods` (`fiscal_year_id`,`name`);--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`normal_balance` text NOT NULL,
	`parent_id` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_accounts_company_code` ON `accounts` (`company_id`,`code`);--> statement-breakpoint
CREATE TABLE `approval_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`amount_minor` text,
	`currency` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`current_step` integer DEFAULT 1 NOT NULL,
	`requested_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_approvals_entity` ON `approval_requests` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_approvals_company_status` ON `approval_requests` (`company_id`,`status`);--> statement-breakpoint
CREATE TABLE `approval_steps` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`role_id` text,
	`approver_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`decision_note` text,
	`decided_at` integer,
	FOREIGN KEY (`request_id`) REFERENCES `approval_requests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approver_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_approval_step_sequence` ON `approval_steps` (`request_id`,`sequence`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`old_value_json` text,
	`new_value_json` text,
	`request_id` text,
	`ip_hash` text,
	`occurred_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_audit_entity_date` ON `audit_logs` (`entity_type`,`entity_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_company_date` ON `audit_logs` (`company_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `backup_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`status` text NOT NULL,
	`size_bytes` integer,
	`storage_destination` text,
	`restore_point` text,
	`verification_status` text DEFAULT 'pending' NOT NULL,
	`requested_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bank_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`bank_name` text NOT NULL,
	`account_name` text NOT NULL,
	`masked_number` text NOT NULL,
	`currency` text DEFAULT 'UGX' NOT NULL,
	`ledger_account_id` text NOT NULL,
	`opening_balance_minor` text DEFAULT '0' NOT NULL,
	`last_reconciled_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ledger_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bank_reconciliations` (
	`id` text PRIMARY KEY NOT NULL,
	`bank_account_id` text NOT NULL,
	`period_end` integer NOT NULL,
	`statement_balance_minor` text NOT NULL,
	`ledger_balance_minor` text NOT NULL,
	`difference_minor` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`finalized_by` text,
	`finalized_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`finalized_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_bank_reconciliation_period` ON `bank_reconciliations` (`bank_account_id`,`period_end`);--> statement-breakpoint
CREATE TABLE `bank_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`bank_account_id` text NOT NULL,
	`external_id` text,
	`transaction_date` integer NOT NULL,
	`description` text NOT NULL,
	`reference` text,
	`amount_minor` text NOT NULL,
	`status` text DEFAULT 'unmatched' NOT NULL,
	`journal_entry_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_bank_transaction_external` ON `bank_transactions` (`bank_account_id`,`external_id`);--> statement-breakpoint
CREATE INDEX `idx_bank_transactions_account_date` ON `bank_transactions` (`bank_account_id`,`transaction_date`);--> statement-breakpoint
CREATE TABLE `bid_expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`bid_id` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`currency` text(3) DEFAULT 'UGX' NOT NULL,
	`amount_minor` text DEFAULT '0' NOT NULL,
	`journal_entry_id` text,
	`incurred_at` integer NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bid_id`) REFERENCES `bids`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_bid_expenses_bid` ON `bid_expenses` (`bid_id`);--> statement-breakpoint
CREATE TABLE `bid_requirements` (
	`id` text PRIMARY KEY NOT NULL,
	`bid_id` text NOT NULL,
	`requirement` text NOT NULL,
	`required` integer DEFAULT true NOT NULL,
	`uploaded` integer DEFAULT false NOT NULL,
	`verified` integer DEFAULT false NOT NULL,
	`expires_at` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bid_id`) REFERENCES `bids`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_bid_requirements_bid` ON `bid_requirements` (`bid_id`);--> statement-breakpoint
CREATE TABLE `bids` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`reference` text NOT NULL,
	`title` text NOT NULL,
	`organization` text NOT NULL,
	`category` text,
	`source` text,
	`source_url` text,
	`published_at` integer,
	`closes_at` integer NOT NULL,
	`currency` text DEFAULT 'UGX' NOT NULL,
	`estimated_value_minor` text,
	`status` text DEFAULT 'new' NOT NULL,
	`assigned_to` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_bids_company_reference` ON `bids` (`company_id`,`reference`);--> statement-breakpoint
CREATE INDEX `idx_bids_status_closes` ON `bids` (`company_id`,`status`,`closes_at`);--> statement-breakpoint
CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`country_code` text DEFAULT 'UG' NOT NULL,
	`base_currency` text DEFAULT 'UGX' NOT NULL,
	`timezone` text DEFAULT 'Africa/Kampala' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`tin` text,
	`email` text,
	`phone` text,
	`address` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_customers_company_code` ON `customers` (`company_id`,`code`);--> statement-breakpoint
CREATE INDEX `idx_customers_company_name` ON `customers` (`company_id`,`name`);--> statement-breakpoint
CREATE TABLE `document_links` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`relationship` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_document_links` ON `document_links` (`document_id`,`entity_type`,`entity_id`,`relationship`);--> statement-breakpoint
CREATE INDEX `idx_document_links_entity` ON `document_links` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`storage_key` text NOT NULL,
	`filename` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`sha256` text NOT NULL,
	`uploaded_by` text NOT NULL,
	`ocr_status` text DEFAULT 'uploaded' NOT NULL,
	`verification_status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_documents_storage_key` ON `documents` (`storage_key`);--> statement-breakpoint
CREATE INDEX `idx_documents_company_ocr` ON `documents` (`company_id`,`ocr_status`);--> statement-breakpoint
CREATE TABLE `email_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`provider` text NOT NULL,
	`mode` text NOT NULL,
	`recipient` text NOT NULL,
	`subject` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`status` text NOT NULL,
	`provider_message_id` text,
	`error_code` text,
	`sent_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sent_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_email_logs_entity` ON `email_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `employees` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`employee_number` text NOT NULL,
	`name` text NOT NULL,
	`department` text,
	`job_title` text,
	`email` text,
	`phone` text,
	`hired_at` integer,
	`currency` text DEFAULT 'UGX' NOT NULL,
	`salary_minor` text NOT NULL,
	`payment_method` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_employees_company_number` ON `employees` (`company_id`,`employee_number`);--> statement-breakpoint
CREATE TABLE `fiscal_years` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_fiscal_year_company_name` ON `fiscal_years` (`company_id`,`name`);--> statement-breakpoint
CREATE TABLE `goods_receipts` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`reference` text NOT NULL,
	`purchase_order_id` text NOT NULL,
	`received_at` integer NOT NULL,
	`received_by` text NOT NULL,
	`status` text DEFAULT 'received' NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`received_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_goods_receipts_reference` ON `goods_receipts` (`company_id`,`reference`);--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`unit` text NOT NULL,
	`quantity_minor` text DEFAULT '0' NOT NULL,
	`reserved_minor` text DEFAULT '0' NOT NULL,
	`reorder_level_minor` text DEFAULT '0' NOT NULL,
	`average_cost_minor` text DEFAULT '0' NOT NULL,
	`currency` text DEFAULT 'UGX' NOT NULL,
	`tracks_batch` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_inventory_company_sku` ON `inventory_items` (`company_id`,`sku`);--> statement-breakpoint
CREATE INDEX `idx_inventory_company_category` ON `inventory_items` (`company_id`,`category`);--> statement-breakpoint
CREATE TABLE `invoice_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`description` text NOT NULL,
	`quantity_minor` text NOT NULL,
	`unit_price_minor` text NOT NULL,
	`tax_basis_points` integer DEFAULT 0 NOT NULL,
	`line_total_minor` text NOT NULL,
	`sequence` integer NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_invoice_lines_invoice` ON `invoice_lines` (`invoice_id`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`number` text NOT NULL,
	`customer_id` text NOT NULL,
	`project_id` text,
	`issue_date` integer NOT NULL,
	`due_date` integer NOT NULL,
	`currency` text DEFAULT 'UGX' NOT NULL,
	`subtotal_minor` text NOT NULL,
	`discount_minor` text DEFAULT '0' NOT NULL,
	`tax_minor` text DEFAULT '0' NOT NULL,
	`retention_minor` text DEFAULT '0' NOT NULL,
	`total_minor` text NOT NULL,
	`paid_minor` text DEFAULT '0' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`journal_entry_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_invoices_company_number` ON `invoices` (`company_id`,`number`);--> statement-breakpoint
CREATE INDEX `idx_invoices_customer_due` ON `invoices` (`customer_id`,`due_date`);--> statement-breakpoint
CREATE INDEX `idx_invoices_project` ON `invoices` (`project_id`);--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`number` text NOT NULL,
	`period_id` text NOT NULL,
	`entry_date` integer NOT NULL,
	`source_type` text NOT NULL,
	`source_id` text,
	`memo` text NOT NULL,
	`currency` text DEFAULT 'UGX' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`reversal_of_id` text,
	`created_by` text NOT NULL,
	`posted_by` text,
	`posted_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`period_id`) REFERENCES `accounting_periods`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`posted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_journal_entries_company_number` ON `journal_entries` (`company_id`,`number`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_journal_source_idempotency` ON `journal_entries` (`company_id`,`source_type`,`source_id`);--> statement-breakpoint
CREATE INDEX `idx_journal_entries_period_status` ON `journal_entries` (`period_id`,`status`);--> statement-breakpoint
CREATE TABLE `journal_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`journal_entry_id` text NOT NULL,
	`account_id` text NOT NULL,
	`description` text,
	`debit_minor` text DEFAULT '0' NOT NULL,
	`credit_minor` text DEFAULT '0' NOT NULL,
	`customer_id` text,
	`supplier_id` text,
	`project_id` text,
	`sequence` integer NOT NULL,
	FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_journal_lines_entry` ON `journal_lines` (`journal_entry_id`);--> statement-breakpoint
CREATE INDEX `idx_journal_lines_account` ON `journal_lines` (`account_id`);--> statement-breakpoint
CREATE TABLE `migration_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`source_type` text NOT NULL,
	`status` text DEFAULT 'uploaded' NOT NULL,
	`source_document_id` text,
	`imported_count` integer DEFAULT 0 NOT NULL,
	`error_count` integer DEFAULT 0 NOT NULL,
	`reconciliation_json` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`user_id` text,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`priority` text DEFAULT 'normal' NOT NULL,
	`read_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_user_read` ON `notifications` (`user_id`,`read_at`);--> statement-breakpoint
CREATE TABLE `ocr_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`provider` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`extracted_json` text,
	`confidence_basis_points` integer,
	`error_code` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_ocr_jobs_document` ON `ocr_jobs` (`document_id`);--> statement-breakpoint
CREATE TABLE `payment_allocations` (
	`id` text PRIMARY KEY NOT NULL,
	`payment_id` text NOT NULL,
	`invoice_id` text NOT NULL,
	`amount_minor` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_payment_invoice_allocation` ON `payment_allocations` (`payment_id`,`invoice_id`);--> statement-breakpoint
CREATE INDEX `idx_allocations_invoice` ON `payment_allocations` (`invoice_id`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`reference` text NOT NULL,
	`customer_id` text,
	`supplier_id` text,
	`project_id` text,
	`currency` text(3) DEFAULT 'UGX' NOT NULL,
	`amount_minor` text DEFAULT '0' NOT NULL,
	`received_or_paid_at` integer NOT NULL,
	`method` text NOT NULL,
	`bank_reference` text,
	`status` text DEFAULT 'expected' NOT NULL,
	`journal_entry_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_payments_company_reference` ON `payments` (`company_id`,`reference`);--> statement-breakpoint
CREATE INDEX `idx_payments_customer` ON `payments` (`customer_id`);--> statement-breakpoint
CREATE TABLE `payroll_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`period_id` text NOT NULL,
	`currency` text DEFAULT 'UGX' NOT NULL,
	`gross_minor` text DEFAULT '0' NOT NULL,
	`deductions_minor` text DEFAULT '0' NOT NULL,
	`net_minor` text DEFAULT '0' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`journal_entry_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`period_id`) REFERENCES `accounting_periods`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_payroll_run_period` ON `payroll_runs` (`company_id`,`period_id`);--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`description` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permissions_code_unique` ON `permissions` (`code`);--> statement-breakpoint
CREATE TABLE `procurement_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`reference` text NOT NULL,
	`project_id` text,
	`bid_id` text,
	`department` text,
	`purpose` text NOT NULL,
	`currency` text DEFAULT 'UGX' NOT NULL,
	`total_minor` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`requested_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bid_id`) REFERENCES `bids`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_procurement_requests_reference` ON `procurement_requests` (`company_id`,`reference`);--> statement-breakpoint
CREATE INDEX `idx_procurement_project_status` ON `procurement_requests` (`project_id`,`status`);--> statement-breakpoint
CREATE TABLE `project_stages` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`sequence` integer NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_project_stages_company_sequence` ON `project_stages` (`company_id`,`sequence`);--> statement-breakpoint
CREATE TABLE `project_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`assignee_id` text,
	`due_at` integer,
	`status` text DEFAULT 'open' NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_project_tasks_project_status` ON `project_tasks` (`project_id`,`status`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`customer_id` text NOT NULL,
	`bid_id` text,
	`category` text,
	`location` text,
	`contract_currency` text DEFAULT 'UGX' NOT NULL,
	`contract_value_minor` text NOT NULL,
	`budget_minor` text DEFAULT '0' NOT NULL,
	`retention_basis_points` integer DEFAULT 500 NOT NULL,
	`starts_at` integer,
	`planned_completion_at` integer,
	`stage_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`completion_basis_points` integer DEFAULT 0 NOT NULL,
	`project_manager_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bid_id`) REFERENCES `bids`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`stage_id`) REFERENCES `project_stages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_manager_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_projects_company_code` ON `projects` (`company_id`,`code`);--> statement-breakpoint
CREATE INDEX `idx_projects_customer` ON `projects` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_projects_bid` ON `projects` (`bid_id`);--> statement-breakpoint
CREATE TABLE `purchase_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`reference` text NOT NULL,
	`request_id` text,
	`supplier_id` text NOT NULL,
	`project_id` text,
	`currency` text DEFAULT 'UGX' NOT NULL,
	`subtotal_minor` text NOT NULL,
	`tax_minor` text DEFAULT '0' NOT NULL,
	`total_minor` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`request_id`) REFERENCES `procurement_requests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_purchase_orders_reference` ON `purchase_orders` (`company_id`,`reference`);--> statement-breakpoint
CREATE INDEX `idx_purchase_orders_supplier` ON `purchase_orders` (`supplier_id`);--> statement-breakpoint
CREATE TABLE `retentions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`invoice_id` text,
	`basis_points` integer NOT NULL,
	`base_minor` text NOT NULL,
	`amount_minor` text NOT NULL,
	`withheld_at` integer,
	`expected_release_at` integer,
	`actual_release_at` integer,
	`received_minor` text DEFAULT '0' NOT NULL,
	`status` text DEFAULT 'withheld' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_retentions_project_status` ON `retentions` (`project_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_retentions_release` ON `retentions` (`expected_release_at`);--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role_id` text NOT NULL,
	`permission_id` text NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_role_permissions` ON `role_permissions` (`role_id`,`permission_id`);--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`read_only` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_roles_company_name` ON `roles` (`company_id`,`name`);--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`warehouse_id` text NOT NULL,
	`project_id` text,
	`goods_receipt_id` text,
	`movement_type` text NOT NULL,
	`quantity_minor` text NOT NULL,
	`unit_cost_minor` text,
	`occurred_at` integer NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`goods_receipt_id`) REFERENCES `goods_receipts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_stock_movements_item_date` ON `stock_movements` (`item_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `idx_stock_movements_project` ON `stock_movements` (`project_id`);--> statement-breakpoint
CREATE TABLE `supplier_bills` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`supplier_id` text NOT NULL,
	`purchase_order_id` text,
	`invoice_number` text NOT NULL,
	`issue_date` integer NOT NULL,
	`due_date` integer NOT NULL,
	`currency` text DEFAULT 'UGX' NOT NULL,
	`subtotal_minor` text NOT NULL,
	`tax_minor` text DEFAULT '0' NOT NULL,
	`total_minor` text NOT NULL,
	`paid_minor` text DEFAULT '0' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`journal_entry_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_supplier_bills_supplier_number` ON `supplier_bills` (`supplier_id`,`invoice_number`);--> statement-breakpoint
CREATE INDEX `idx_supplier_bills_due_status` ON `supplier_bills` (`due_date`,`status`);--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`tin` text,
	`vat_registered` integer DEFAULT false NOT NULL,
	`credit_terms_days` integer DEFAULT 0 NOT NULL,
	`email` text,
	`phone` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_suppliers_company_code` ON `suppliers` (`company_id`,`code`);--> statement-breakpoint
CREATE INDEX `idx_suppliers_company_name` ON `suppliers` (`company_id`,`name`);--> statement-breakpoint
CREATE TABLE `user_roles` (
	`user_id` text NOT NULL,
	`role_id` text NOT NULL,
	`assigned_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_user_roles` ON `user_roles` (`user_id`,`role_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`external_identity_id` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`department` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_users_company_external` ON `users` (`company_id`,`external_identity_id`);--> statement-breakpoint
CREATE INDEX `idx_users_company_email` ON `users` (`company_id`,`email`);--> statement-breakpoint
CREATE TABLE `warehouses` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`location` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_warehouses_company_code` ON `warehouses` (`company_id`,`code`);