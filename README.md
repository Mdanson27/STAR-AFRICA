# STAR AFRICA OS

The product uses the supplied Star Africa Logistics logo and its official navy, grey, and white identity across the shell, authentication, operational modules, charts, tables, loading states, and printable documents.

STAR AFRICA OS is a connected business-management foundation for Star Africa’s Ugandan operations. It follows work and money from opportunity discovery through tendering, project delivery, procurement, materials, invoicing, collection, retention, accounting, reconciliation, and management reporting.

## Stack

- Vinext / React 19 / TypeScript, Tailwind CSS, shadcn/ui, Recharts
- Cloudflare D1 with Drizzle ORM for relational operational data
- Cloudflare R2 for private documents and generated exports
- Signed, HttpOnly demonstration sessions with server-side role enforcement
- Exact integer-minor-unit money arithmetic with `bigint` in services and text storage in SQLite
- Zod validation at API boundaries; server-side RBAC contracts

The Sites runtime uses D1 rather than PostgreSQL because hosted Sites exposes D1/R2 bindings and does not support raw TCP database connections. The domain/service boundaries and exact-money representation are portable to PostgreSQL if deployment later moves to a platform with managed PostgreSQL.

## Run locally

```powershell
npm.cmd install
npm.cmd run db:migrate:local
npm.cmd run db:seed:local
npm.cmd run dev
```

Open `http://localhost:3000`. The demo login redirects successful sign-in to `/dashboard`.

## Quality commands

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

## Environment

Copy `.env.example` to `.env.local` for optional providers. Never commit live credentials. The D1 `DB` and R2 `FILES` bindings are declared in `.openai/hosting.json` and supplied by Sites locally/when deployed.

## Demo data

`db/seed.sql` creates fictional Ugandan-style users, roles, bid opportunities, qualification, requirements, expenses, security, approvals, activity and notifications alongside the existing operational examples. All records are fictional and non-confidential.

Development/demo credentials only (shared password: `Demo123!`):

- `admin@starafrica.demo` — Super Admin
- `director@starafrica.demo` — Director
- `finance@starafrica.demo` — Finance Admin
- `accountant@starafrica.demo` — Accountant
- `bids@starafrica.demo` — Bids & Tenders Officer
- `projects@starafrica.demo` — Project Manager
- `procurement@starafrica.demo` — Procurement Officer
- `hr@starafrica.demo` — HR / Payroll
- `auditor@starafrica.demo` — Auditor / Viewer

`STAR_AFRICA_DEMO_MODE=true` and a strong `DEMO_SESSION_SECRET` are required when deliberately publishing the demo sign-in flow. Never enable demo accounts in a production employee environment.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Modules](docs/MODULES.md)
- [Database](docs/DATABASE.md)
- [Accounting](docs/ACCOUNTING.md)
- [Integrations](docs/INTEGRATIONS.md)
- [Security](docs/SECURITY.md)
- [Roadmap](docs/ROADMAP.md)
