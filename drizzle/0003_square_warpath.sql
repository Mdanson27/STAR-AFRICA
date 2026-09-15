CREATE TABLE `positions` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`role_id` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_positions_company_name` ON `positions` (`company_id`,`name`);--> statement-breakpoint
CREATE INDEX `idx_positions_role` ON `positions` (`role_id`);--> statement-breakpoint
CREATE TABLE `project_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`summary` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`occurred_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_project_activity_date` ON `project_activities` (`project_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `project_budget_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`category` text NOT NULL,
	`subcategory` text,
	`description` text,
	`quantity_minor` text DEFAULT '1000' NOT NULL,
	`unit` text,
	`unit_cost_minor` text DEFAULT '0' NOT NULL,
	`original_minor` text DEFAULT '0' NOT NULL,
	`changes_minor` text DEFAULT '0' NOT NULL,
	`contingency_minor` text DEFAULT '0' NOT NULL,
	`committed_minor` text DEFAULT '0' NOT NULL,
	`actual_minor` text DEFAULT '0' NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_project_budget_category` ON `project_budget_lines` (`project_id`,`category`);--> statement-breakpoint
CREATE TABLE `project_certificates` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`certificate_type` text NOT NULL,
	`number` text NOT NULL,
	`period` text NOT NULL,
	`related_milestone` text,
	`submitted_at` integer NOT NULL,
	`submitted_value_minor` text DEFAULT '0' NOT NULL,
	`certified_value_minor` text DEFAULT '0' NOT NULL,
	`approved_at` integer,
	`approved_by` text,
	`document_id` text,
	`notes` text,
	`status` text DEFAULT 'submitted' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_project_certificate_number` ON `project_certificates` (`project_id`,`number`);--> statement-breakpoint
CREATE TABLE `project_document_links` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`document_id` text NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`reference_number` text,
	`version` text NOT NULL,
	`document_at` integer NOT NULL,
	`expires_at` integer,
	`stage` text,
	`related_milestone` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_project_documents_category` ON `project_document_links` (`project_id`,`category`);--> statement-breakpoint
CREATE TABLE `project_equipment_records` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`equipment` text NOT NULL,
	`equipment_code` text NOT NULL,
	`type` text NOT NULL,
	`source` text NOT NULL,
	`assigned_at` integer NOT NULL,
	`expected_return_at` integer,
	`operator` text NOT NULL,
	`activity` text NOT NULL,
	`hours_used_minor` text DEFAULT '0' NOT NULL,
	`fuel_notes` text,
	`condition` text NOT NULL,
	`maintenance_issue` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'assigned' NOT NULL,
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_project_equipment_status` ON `project_equipment_records` (`project_id`,`status`);--> statement-breakpoint
CREATE TABLE `project_incidents` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`location` text NOT NULL,
	`type` text NOT NULL,
	`description` text NOT NULL,
	`people_involved` text,
	`immediate_action` text NOT NULL,
	`severity` text NOT NULL,
	`follow_up` text,
	`status` text DEFAULT 'open' NOT NULL,
	`reported_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reported_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_project_incident_date` ON `project_incidents` (`project_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `project_invoice_details` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`invoice_id` text NOT NULL,
	`certificate_reference` text,
	`description` text NOT NULL,
	`payment_instructions` text NOT NULL,
	`supporting_document_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supporting_document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_project_invoice_detail` ON `project_invoice_details` (`invoice_id`);--> statement-breakpoint
CREATE TABLE `project_issues` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text,
	`priority` text DEFAULT 'normal' NOT NULL,
	`owner_id` text,
	`raised_by` text NOT NULL,
	`raised_at` integer NOT NULL,
	`target_resolution_at` integer,
	`schedule_impact` text,
	`cost_impact_minor` text DEFAULT '0' NOT NULL,
	`immediate_action` text,
	`details_json` text,
	`status` text DEFAULT 'open' NOT NULL,
	`resolution` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`raised_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_project_issue_status` ON `project_issues` (`project_id`,`status`);--> statement-breakpoint
CREATE TABLE `project_labour_records` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`worker_team` text NOT NULL,
	`worker_type` text NOT NULL,
	`trade_role` text NOT NULL,
	`activity` text NOT NULL,
	`regular_hours_minor` text NOT NULL,
	`overtime_hours_minor` text DEFAULT '0' NOT NULL,
	`work_completed` text NOT NULL,
	`rate_minor` text DEFAULT '0' NOT NULL,
	`supervisor` text NOT NULL,
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_project_labour_date` ON `project_labour_records` (`project_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `project_material_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`reference` text NOT NULL,
	`material` text NOT NULL,
	`quantity_minor` text NOT NULL,
	`unit` text NOT NULL,
	`required_at` integer,
	`purpose` text NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`estimated_total_minor` text DEFAULT '0' NOT NULL,
	`details_json` text,
	`supporting_document_id` text,
	`notes` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`requested_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supporting_document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_project_material_reference` ON `project_material_requests` (`project_id`,`reference`);--> statement-breakpoint
CREATE INDEX `idx_project_material_status` ON `project_material_requests` (`project_id`,`status`);--> statement-breakpoint
CREATE TABLE `project_material_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`material` text NOT NULL,
	`quantity_issued_minor` text NOT NULL,
	`quantity_used_minor` text NOT NULL,
	`quantity_returned_minor` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`activity` text NOT NULL,
	`issued_by` text NOT NULL,
	`received_by` text NOT NULL,
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_project_material_usage_date` ON `project_material_usage` (`project_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `project_payment_details` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`payment_id` text NOT NULL,
	`invoice_id` text,
	`payment_type` text NOT NULL,
	`bank_account` text NOT NULL,
	`allocation` text NOT NULL,
	`notes` text,
	`receipt_document_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`receipt_document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_project_payment_detail` ON `project_payment_details` (`payment_id`);--> statement-breakpoint
CREATE TABLE `project_progress_updates` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`previous_basis_points` integer NOT NULL,
	`new_basis_points` integer NOT NULL,
	`stage` text,
	`work_completed` text,
	`reason` text,
	`comment` text NOT NULL,
	`evidence_document_id` text,
	`updated_by` text NOT NULL,
	`occurred_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`evidence_document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_project_progress_date` ON `project_progress_updates` (`project_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `project_retention_details` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`retention_id` text NOT NULL,
	`applicable` integer DEFAULT true NOT NULL,
	`defects_start_at` integer,
	`defects_end_at` integer,
	`request_at` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`retention_id`) REFERENCES `retentions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_project_retention_detail` ON `project_retention_details` (`retention_id`);--> statement-breakpoint
CREATE TABLE `project_risks` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`category` text NOT NULL,
	`likelihood` integer NOT NULL,
	`impact` integer NOT NULL,
	`score` integer DEFAULT 1 NOT NULL,
	`owner_id` text,
	`mitigation` text NOT NULL,
	`contingency` text,
	`target_at` integer,
	`status` text DEFAULT 'open' NOT NULL,
	`details_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_project_risk_status` ON `project_risks` (`project_id`,`status`);--> statement-breakpoint
CREATE TABLE `project_site_updates` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`report_date` integer NOT NULL,
	`location` text,
	`weather` text,
	`work_completed` text NOT NULL,
	`work_in_progress` text,
	`workers_on_site` integer DEFAULT 0 NOT NULL,
	`materials_received` text,
	`materials_used` text,
	`equipment_used` text,
	`delays` text,
	`issues` text,
	`instructions` text,
	`safety_observations` text,
	`visitors` text,
	`details_json` text,
	`photo_document_id` text,
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`photo_document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_project_site_updates_date` ON `project_site_updates` (`project_id`,`report_date`);--> statement-breakpoint
CREATE TABLE `project_team_members` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`project_role` text NOT NULL,
	`responsibility` text,
	`starts_at` integer,
	`ends_at` integer,
	`allocation_basis_points` integer DEFAULT 10000 NOT NULL,
	`access_level` text,
	`status` text DEFAULT 'active' NOT NULL,
	`details_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_project_team_member` ON `project_team_members` (`project_id`,`user_id`,`project_role`);--> statement-breakpoint
CREATE TABLE `project_variations` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`number` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`reason` text NOT NULL,
	`requested_by_party` text,
	`affected_scope` text,
	`original_value_minor` text DEFAULT '0' NOT NULL,
	`cost_impact_minor` text DEFAULT '0' NOT NULL,
	`revised_value_minor` text DEFAULT '0' NOT NULL,
	`time_impact_days` integer DEFAULT 0 NOT NULL,
	`submitted_at` integer,
	`decision_required_at` integer,
	`status` text DEFAULT 'draft' NOT NULL,
	`approved_value_minor` text,
	`approved_extension_days` integer,
	`details_json` text,
	`supporting_document_id` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supporting_document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_project_variation_number` ON `project_variations` (`project_id`,`number`);--> statement-breakpoint
CREATE TABLE `project_work_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`stage` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`starts_at` integer,
	`ends_at` integer,
	`responsible_id` text,
	`weight_basis_points` integer DEFAULT 0 NOT NULL,
	`progress_basis_points` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'not_started' NOT NULL,
	`details_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`responsible_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_project_work_stage` ON `project_work_activities` (`project_id`,`stage`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_bid_expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`bid_id` text NOT NULL,
	`expense_number` text DEFAULT 'UNASSIGNED' NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`supplier_payee` text,
	`currency` text(3) DEFAULT 'UGX' NOT NULL,
	`amount_minor` text DEFAULT '0' NOT NULL,
	`tax_minor` text DEFAULT '0' NOT NULL,
	`payment_method` text,
	`receipt_document_id` text,
	`approval_status` text DEFAULT 'draft' NOT NULL,
	`accounting_status` text DEFAULT 'unposted' NOT NULL,
	`journal_entry_id` text,
	`incurred_at` integer NOT NULL,
	`created_by` text NOT NULL,
	`approved_by` text,
	`approved_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bid_id`) REFERENCES `bids`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`receipt_document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_bid_expenses`("id", "bid_id", "expense_number", "category", "description", "supplier_payee", "currency", "amount_minor", "tax_minor", "payment_method", "receipt_document_id", "approval_status", "accounting_status", "journal_entry_id", "incurred_at", "created_by", "approved_by", "approved_at", "created_at", "updated_at") SELECT "id", "bid_id", "expense_number", "category", "description", "supplier_payee", "currency", "amount_minor", "tax_minor", "payment_method", "receipt_document_id", "approval_status", "accounting_status", "journal_entry_id", "incurred_at", "created_by", "approved_by", "approved_at", "created_at", "updated_at" FROM `bid_expenses`;--> statement-breakpoint
DROP TABLE `bid_expenses`;--> statement-breakpoint
ALTER TABLE `__new_bid_expenses` RENAME TO `bid_expenses`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_bid_expenses_bid` ON `bid_expenses` (`bid_id`);--> statement-breakpoint
CREATE TABLE `__new_project_milestones` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`stage` text,
	`owner_id` text,
	`planned_start_at` integer,
	`weight_basis_points` integer DEFAULT 0 NOT NULL,
	`due_at` integer,
	`priority` text DEFAULT 'normal' NOT NULL,
	`deliverable` text,
	`evidence_required` integer DEFAULT false NOT NULL,
	`approval_required` integer DEFAULT false NOT NULL,
	`details_json` text,
	`completed_at` integer,
	`approved_by` text,
	`approved_at` integer,
	`status` text DEFAULT 'not_started' NOT NULL,
	`certificate_document_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`certificate_document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_project_milestones`("id", "project_id", "name", "due_at", "completed_at", "status", "certificate_document_id", "created_at", "updated_at") SELECT "id", "project_id", "name", "due_at", "completed_at", CASE WHEN "status"='planned' THEN 'not_started' ELSE "status" END, "certificate_document_id", "created_at", "updated_at" FROM `project_milestones`;--> statement-breakpoint
DROP TABLE `project_milestones`;--> statement-breakpoint
ALTER TABLE `__new_project_milestones` RENAME TO `project_milestones`;--> statement-breakpoint
CREATE INDEX `idx_project_milestones_due` ON `project_milestones` (`project_id`,`due_at`);--> statement-breakpoint
CREATE TABLE `__new_project_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`milestone_id` text,
	`title` text NOT NULL,
	`description` text,
	`assignee_id` text,
	`starts_at` integer,
	`due_at` integer,
	`status` text DEFAULT 'not_started' NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`stage` text,
	`details_json` text,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_project_tasks`("id", "project_id", "milestone_id", "title", "description", "assignee_id", "due_at", "status", "priority", "stage", "created_at", "updated_at") SELECT "id", "project_id", "milestone_id", "title", "description", "assignee_id", "due_at", "status", "priority", "stage", "created_at", "updated_at" FROM `project_tasks`;--> statement-breakpoint
DROP TABLE `project_tasks`;--> statement-breakpoint
ALTER TABLE `__new_project_tasks` RENAME TO `project_tasks`;--> statement-breakpoint
CREATE INDEX `idx_project_tasks_project_status` ON `project_tasks` (`project_id`,`status`);--> statement-breakpoint
ALTER TABLE `employees` ADD `user_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `employees` ADD `position_id` text REFERENCES positions(id);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_employees_user` ON `employees` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_employees_position` ON `employees` (`position_id`);--> statement-breakpoint
ALTER TABLE `project_expenses` ADD `expense_number` text DEFAULT 'MIGRATED' NOT NULL;--> statement-breakpoint
ALTER TABLE `project_expenses` ADD `payee` text;--> statement-breakpoint
ALTER TABLE `project_expenses` ADD `tax_minor` text DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `project_expenses` ADD `total_minor` text DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `project_expenses` ADD `payment_method` text;--> statement-breakpoint
ALTER TABLE `project_expenses` ADD `reference_number` text;--> statement-breakpoint
ALTER TABLE `project_expenses` ADD `activity` text;--> statement-breakpoint
ALTER TABLE `project_expenses` ADD `details_json` text;--> statement-breakpoint
ALTER TABLE `project_expenses` ADD `receipt_document_id` text REFERENCES documents(id);--> statement-breakpoint
ALTER TABLE `project_expenses` ADD `status` text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `project_expenses` ADD `recorded_by` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `project_expenses` ADD `approved_by` text REFERENCES users(id);--> statement-breakpoint
UPDATE `project_expenses` SET `expense_number`='MIGRATED-' || substr(`id`,1,12), `total_minor`=CAST(CAST(`amount_minor` AS INTEGER)+CAST(`tax_minor` AS INTEGER) AS TEXT), `recorded_by`='user-admin';--> statement-breakpoint
CREATE UNIQUE INDEX `uq_project_expense_number` ON `project_expenses` (`project_id`,`expense_number`);--> statement-breakpoint
ALTER TABLE `projects` ADD `description` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `priority` text DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `contract_reference` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `purchase_order_reference` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `committed_minor` text DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `advance_basis_points` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `defects_liability_months` integer DEFAULT 6 NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `health` text DEFAULT 'on_track' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `site_manager_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `projects` ADD `archived_at` integer;
