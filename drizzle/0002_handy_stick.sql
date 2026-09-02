CREATE TABLE `bid_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`bid_id` text NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`linked_entity_type` text,
	`linked_entity_id` text,
	`summary` text NOT NULL,
	`occurred_at` integer NOT NULL,
	FOREIGN KEY (`bid_id`) REFERENCES `bids`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_bid_activity_timeline` ON `bid_activities` (`bid_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `bid_addenda` (
	`id` text PRIMARY KEY NOT NULL,
	`bid_id` text NOT NULL,
	`addendum_number` text NOT NULL,
	`issued_at` integer NOT NULL,
	`summary` text NOT NULL,
	`document_id` text,
	`impact_deadline` integer DEFAULT false NOT NULL,
	`impact_pricing` integer DEFAULT false NOT NULL,
	`impact_technical` integer DEFAULT false NOT NULL,
	`impact_requirements` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`bid_id`) REFERENCES `bids`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_bid_addendum_number` ON `bid_addenda` (`bid_id`,`addendum_number`);--> statement-breakpoint
CREATE TABLE `bid_approvals` (
	`id` text PRIMARY KEY NOT NULL,
	`bid_id` text NOT NULL,
	`type` text NOT NULL,
	`approver_id` text,
	`decision` text DEFAULT 'pending' NOT NULL,
	`comments` text,
	`decided_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`bid_id`) REFERENCES `bids`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approver_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_bid_approvals_pending` ON `bid_approvals` (`bid_id`,`type`,`decision`);--> statement-breakpoint
CREATE TABLE `bid_budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`bid_id` text NOT NULL,
	`category` text NOT NULL,
	`currency` text DEFAULT 'UGX' NOT NULL,
	`budget_minor` text NOT NULL,
	`actual_minor` text DEFAULT '0' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bid_id`) REFERENCES `bids`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_bid_budget_category` ON `bid_budgets` (`bid_id`,`category`);--> statement-breakpoint
CREATE TABLE `bid_clarifications` (
	`id` text PRIMARY KEY NOT NULL,
	`bid_id` text NOT NULL,
	`question` text NOT NULL,
	`raised_at` integer NOT NULL,
	`raised_by` text NOT NULL,
	`sent_to` text,
	`response` text,
	`response_at` integer,
	`document_id` text,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bid_id`) REFERENCES `bids`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`raised_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_bid_clarifications_status` ON `bid_clarifications` (`bid_id`,`status`);--> statement-breakpoint
CREATE TABLE `bid_communications` (
	`id` text PRIMARY KEY NOT NULL,
	`bid_id` text NOT NULL,
	`type` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`contact` text,
	`subject` text NOT NULL,
	`summary` text NOT NULL,
	`document_id` text,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`bid_id`) REFERENCES `bids`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_bid_communications_bid_date` ON `bid_communications` (`bid_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `bid_document_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`bid_id` text NOT NULL,
	`document_id` text NOT NULL,
	`document_type` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`requirement_id` text,
	`expires_at` integer,
	`verification_status` text DEFAULT 'pending' NOT NULL,
	`notes` text,
	`replaces_version_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`bid_id`) REFERENCES `bids`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requirement_id`) REFERENCES `bid_requirements`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_bid_document_version` ON `bid_document_versions` (`bid_id`,`document_type`,`version`);--> statement-breakpoint
