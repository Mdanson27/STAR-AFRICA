# Security

- Hosted identity uses platform-provided, server-read authentication headers.
- API routes reject anonymous production requests.
- Permission checks are modeled server-side; frontend visibility is not authorization.
- Zod validates external request payloads.
- Drizzle prepared statements protect query parameters.
- R2 objects remain private; access must use short-lived authorised URLs.
- Document implementations must enforce MIME allowlists (PDF/JPEG/PNG), size limits, hashes, and malware scanning before production.
- Financial source idempotency, period locks, balancing, reversals, and audit logs protect integrity.
- Secrets belong only in environment/provider configuration.
- Errors return safe user messages without database or provider secrets.

Before production rollout, enforce company membership allowlists, provider-specific rate limits, backup restore exercises, security headers, dependency remediation, and an independent penetration test.
