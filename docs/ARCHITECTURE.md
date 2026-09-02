# Architecture

## System shape

```text
React UI
  → route handlers / server actions
    → domain services (accounting, invoices, workflows, permissions)
      → repositories / Drizzle
        → D1 relational data + R2 private files
```

External capabilities are ports in `lib/providers/contracts.ts`. Development adapters return an explicit `mode: development` result and never masquerade as a live send, extraction, import, or backup.

## Bounded business flow

```text
Bid → Project → Procurement → Goods Receipt → Supplier Bill → AP
                  ↓
             Stock Movement → Project Cost

Project → Invoice → AR → Payment → Bank Transaction → Reconciliation
   ↓          ↓
Retention   Journal Entry → Ledger → Reports
```

Every posting originates in the central accounting service. Source type plus source ID is unique, making repeated requests idempotent. Posted journals are reversed, never destructively edited. Important changes write append-only audit events.

## Runtime choices

The official Sites scaffold establishes Vinext, Cloudflare Workers-compatible ESM, D1, R2, and platform authentication. UI demo records are intentionally separated from durable services so management can explore the complete product surface before production provider configuration.
