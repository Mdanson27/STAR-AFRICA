# Integrations

Provider contracts live in `lib/providers/contracts.ts`.

| Capability | Available now | Production requirement |
| --- | --- | --- |
| Authentication | ChatGPT workspace identity | Hosting access policy / membership allowlist |
| Database | D1 + Drizzle | Sites-provisioned binding and migrations |
| File storage | R2 architecture | Sites-provisioned private bucket |
| Email | Development outbox | Selected provider credentials/domain validation |
| OCR | Deterministic demo extractor | OCR provider credentials and DPA review |
| Bid discovery | Manual/demo source contract | Portal/API-specific adapters and terms review |
| Bank data | CSV/import contract | Bank feed provider credentials/consent |
| Backups | Job/provider model | Destination, schedule, encryption and restore drills |
| QuickBooks | Import/mapping job model | Customer export files and reconciliation sign-off |

Development results carry their mode and a plain-language message. No integration may return a fake production success.
