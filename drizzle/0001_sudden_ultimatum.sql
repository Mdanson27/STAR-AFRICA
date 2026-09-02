CREATE TABLE `bid_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`provider_type` text NOT NULL,
	`configuration_json` text,
	`enabled` integer DEFAULT true NOT NULL,
	`last_run_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_bid_sources_company_name` ON `bid_sources` (`company_id`,`name`);--> statement-breakpoint
CREATE TABLE `business_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_business_categories_code` ON `business_categories` (`company_id`,`code`);--> statement-breakpoint
CREATE TABLE `calendar_events` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer,
	`entity_type` text,
	`entity_id` text,
	`owner_id` text,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_calendar_events_company_start` ON `calendar_events` (`company_id`,`starts_at`);--> statement-breakpoint
CREATE TABLE `cheques` (
	`id` text PRIMARY KEY NOT NULL,
	`bank_account_id` text NOT NULL,
	`cheque_number` text NOT NULL,
	`payee` text NOT NULL,
	`currency` text DEFAULT 'UGX' NOT NULL,
	`amount_minor` text NOT NULL,
	`cheque_date` integer NOT NULL,
	`purpose` text NOT NULL,
	`supplier_id` text,
	`project_id` text,
	`approval_request_id` text,
	`status` text DEFAULT 'prepared' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approval_request_id`) REFERENCES `approval_requests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_cheque_number_account` ON `cheques` (`bank_account_id`,`cheque_number`);--> statement-breakpoint
CREATE TABLE `company_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`key` text NOT NULL,
	`value_json` text NOT NULL,
	`updated_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_company_settings_key` ON `company_settings` (`company_id`,`key`);--> statement-breakpoint
CREATE TABLE `credit_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`number` text NOT NULL,
	`invoice_id` text NOT NULL,
	`currency` text DEFAULT 'UGX' NOT NULL,
	`amount_minor` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`journal_entry_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_credit_notes_company_number` ON `credit_notes` (`company_id`,`number`);--> statement-breakpoint
CREATE TABLE `customer_contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`job_title` text,
	`primary_contact` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_customer_contacts_customer` ON `customer_contacts` (`customer_id`);--> statement-breakpoint
CREATE TABLE `departments` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_departments_company_code` ON `departments` (`company_id`,`code`);--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`code` text NOT NULL,
	`subject` text NOT NULL,
	`html_body` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_email_templates_company_code` ON `email_templates` (`company_id`,`code`);--> statement-breakpoint
CREATE TABLE `goods_receipt_items` (
	`id` text PRIMARY KEY NOT NULL,
	`goods_receipt_id` text NOT NULL,
	`purchase_order_item_id` text NOT NULL,
	`received_quantity_minor` text NOT NULL,
	`accepted_quantity_minor` text NOT NULL,
	`rejected_quantity_minor` text DEFAULT '0' NOT NULL,
	`notes` text,
	FOREIGN KEY (`goods_receipt_id`) REFERENCES `goods_receipts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`purchase_order_item_id`) REFERENCES `purchase_order_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_goods_receipt_items_receipt` ON `goods_receipt_items` (`goods_receipt_id`);--> statement-breakpoint
CREATE TABLE `inventory_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`warehouse_id` text NOT NULL,
	`batch_number` text NOT NULL,
	`serial_number` text,
	`manufacturer` text,
	`expires_at` integer,
	`quantity_minor` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_inventory_batch` ON `inventory_batches` (`item_id`,`warehouse_id`,`batch_number`);--> statement-breakpoint
CREATE INDEX `idx_inventory_batches_expiry` ON `inventory_batches` (`expires_at`);--> statement-breakpoint
CREATE TABLE `payroll_components` (
	`id` text PRIMARY KEY NOT NULL,
	`payroll_entry_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`amount_minor` text NOT NULL,
	`rule_version` text,
	FOREIGN KEY (`payroll_entry_id`) REFERENCES `payroll_entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_payroll_components_entry` ON `payroll_components` (`payroll_entry_id`);--> statement-breakpoint
CREATE TABLE `payroll_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`payroll_run_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`gross_minor` text NOT NULL,
	`deductions_minor` text NOT NULL,
	`net_minor` text NOT NULL,
	`status` text DEFAULT 'calculated' NOT NULL,
	FOREIGN KEY (`payroll_run_id`) REFERENCES `payroll_runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_payroll_entry_employee` ON `payroll_entries` (`payroll_run_id`,`employee_id`);--> statement-breakpoint
CREATE TABLE `procurement_request_items` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`description` text NOT NULL,
	`quantity_minor` text NOT NULL,
	`unit` text NOT NULL,
	`estimated_unit_cost_minor` text,
	`sequence` integer NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `procurement_requests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_procurement_request_items_request` ON `procurement_request_items` (`request_id`);--> statement-breakpoint
CREATE TABLE `project_expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`supplier_id` text,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`currency` text DEFAULT 'UGX' NOT NULL,
	`amount_minor` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`journal_entry_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_project_expenses_project_date` ON `project_expenses` (`project_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `project_milestones` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`due_at` integer,
	`completed_at` integer,
	`status` text DEFAULT 'planned' NOT NULL,
	`certificate_document_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`certificate_document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_project_milestones_due` ON `project_milestones` (`project_id`,`due_at`);--> statement-breakpoint
CREATE TABLE `purchase_order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`purchase_order_id` text NOT NULL,
	`inventory_item_id` text,
	`description` text NOT NULL,
	`quantity_minor` text NOT NULL,
	`unit` text NOT NULL,
	`unit_cost_minor` text NOT NULL,
	`line_total_minor` text NOT NULL,
	`sequence` integer NOT NULL,
	FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_purchase_order_items_order` ON `purchase_order_items` (`purchase_order_id`);--> statement-breakpoint
CREATE TABLE `rfqs` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`reference` text NOT NULL,
	`request_id` text NOT NULL,
	`issued_at` integer,
	`closes_at` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`request_id`) REFERENCES `procurement_requests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_rfqs_company_reference` ON `rfqs` (`company_id`,`reference`);--> statement-breakpoint
CREATE TABLE `supplier_contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`supplier_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`job_title` text,
	`primary_contact` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_supplier_contacts_supplier` ON `supplier_contacts` (`supplier_id`);--> statement-breakpoint
CREATE TABLE `supplier_quotations` (
	`id` text PRIMARY KEY NOT NULL,
	`rfq_id` text NOT NULL,
	`supplier_id` text NOT NULL,
	`reference` text,
	`currency` text DEFAULT 'UGX' NOT NULL,
	`subtotal_minor` text NOT NULL,
	`tax_minor` text DEFAULT '0' NOT NULL,
	`total_minor` text NOT NULL,
	`lead_time_days` integer,
	`selected` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`rfq_id`) REFERENCES `rfqs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_supplier_quotation` ON `supplier_quotations` (`rfq_id`,`supplier_id`);--> statement-breakpoint
CREATE TABLE `tax_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`basis_points` integer NOT NULL,
	`effective_at` integer NOT NULL,
	`applicability` text NOT NULL,
	`inclusive` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`configuration_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_tax_rules_version` ON `tax_rules` (`company_id`,`code`,`effective_at`);