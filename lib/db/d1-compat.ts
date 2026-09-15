import { neon } from '@neondatabase/serverless';

type Row = Record<string, unknown>;
type RunResult = {
  success: boolean;
  meta: {
    changes?: number;
    duration?: number;
    last_row_id?: number;
  };
};

type AllResult<T> = {
  results: T[];
  success: boolean;
  meta: Record<string, unknown>;
};

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error(
      'DATABASE_URL is not configured. Set the Neon connection string in Netlify environment variables.',
    );
  }
  return value;
}

function normalizeParams(values: unknown[]) {
  return values.map((value) => {
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'bigint') return value.toString();
    if (typeof value === 'boolean') return value ? 1 : 0;
    return value;
  });
}

/**
 * Convert D1/SQLite positional placeholders to PostgreSQL placeholders without
 * touching question marks that appear inside quoted SQL strings.
 */
function postgresPlaceholders(source: string) {
  let index = 0;
  let singleQuoted = false;
  let doubleQuoted = false;
  let output = '';

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (char === "'" && !doubleQuoted) {
      if (singleQuoted && source[i + 1] === "'") {
        output += "''";
        i += 1;
        continue;
      }
      singleQuoted = !singleQuoted;
      output += char;
      continue;
    }

    if (char === '"' && !singleQuoted) {
      if (doubleQuoted && source[i + 1] === '"') {
        output += '""';
        i += 1;
        continue;
      }
      doubleQuoted = !doubleQuoted;
      output += char;
      continue;
    }

    if (char === '?' && !singleQuoted && !doubleQuoted) {
      index += 1;
      output += `$${index}`;
      continue;
    }

    output += char;
  }

  return output;
}

function normalizeRow(row: Row) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => {
      if (typeof value === 'bigint') return [key, Number(value)];
      return [key, value];
    }),
  ) as Row;
}

class NeonPreparedStatement {
  private readonly sqlText: string;
  private readonly params: unknown[];

  constructor(sqlText: string, params: unknown[] = []) {
    this.sqlText = sqlText;
    this.params = params;
  }

  bind(...values: unknown[]) {
    return new NeonPreparedStatement(this.sqlText, values);
  }

  private async execute<T extends Row = Row>() {
    const client = neon(getDatabaseUrl());
    const rows = await client.query(
      postgresPlaceholders(this.sqlText),
      normalizeParams(this.params),
    );
    return (rows as Row[]).map(normalizeRow) as T[];
  }

  async first<T extends Row = Row>(): Promise<T | null> {
    const rows = await this.execute<T>();
    return rows[0] ?? null;
  }

  async all<T extends Row = Row>(): Promise<AllResult<T>> {
    const rows = await this.execute<T>();
    return { results: rows, success: true, meta: {} };
  }

  async run(): Promise<RunResult> {
    const client = neon(getDatabaseUrl());
    const result = await client.query(
      postgresPlaceholders(this.sqlText),
      normalizeParams(this.params),
      { fullResults: true },
    );
    return {
      success: true,
      meta: {
        changes:
          typeof result.rowCount === 'number' ? result.rowCount : undefined,
      },
    };
  }

  async raw<T extends unknown[] = unknown[]>(): Promise<T[]> {
    const client = neon(getDatabaseUrl());
    const result = await client.query(
      postgresPlaceholders(this.sqlText),
      normalizeParams(this.params),
      { arrayMode: true },
    );
    return result as T[];
  }
}

class NeonD1Database {
  prepare(sqlText: string) {
    return new NeonPreparedStatement(sqlText);
  }

  async batch(statements: NeonPreparedStatement[]) {
    const results: RunResult[] = [];
    for (const statement of statements) {
      results.push(await statement.run());
    }
    return results;
  }
}

/**
 * Compatibility export for code that previously used
 * `import { env } from 'cloudflare:workers'` and `env.DB`.
 *
 * This keeps the existing application routes stable while Netlify Functions use
 * Neon Postgres for persistence.
 */
export const env = {
  DB: new NeonD1Database(),
};
