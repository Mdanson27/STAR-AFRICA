import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from './schema';

/**
 * Netlify demo database adapter.
 *
 * The original production-oriented build used a Cloudflare D1 binding. For the
 * deployable demo we keep the existing Drizzle/SQLite schema and provide an
 * async proxy boundary instead of importing `cloudflare:workers`, which is not
 * available in Netlify Functions.
 *
 * Read-heavy demo screens already include server-owned seeded fallbacks. Until
 * the production database is wired, database calls fail explicitly rather than
 * silently pretending a write succeeded.
 */
export function getDb() {
  return drizzle(
    async () => {
      throw new Error(
        'Persistent relational storage is not configured for this demo request.',
      );
    },
    async () => {
      throw new Error(
        'Persistent relational storage is not configured for this demo request.',
      );
    },
    { schema },
  );
}
