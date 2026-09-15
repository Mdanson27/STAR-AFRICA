import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  console.log('[Star Africa] DATABASE_URL is not set; skipping Neon bootstrap.');
  process.exit(0);
}

const sql = neon(connectionString);

function stripForeignKeyLines(statement) {
  if (!/^CREATE\s+TABLE/i.test(statement)) return statement;

  const lines = statement.split('\n');
  const kept = lines.filter((line) => !/^\s*FOREIGN\s+KEY\s*\(/i.test(line));

  for (let index = kept.length - 1; index >= 0; index -= 1) {
    const trimmed = kept[index].trim();
    if (!trimmed || trimmed === ');') continue;
    kept[index] = kept[index].replace(/,\s*$/, '');
    break;
  }

  return kept.join('\n');
}

function addConflictIgnore(statement) {
  if (!/^INSERT\s+OR\s+IGNORE\s+INTO/i.test(statement)) return statement;

  let converted = statement.replace(/^INSERT\s+OR\s+IGNORE\s+INTO/i, 'INSERT INTO');
  converted = converted.replace(/;\s*$/, '');
  return `${converted}\nON CONFLICT DO NOTHING;`;
}

function postgresCompatible(source) {
  let statement = source.trim();
  if (!statement) return '';
  if (/^PRAGMA\b/i.test(statement)) return '';

  statement = stripForeignKeyLines(statement);
  statement = addConflictIgnore(statement);
  statement = statement.replace(/`/g, '"');
  statement = statement.replace(/\bAUTOINCREMENT\b/gi, '');

  // D1 stores timestamps and booleans in SQLite INTEGER columns. BIGINT keeps
  // millisecond timestamps safe in Postgres, while 0/1 preserves boolean mapping.
  statement = statement.replace(/\bDEFAULT\s+true\b/gi, 'DEFAULT 1');
  statement = statement.replace(/\bDEFAULT\s+false\b/gi, 'DEFAULT 0');
  statement = statement.replace(/\binteger\b/gi, 'bigint');

  statement = statement.replace(
    /^CREATE\s+UNIQUE\s+INDEX\s+(?!IF\s+NOT\s+EXISTS)/i,
    'CREATE UNIQUE INDEX IF NOT EXISTS ',
  );
  statement = statement.replace(
    /^CREATE\s+INDEX\s+(?!IF\s+NOT\s+EXISTS)/i,
    'CREATE INDEX IF NOT EXISTS ',
  );
  statement = statement.replace(
    /^CREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS)/i,
    'CREATE TABLE IF NOT EXISTS ',
  );
  statement = statement.replace(
    /^(ALTER\s+TABLE\s+[^\s]+\s+)ADD\s+(?!COLUMN\b|CONSTRAINT\b)/i,
    '$1ADD COLUMN IF NOT EXISTS ',
  );
  statement = statement.replace(
    /^(ALTER\s+TABLE\s+[^\s]+\s+)ADD\s+COLUMN\s+(?!IF\s+NOT\s+EXISTS)/i,
    '$1ADD COLUMN IF NOT EXISTS ',
  );
  statement = statement.replace(/^DROP\s+INDEX\s+(?!IF\s+EXISTS)/i, 'DROP INDEX IF EXISTS ');
  statement = statement.replace(/^DROP\s+TABLE\s+(?!IF\s+EXISTS)/i, 'DROP TABLE IF EXISTS ');

  // SQLite accepts "INSERT OR IGNORE"; the conversion above must happen before
  // this guard so unsupported SQLite-only variants never reach Postgres.
  if (/\bINSERT\s+OR\s+(?:REPLACE|ABORT|FAIL|ROLLBACK)\b/i.test(statement)) {
    throw new Error(`Unsupported SQLite insert conflict clause in migration: ${statement.slice(0, 120)}`);
  }

  return statement;
}

async function migrationApplied(name) {
  const rows = await sql.query(
    'SELECT name FROM "_star_africa_migrations" WHERE name = $1 LIMIT 1',
    [name],
  );
  return rows.length > 0;
}

async function applyMigration(name, source) {
  if (await migrationApplied(name)) {
    console.log(`[Star Africa] Neon migration already applied: ${name}`);
    return;
  }

  const statements = source
    .split('--> statement-breakpoint')
    .map(postgresCompatible)
    .filter(Boolean);

  console.log(`[Star Africa] Applying ${name} (${statements.length} statements)`);

  for (const statement of statements) {
    try {
      await sql.query(statement, []);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`${name} failed near: ${statement.slice(0, 180)}\n${detail}`);
    }
  }

  await sql.query(
    'INSERT INTO "_star_africa_migrations" (name, applied_at) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
    [name, Date.now()],
  );
}

async function main() {
  await sql.query(
    'CREATE TABLE IF NOT EXISTS "_star_africa_migrations" (name text PRIMARY KEY, applied_at bigint NOT NULL)',
    [],
  );

  const migrationDir = path.join(root, 'drizzle');
  const files = (await readdir(migrationDir))
    .filter((name) => /^\d.*\.sql$/i.test(name))
    .sort((a, b) => a.localeCompare(b));

  for (const name of files) {
    const source = await readFile(path.join(migrationDir, name), 'utf8');
    await applyMigration(name, source);
  }

  const [{ count }] = await sql.query(
    'SELECT COUNT(*)::int AS count FROM information_schema.tables WHERE table_schema = \'public\'',
    [],
  );

  console.log(`[Star Africa] Neon bootstrap complete. Public tables: ${count}`);
}

main().catch((error) => {
  console.error('[Star Africa] Neon bootstrap failed.');
  console.error(error);
  process.exit(1);
});
