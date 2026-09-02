# Delivery classification

## Fully functional now

- Responsive enterprise shell and all primary module routes
- Filters, tab views, record inspection, CSV export, loading/error/empty states
- Exact money, invoice, retention, allocation, approval-band and bid-conversion logic
- Balanced journal validation, invoice/payment posting drafts and reversal logic
- Relational 67-table schema, migrations and demo seed
- Provider contracts, API validation, RBAC policy logic and critical unit tests

## Functional using development/demo provider

- Populated management dashboard and all module records
- Record creation acknowledgement (explicitly non-persistent until local/hosted migration)
- Email outbox, OCR extraction, bid-source and bank-import boundaries

## Structure complete but requires external credential/API/infrastructure

- Live email delivery and delivery tracking
- Production OCR
- Automated bid-portal collection
- Live bank feeds
- Scheduled encrypted backups and point-in-time recovery
- QuickBooks data import/reconciliation using customer exports
- PDF/XLSX generation and malware scanning provider

## Important next phase

1. Apply migrations to a provisioned D1 environment and replace demo query sources with repositories.
2. Implement durable server actions for the acceptance workflows, starting bid → project and invoice → payment → journal.
3. Add approval inbox, file upload streaming to R2, signed document access, and provider configuration.
4. Complete printable documents and report exports.
5. Run user-acceptance testing with Finance, Projects, Procurement, Bids, HR, and directors.

Production rollout additionally requires statutory tax/payroll rule verification, accounting opening-balance reconciliation, provider security review, performance/load testing, backup restoration drills, and role-by-role access sign-off.
