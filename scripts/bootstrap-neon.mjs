import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const connectionString =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  console.log('[Star Africa] DATABASE_URL is not set; skipping Neon bootstrap.');
  process.exit(0);
}

const client = new Client({
  connectionString,
  ssl:
    /localhost|127\.0\.0\.1/.test(connectionString)
      ? false
      : { rejectUnauthorized: false },
});

function stripForeignKeyLines(statement) {
  if (!/^CREATE\s+TABLE/i.test(statement)) return statement;

  const lines = statement.split('\n');
  const kept = lines.filter(
    (line) => !/^\s*FOREIGN\s+KEY\s*\(/i.test(line),
  );

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

  let converted = statement.replace(
    /^INSERT\s+OR\s+IGNORE\s+INTO/i,
    'INSERT INTO',
  );
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

  // SQLite accepts text(N) as an affinity declaration. PostgreSQL does not
  // allow a length modifier on TEXT, so preserve the intended maximum width as
  // VARCHAR(N) where the generated D1 schema used text(N).
  statement = statement.replace(/\btext\s*\(\s*(\d+)\s*\)/gi, 'varchar($1)');

  // D1 stores timestamps and booleans in INTEGER columns. BIGINT keeps
  // millisecond timestamps safe in Postgres, while 0/1 preserves the existing
  // application representation for boolean-like values.
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
  statement = statement.replace(
    /^DROP\s+INDEX\s+(?!IF\s+EXISTS)/i,
    'DROP INDEX IF EXISTS ',
  );
  statement = statement.replace(
    /^DROP\s+TABLE\s+(?!IF\s+EXISTS)/i,
    'DROP TABLE IF EXISTS ',
  );

  if (/\bINSERT\s+OR\s+(?:REPLACE|ABORT|FAIL|ROLLBACK)\b/i.test(statement)) {
    throw new Error(
      `Unsupported SQLite insert conflict clause in migration: ${statement.slice(0, 120)}`,
    );
  }

  return statement;
}

async function migrationApplied(name) {
  const result = await client.query(
    'SELECT name FROM "_star_africa_migrations" WHERE name = $1 LIMIT 1',
    [name],
  );
  return result.rows.length > 0;
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

  console.log(
    `[Star Africa] Applying ${name} (${statements.length} statements)`,
  );

  await client.query('BEGIN');
  try {
    for (const statement of statements) {
      try {
        await client.query(statement);
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(
          `${name} failed near: ${statement.slice(0, 180)}\n${detail}`,
        );
      }
    }

    await client.query(
      'INSERT INTO "_star_africa_migrations" (name, applied_at) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
      [name, Date.now()],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function main() {
  await client.connect();
  await client.query(
    'CREATE TABLE IF NOT EXISTS "_star_africa_migrations" (name text PRIMARY KEY, applied_at bigint NOT NULL)',
  );

  const migrationDir = path.join(root, 'drizzle');
  const files = (await readdir(migrationDir))
    .filter((name) => /^\d.*\.sql$/i.test(name))
    .sort((a, b) => a.localeCompare(b));

  for (const name of files) {
    const source = await readFile(path.join(migrationDir, name), 'utf8');
    await applyMigration(name, source);
  }

  const result = await client.query(
    "SELECT COUNT(*)::int AS count FROM information_schema.tables WHERE table_schema = 'public'",
  );

  console.log(
    `[Star Africa] Neon bootstrap complete. Public tables: ${result.rows[0]?.count ?? 0}`,
  );
}

main()
  .catch((error) => {
    console.error('[Star Africa] Neon bootstrap failed.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end().catch(() => undefined);
  });
