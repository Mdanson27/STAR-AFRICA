# Database

The Drizzle schema contains 67 relational tables. It includes identity/RBAC, master data, bids, projects, procurement, inventory, sales, payables, double-entry accounting, banks, retention, payroll, documents, OCR, approvals, notifications, audit, email logs, backup and migration jobs.

## Financial representation

Amounts are never stored as JavaScript floating-point values. Each amount uses:

- a three-letter currency code; and
- an integer minor-unit value encoded as text in SQLite.

Services parse values with `BigInt`, preserving exact arithmetic beyond JavaScript’s safe integer range. Quantities use scaled integer strings. Percentages use integer basis points (500 = 5%). A PostgreSQL implementation can map the same contract to `numeric`.

## Integrity

- Foreign keys connect operational sources through to accounting.
- Company-scoped business references are unique.
- Journal source keys prevent duplicate postings.
- Common date/status/customer/project access paths are indexed.
- Posted state and period locks are explicit columns.
- Documents keep metadata in D1 and bytes in R2.

Migrations are in `drizzle/`; reproducible fictional demo records are in `db/seed.sql`.
