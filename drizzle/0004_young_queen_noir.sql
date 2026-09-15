CREATE TABLE `document_field_corrections` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`field_name` text NOT NULL,
	`ocr_value` text,
	`confirmed_value` text,
	`corrected_by` text NOT NULL,
	`corrected_at` integer NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`corrected_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_document_corrections_document` ON `document_field_corrections` (`document_id`);--> statement-breakpoint
CREATE TABLE `receipt_line_items` (
	`id` text PRIMARY KEY NOT NULL,
	`receipt_id` text NOT NULL,
	`description` text NOT NULL,
	`quantity_minor` text DEFAULT '1000' NOT NULL,
	`unit` text,
	`unit_price_minor` text DEFAULT '0' NOT NULL,
	`tax_minor` text DEFAULT '0' NOT NULL,
	`line_total_minor` text DEFAULT '0' NOT NULL,
	`sequence` integer NOT NULL,
	FOREIGN KEY (`receipt_id`) REFERENCES `receipt_records`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_receipt_lines_receipt` ON `receipt_line_items` (`receipt_id`);--> statement-breakpoint
CREATE TABLE `receipt_records` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`internal_number` text NOT NULL,
	`document_id` text NOT NULL,
	`supplier_id` text,
	`supplier_name_raw` text,
	`supplier_tin` text,
	`business_address` text,
	`telephone` text,
	`receipt_number` text,
	`invoice_number` text,
	`receipt_date` integer,
	`receipt_time` text,
	`currency` text DEFAULT 'UGX' NOT NULL,
	`subtotal_minor` text DEFAULT '0' NOT NULL,
	`discount_minor` text DEFAULT '0' NOT NULL,
	`vat_amount_minor` text DEFAULT '0' NOT NULL,
	`vat_rate_basis_points` integer,
	`vat_treatment` text DEFAULT 'unknown' NOT NULL,
	`other_tax_minor` text DEFAULT '0' NOT NULL,
	`total_minor` text DEFAULT '0' NOT NULL,
	`amount_paid_minor` text DEFAULT '0' NOT NULL,
	`change_minor` text DEFAULT '0' NOT NULL,
	`payment_method` text,
	`transaction_reference` text,
	`cashier` text,
	`customer_name` text,
	`notes` text,
	`ocr_snapshot_json` text,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`reviewed_by` text NOT NULL,
	`reviewed_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_receipts_company_number` ON `receipt_records` (`company_id`,`internal_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_receipts_document` ON `receipt_records` (`document_id`);--> statement-breakpoint
CREATE INDEX `idx_receipts_duplicate` ON `receipt_records` (`company_id`,`receipt_number`,`receipt_date`,`total_minor`);--> statement-breakpoint
CREATE INDEX `idx_receipts_supplier` ON `receipt_records` (`supplier_id`);--> statement-breakpoint
ALTER TABLE `documents` ADD `internal_number` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `original_filename` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `title` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `category` text DEFAULT 'Other' NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `reference_number` text;--> statement-breakpoint
ALTER TABLE `documents` ADD `document_date` integer;--> statement-breakpoint
ALTER TABLE `documents` ADD `description` text;--> statement-breakpoint
ALTER TABLE `documents` ADD `related_module` text;--> statement-breakpoint
ALTER TABLE `documents` ADD `related_record_id` text;--> statement-breakpoint
ALTER TABLE `documents` ADD `tags_json` text;--> statement-breakpoint
ALTER TABLE `documents` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `documents` ADD `ocr_required` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `raw_ocr_text` text;--> statement-breakpoint
ALTER TABLE `documents` ADD `archived_at` integer;--> statement-breakpoint
UPDATE `documents` SET `internal_number` = 'DOC-MIGRATED-' || substr(`id`, 1, 12), `original_filename` = `filename`, `title` = `filename` WHERE `internal_number` = '';--> statement-breakpoint
CREATE UNIQUE INDEX `uq_documents_company_number` ON `documents` (`company_id`,`internal_number`);--> statement-breakpoint
CREATE INDEX `idx_documents_company_category` ON `documents` (`company_id`,`category`);--> statement-breakpoint
CREATE INDEX `idx_documents_company_hash` ON `documents` (`company_id`,`sha256`);--> statement-breakpoint
ALTER TABLE `ocr_jobs` ADD `provider_mode` text DEFAULT 'development' NOT NULL;--> statement-breakpoint
ALTER TABLE `ocr_jobs` ADD `document_type` text;--> statement-breakpoint
ALTER TABLE `ocr_jobs` ADD `raw_text` text;--> statement-breakpoint
ALTER TABLE `ocr_jobs` ADD `warnings_json` text;--> statement-breakpoint
ALTER TABLE `ocr_jobs` ADD `error_message` text;--> statement-breakpoint
ALTER TABLE `ocr_jobs` ADD `completed_at` integer;--> statement-breakpoint
CREATE INDEX `idx_ocr_jobs_status` ON `ocr_jobs` (`status`);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id,code,description) VALUES
('perm-documents-view','documents.view','View permitted company documents'),
('perm-documents-upload','documents.upload','Upload and manually capture documents'),
('perm-documents-edit','documents.edit','Edit document metadata and OCR review drafts'),
('perm-documents-delete','documents.delete','Archive or delete documents with safeguards'),
('perm-documents-ocr','documents.ocr','Run or retry document OCR'),
('perm-documents-verify','documents.verify','Confirm reviewed document data'),
('perm-documents-download','documents.download','Download original documents');
--> statement-breakpoint
INSERT OR IGNORE INTO role_permissions (role_id,permission_id) SELECT 'role-super',id FROM permissions WHERE code LIKE 'documents.%';
--> statement-breakpoint
INSERT OR IGNORE INTO role_permissions (role_id,permission_id) SELECT 'role-director',id FROM permissions WHERE code LIKE 'documents.%';
--> statement-breakpoint
INSERT OR IGNORE INTO role_permissions (role_id,permission_id) SELECT role.id,permission.id FROM roles role CROSS JOIN permissions permission WHERE role.id IN ('role-finance','role-accountant','role-procurement','role-project','role-site','role-bids') AND permission.code IN ('documents.view','documents.upload','documents.edit','documents.ocr','documents.verify','documents.download');
--> statement-breakpoint
INSERT OR IGNORE INTO role_permissions (role_id,permission_id) SELECT role.id,permission.id FROM roles role CROSS JOIN permissions permission WHERE role.id IN ('role-hr','role-auditor') AND permission.code IN ('documents.view','documents.download');
--> statement-breakpoint
PRAGMA optimize;
