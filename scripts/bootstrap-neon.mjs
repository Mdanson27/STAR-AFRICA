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

function splitSqlStatements(source) {
  const statements = [];
  let current = '';
  let single = false;
  let double = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (char === "'" && !double) {
      if (single && source[index + 1] === "'") {
        current += "''";
        index += 1;
        continue;
      }
      single = !single;
      current += char;
      continue;
    }

    if (char === '"' && !single) {
      if (double && source[index + 1] === '"') {
        current += '""';
        index += 1;
        continue;
      }
      double = !double;
      current += char;
      continue;
    }

    if (char === ';' && !single && !double) {
      if (current.trim()) statements.push(`${current.trim()};`);
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) statements.push(current.trim());
  return statements;
}

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
  statement = statement.replace(/\btext\s*\(\s*(\d+)\s*\)/gi, 'varchar($1)');
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

function splitSqlList(value) {
  const parts = [];
  let current = '';
  let depth = 0;
  let single = false;
  let double = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === "'" && !double) {
      if (single && value[index + 1] === "'") {
        current += "''";
        index += 1;
        continue;
      }
      single = !single;
    } else if (char === '"' && !single) {
      double = !double;
    } else if (!single && !double) {
      if (char === '(') depth += 1;
      if (char === ')') depth -= 1;
      if (char === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
        continue;
      }
    }
    current += char;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

async function adaptSqliteRebuildCopy(statement) {
  const match = statement.match(
    /^INSERT\s+INTO\s+"(__new_[^"]+)"\s*\(([^]+?)\)\s+SELECT\s+([^]+?)\s+FROM\s+"([^"]+)"\s*;?$/i,
  );
  if (!match) return statement;

  const [, targetTable, targetList, selectList, sourceTable] = match;
  const sourceColumnsResult = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [sourceTable],
  );
  const sourceColumns = new Set(
    sourceColumnsResult.rows.map((row) => row.column_name),
  );

  const targets = splitSqlList(targetList);
  const expressions = splitSqlList(selectList);
  if (targets.length !== expressions.length) return statement;

  let changed = false;
  const adaptedExpressions = expressions.map((expression) => {
    const simpleColumn = expression.match(/^"([^"]+)"$/);
    if (simpleColumn && !sourceColumns.has(simpleColumn[1])) {
      changed = true;
      console.log(
        `[Star Africa] SQLite rebuild: ${sourceTable}.${simpleColumn[1]} did not exist yet; using NULL while copying into ${targetTable}.`,
      );
      return 'NULL';
    }
    return expression;
  });

  if (!changed) return statement;
  return `INSERT INTO "${targetTable}"(${targets.join(', ')}) SELECT ${adaptedExpressions.join(', ')} FROM "${sourceTable}";`;
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
    .flatMap(splitSqlStatements)
    .map(postgresCompatible)
    .filter(Boolean);

  console.log(
    `[Star Africa] Applying ${name} (${statements.length} statements)`,
  );

  await client.query('BEGIN');
  try {
    for (const originalStatement of statements) {
      const statement = await adaptSqliteRebuildCopy(originalStatement);
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
