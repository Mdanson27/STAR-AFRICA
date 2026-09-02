# Accounting

STAR AFRICA OS uses double-entry accounting. `lib/domain/accounting.ts` is the central posting engine; React components must not construct or mutate ledger balances.

## Invariants

- Total debits must equal total credits before posting.
- Every journal line has exactly one non-zero side.
- Source type + source ID is an idempotency key.
- A locked period rejects new posting in the repository layer.
- Posted entries are corrected through linked reversals or adjustments.
- Customer, supplier, and project dimensions preserve traceability.

## Standard postings

| Event | Debit | Credit |
| --- | --- | --- |
| Invoice issued | Accounts Receivable; Retention Receivable | Revenue; Output VAT |
| Customer receipt | Bank/Cash | Accounts Receivable |
| Supplier bill | Expense/Inventory/Input VAT | Accounts Payable |
| Supplier payment | Accounts Payable | Bank |
| Director contribution | Bank | Director Contribution/Loan |

Tax percentages, payroll deductions, approval bands, and retention are configuration, never permanent legislation in source code.
