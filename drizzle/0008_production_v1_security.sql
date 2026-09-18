-- Production V1 security, authentication, provenance and migration support.
-- This migration is intentionally data-preserving. Demo removal/import is handled
-- by the dedicated production cutover script after validation.

ALTER TABLE users ADD COLUMN password_hash text;
ALTER TABLE users ADD COLUMN must_change_password integer NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN failed_login_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until integer;
ALTER TABLE users ADD COLUMN last_login_at integer;
ALTER TABLE users ADD COLUMN password_changed_at integer;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_company_email
  ON users(company_id, email);

ALTER TABLE customers ADD COLUMN source_system text;
ALTER TABLE customers ADD COLUMN source_ref text;
ALTER TABLE customers ADD COLUMN source_imported_at integer;

ALTER TABLE suppliers ADD COLUMN address text;
ALTER TABLE suppliers ADD COLUMN fax text;
ALTER TABLE suppliers ADD COLUMN source_system text;
ALTER TABLE suppliers ADD COLUMN source_ref text;
ALTER TABLE suppliers ADD COLUMN source_imported_at integer;

ALTER TABLE accounts ADD COLUMN legacy_opening_balance_minor text;
ALTER TABLE accounts ADD COLUMN legacy_opening_balance_raw text;
ALTER TABLE accounts ADD COLUMN source_system text;
ALTER TABLE accounts ADD COLUMN source_ref text;
ALTER TABLE accounts ADD COLUMN source_imported_at integer;

CREATE INDEX IF NOT EXISTS idx_accounts_source_ref
  ON accounts(company_id, source_system, source_ref);

CREATE TABLE auth_sessions (
  id text PRIMARY KEY NOT NULL,
  company_id text NOT NULL,
  user_id text NOT NULL,
  token_hash text NOT NULL,
  expires_at integer NOT NULL,
  last_seen_at integer NOT NULL,
  revoked_at integer,
  ip_hash text,
  user_agent_hash text,
  created_at integer NOT NULL,
  updated_at integer NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_auth_sessions_token_hash ON auth_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_expiry ON auth_sessions(user_id, expires_at);

CREATE TABLE rate_limit_buckets (
  id text PRIMARY KEY NOT NULL,
  key_hash text NOT NULL,
  action text NOT NULL,
  window_start integer NOT NULL,
  count integer NOT NULL DEFAULT 0,
  blocked_until integer,
  updated_at integer NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_rate_limit_key_action ON rate_limit_buckets(key_hash, action);
CREATE INDEX IF NOT EXISTS idx_rate_limit_blocked ON rate_limit_buckets(blocked_until);

CREATE TABLE security_events (
  id text PRIMARY KEY NOT NULL,
  company_id text,
  user_id text,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  route text,
  method text,
  request_id text,
  ip_hash text,
  user_agent_hash text,
  details_json text,
  occurred_at integer NOT NULL,
  resolved_at integer
);
CREATE INDEX IF NOT EXISTS idx_security_events_date ON security_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type, occurred_at);

CREATE TABLE data_import_batches (
  id text PRIMARY KEY NOT NULL,
  company_id text NOT NULL,
  source_system text NOT NULL,
  source_file_name text NOT NULL,
  source_export_date text,
  source_export_timestamp text,
  status text NOT NULL DEFAULT 'pending',
  record_counts_json text,
  notes text,
  started_at integer NOT NULL,
  completed_at integer
);
CREATE INDEX IF NOT EXISTS idx_import_batches_company_date ON data_import_batches(company_id, started_at);

CREATE TABLE record_provenance (
  id text PRIMARY KEY NOT NULL,
  batch_id text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  source_record_type text NOT NULL,
  source_ref text,
  source_snapshot_json text NOT NULL,
  imported_at integer NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_record_provenance_entity_batch
  ON record_provenance(batch_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_record_provenance_source
  ON record_provenance(source_record_type, source_ref);

CREATE TABLE catalog_items (
  id text PRIMARY KEY NOT NULL,
  company_id text NOT NULL,
  name text NOT NULL,
  item_type text NOT NULL,
  income_account_name text,
  description text,
  price_text text,
  cost_text text,
  taxable integer NOT NULL DEFAULT 0,
  tax_code text,
  tax_vendor text,
  preferred_vendor text,
  source_system text NOT NULL,
  source_ref text NOT NULL,
  source_imported_at integer NOT NULL,
  active integer NOT NULL DEFAULT 1,
  created_at integer NOT NULL,
  updated_at integer NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_catalog_source_ref
  ON catalog_items(company_id, source_system, source_ref);
CREATE INDEX IF NOT EXISTS idx_catalog_name ON catalog_items(company_id, name);

CREATE TABLE legacy_reference_values (
  id text PRIMARY KEY NOT NULL,
  company_id text NOT NULL,
  category text NOT NULL,
  label text NOT NULL,
  source_ref text NOT NULL,
  metadata_json text,
  source_system text NOT NULL DEFAULT 'QuickBooks',
  imported_at integer NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_legacy_reference_value
  ON legacy_reference_values(company_id, category, source_ref);