CREATE INDEX `idx_bid_documents_expiry` ON `bid_document_versions` (`bid_id`,`expires_at`);--> statement-breakpoint
CREATE TABLE `bid_import_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`provider` text NOT NULL,
	`filename` text,
	`status` text DEFAULT 'uploaded' NOT NULL,
	`mapping_json` text,
	`inserted_count` integer DEFAULT 0 NOT NULL,
	`skipped_count` integer DEFAULT 0 NOT NULL,
	`duplicate_count` integer DEFAULT 0 NOT NULL,
	`error_count` integer DEFAULT 0 NOT NULL,
	`error_summary_json` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_bid_import_jobs_company` ON `bid_import_jobs` (`company_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `bid_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`bid_id` text NOT NULL,
	`author_id` text NOT NULL,
	`note` text NOT NULL,
	`pinned` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`bid_id`) REFERENCES `bids`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_bid_notes_bid_date` ON `bid_notes` (`bid_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `bid_pricing_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`sheet_id` text NOT NULL,
	`description` text NOT NULL,
	`unit` text NOT NULL,
	`quantity_thousandths` text NOT NULL,
	`unit_cost_minor` text NOT NULL,
	`markup_basis_points` integer DEFAULT 0 NOT NULL,
	`selling_unit_minor` text NOT NULL,
	`tax_basis_points` integer DEFAULT 0 NOT NULL,
	`line_total_minor` text NOT NULL,
	`supplier_source` text,
	`sequence` integer NOT NULL,
	FOREIGN KEY (`sheet_id`) REFERENCES `bid_pricing_sheets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_bid_pricing_lines_sheet` ON `bid_pricing_lines` (`sheet_id`,`sequence`);--> statement-breakpoint
CREATE TABLE `bid_pricing_sheets` (
	`id` text PRIMARY KEY NOT NULL,
	`bid_id` text NOT NULL,
	`name` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`currency` text DEFAULT 'UGX' NOT NULL,
	`direct_cost_minor` text DEFAULT '0' NOT NULL,
	`indirect_cost_minor` text DEFAULT '0' NOT NULL,
	`contingency_minor` text DEFAULT '0' NOT NULL,
	`tax_minor` text DEFAULT '0' NOT NULL,
	`bid_price_minor` text DEFAULT '0' NOT NULL,
	`expected_profit_minor` text DEFAULT '0' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bid_id`) REFERENCES `bids`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_bid_pricing_version` ON `bid_pricing_sheets` (`bid_id`,`version`);--> statement-breakpoint
CREATE TABLE `bid_qualification_criteria` (
	`id` text PRIMARY KEY NOT NULL,
	`qualification_id` text NOT NULL,
	`criterion` text NOT NULL,
	`weight_basis_points` integer NOT NULL,
	`score_basis_points` integer NOT NULL,
	`notes` text,
	`sequence` integer NOT NULL,
	FOREIGN KEY (`qualification_id`) REFERENCES `bid_qualifications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_bid_qualification_criterion` ON `bid_qualification_criteria` (`qualification_id`,`criterion`);--> statement-breakpoint
CREATE TABLE `bid_qualifications` (
	`id` text PRIMARY KEY NOT NULL,
	`bid_id` text NOT NULL,
	`score_basis_points` integer DEFAULT 0 NOT NULL,
	`recommendation` text DEFAULT 'review' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`decision` text,
	`decision_reason` text,
	`prepared_by` text,
	`decided_by` text,
	`decided_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bid_id`) REFERENCES `bids`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`prepared_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`decided_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_bid_qualification` ON `bid_qualifications` (`bid_id`);--> statement-breakpoint
CREATE INDEX `idx_bid_qualification_score` ON `bid_qualifications` (`score_basis_points`);--> statement-breakpoint
CREATE TABLE `bid_results` (
	`id` text PRIMARY KEY NOT NULL,
	`bid_id` text NOT NULL,
	`result` text NOT NULL,
	`decision_date` integer NOT NULL,
	`award_value_minor` text,
	`currency` text DEFAULT 'UGX' NOT NULL,
	`award_reference` text,
	`award_document_id` text,
	`evaluation_score_basis_points` integer,
	`technical_score_basis_points` integer,
	`financial_score_basis_points` integer,
	`loss_reason` text,
	`competitor_information` text,
	`lessons_learned` text,
	`recorded_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bid_id`) REFERENCES `bids`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`award_document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_bid_result` ON `bid_results` (`bid_id`);--> statement-breakpoint
