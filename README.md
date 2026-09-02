# STAR AFRICA OS

The product uses the supplied Star Africa Logistics logo and its official navy, grey, and white identity across the shell, authentication, operational modules, charts, tables, loading states, and printable documents.

STAR AFRICA OS is a connected business-management foundation for Star Africa’s Ugandan operations. It follows work and money from opportunity discovery through tendering, project delivery, procurement, materials, invoicing, collection, retention, accounting, reconciliation, and management reporting.

## Stack

- Vinext / React 19 / TypeScript, Tailwind CSS, shadcn/ui, Recharts
- Cloudflare D1 with Drizzle ORM for relational operational data
- Cloudflare R2 for private documents and generated exports
- ChatGPT workspace identity for hosted authentication
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

Open `http://localhost:3000`. Local Sites authentication supplies a development identity; hosted access uses ChatGPT workspace sign-in.

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

`db/seed.sql` creates fictional Ugandan-style customers, suppliers, users, projects, a bid, inventory, accounts, tax configuration, and an invoice. All addresses and emails use non-sensitive demo values. There are no password credentials: authentication is delegated to the workspace identity provider.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Modules](docs/MODULES.md)
- [Database](docs/DATABASE.md)
- [Accounting](docs/ACCOUNTING.md)
- [Integrations](docs/INTEGRATIONS.md)
- [Security](docs/SECURITY.md)
- [Roadmap](docs/ROADMAP.md)
