# Security

- Demo identity uses an HMAC-signed, HttpOnly, SameSite session cookie. The client never authorizes itself.
- Demo credentials are fixed fictional accounts, are labelled development-only, and require the explicit `STAR_AFRICA_DEMO_MODE` switch in production builds.
- API routes reject anonymous requests and enforce action permissions again on the server.
- Permission checks are modeled server-side; frontend visibility is not authorization.
- Zod validates external request payloads.
- Drizzle prepared statements protect query parameters.
- R2 objects remain private; access must use short-lived authorised URLs.
- Document implementations must enforce MIME allowlists (PDF/JPEG/PNG), size limits, hashes, and malware scanning before production.
- Financial source idempotency, period locks, balancing, reversals, and audit logs protect integrity.
- Secrets belong only in environment/provider configuration.
- Errors return safe user messages without database or provider secrets.

Before production rollout, disable demo mode and replace it with the approved workforce identity provider; then enforce company membership allowlists, provider-specific rate limits, backup restore exercises, security headers, dependency remediation, and an independent penetration test.