CREATE TABLE `bid_securities` (
	`id` text PRIMARY KEY NOT NULL,
	`bid_id` text NOT NULL,
	`type` text NOT NULL,
	`issuer` text,
	`security_number` text,
	`amount_minor` text DEFAULT '0' NOT NULL,
	`currency` text DEFAULT 'UGX' NOT NULL,
	`issue_date` integer,
	`expiry_date` integer,
	`validity_days` integer,
	`beneficiary` text,
	`document_id` text,
	`fee_minor` text DEFAULT '0' NOT NULL,
	`status` text DEFAULT 'required' NOT NULL,
	`return_expected_at` integer,
	`returned_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bid_id`) REFERENCES `bids`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_bid_security_expiry` ON `bid_securities` (`status`,`expiry_date`);--> statement-breakpoint
CREATE INDEX `idx_bid_security_bid` ON `bid_securities` (`bid_id`);--> statement-breakpoint
CREATE TABLE `bid_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`bid_id` text NOT NULL,
	`method` text NOT NULL,
	`destination` text,
	`submitted_at` integer NOT NULL,
	`submitted_by` text NOT NULL,
	`reference_number` text,
	`receipt_document_id` text,
	`package_manifest_json` text NOT NULL,
	`notes` text,
	`status` text DEFAULT 'submitted' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`bid_id`) REFERENCES `bids`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`submitted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`receipt_document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_bid_submissions_bid_date` ON `bid_submissions` (`bid_id`,`submitted_at`);--> statement-breakpoint
CREATE TABLE `bid_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`bid_id` text NOT NULL,
	`requirement_id` text,
	`title` text NOT NULL,
	`owner_id` text,
	`due_at` integer,
	`priority` text DEFAULT 'normal' NOT NULL,
	`status` text DEFAULT 'not_started' NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bid_id`) REFERENCES `bids`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requirement_id`) REFERENCES `bid_requirements`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_bid_tasks_due_status` ON `bid_tasks` (`bid_id`,`status`,`due_at`);--> statement-breakpoint
CREATE TABLE `bid_team_members` (
	`id` text PRIMARY KEY NOT NULL,
	`bid_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`responsibility` text,
	`assigned_at` integer NOT NULL,
	`assigned_by` text NOT NULL,
	FOREIGN KEY (`bid_id`) REFERENCES `bids`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_bid_team_member_role` ON `bid_team_members` (`bid_id`,`user_id`,`role`);--> statement-breakpoint
CREATE TABLE `bid_watches` (
	`bid_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`bid_id`) REFERENCES `bids`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_bid_watch` ON `bid_watches` (`bid_id`,`user_id`);--> statement-breakpoint
ALTER TABLE `bid_expenses` ADD `expense_number` text DEFAULT 'UNASSIGNED' NOT NULL;--> statement-breakpoint
ALTER TABLE `bid_expenses` ADD `supplier_payee` text;--> statement-breakpoint
ALTER TABLE `bid_expenses` ADD `tax_minor` text DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `bid_expenses` ADD `payment_method` text;--> statement-breakpoint
ALTER TABLE `bid_expenses` ADD `receipt_document_id` text REFERENCES documents(id);--> statement-breakpoint
ALTER TABLE `bid_expenses` ADD `approval_status` text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `bid_expenses` ADD `accounting_status` text DEFAULT 'unposted' NOT NULL;--> statement-breakpoint
ALTER TABLE `bid_expenses` ADD `approved_by` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `bid_expenses` ADD `approved_at` integer;--> statement-breakpoint
ALTER TABLE `bid_requirements` ADD `description` text;--> statement-breakpoint
ALTER TABLE `bid_requirements` ADD `category` text DEFAULT 'administrative' NOT NULL;--> statement-breakpoint
ALTER TABLE `bid_requirements` ADD `owner_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `bid_requirements` ADD `due_at` integer;--> statement-breakpoint
ALTER TABLE `bid_requirements` ADD `status` text DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE `bid_requirements` ADD `verified_by` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `bid_requirements` ADD `verified_at` integer;--> statement-breakpoint
ALTER TABLE `bid_requirements` ADD `supporting_document_id` text REFERENCES documents(id);--> statement-breakpoint
ALTER TABLE `bids` ADD `description` text;--> statement-breakpoint
ALTER TABLE `bids` ADD `subcategory` text;--> statement-breakpoint
ALTER TABLE `bids` ADD `location` text;--> statement-breakpoint
ALTER TABLE `bids` ADD `procurement_method` text;--> statement-breakpoint
ALTER TABLE `bids` ADD `clarification_deadline` integer;--> statement-breakpoint
ALTER TABLE `bids` ADD `pre_bid_meeting_at` integer;--> statement-breakpoint
ALTER TABLE `bids` ADD `site_visit_at` integer;--> statement-breakpoint
ALTER TABLE `bids` ADD `expected_award_at` integer;--> statement-breakpoint
ALTER TABLE `bids` ADD `tender_fee_minor` text DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `bids` ADD `security_required` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `bids` ADD `bid_validity_days` integer;--> statement-breakpoint
ALTER TABLE `bids` ADD `eligibility_notes` text;--> statement-breakpoint
ALTER TABLE `bids` ADD `priority` text DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE `bids` ADD `tags_json` text;--> statement-breakpoint
ALTER TABLE `bids` ADD `archived_at` integer;
