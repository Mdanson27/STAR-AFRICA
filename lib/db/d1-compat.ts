import { neon } from '@neondatabase/serverless';
import { getStore } from '@netlify/blobs';

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

function postgresSql(source: string) {
  let statement = source.trim();
  const insertOrIgnore = /^INSERT\s+OR\s+IGNORE\s+INTO\b/i.test(statement);
  if (insertOrIgnore) {
    statement = statement.replace(/^INSERT\s+OR\s+IGNORE\s+INTO\b/i, 'INSERT INTO');
    statement = statement.replace(/;\s*$/, '');
    statement += ' ON CONFLICT DO NOTHING';
  }

  let index = 0;
  let singleQuoted = false;
  let doubleQuoted = false;
  let output = '';

  for (let i = 0; i < statement.length; i += 1) {
    const char = statement[i];

    if (char === "'" && !doubleQuoted) {
      if (singleQuoted && statement[i + 1] === "'") {
        output += "''";
        i += 1;
        continue;
      }
      singleQuoted = !singleQuoted;
      output += char;
      continue;
    }

    if (char === '"' && !singleQuoted) {
      if (doubleQuoted && statement[i + 1] === '"') {
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
      postgresSql(this.sqlText),
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
      postgresSql(this.sqlText),
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
      postgresSql(this.sqlText),
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

const filesStore = getStore('star-africa-documents');

const files = {
  async put(
    key: string,
    value: ArrayBuffer | Blob | string,
    _options?: unknown,
  ) {
    await filesStore.set(key, value);
  },
  async get(key: string) {
    return filesStore.get(key, { type: 'arrayBuffer' });
  },
  async delete(key: string) {
    await filesStore.delete(key);
  },
};

/**
 * Compatibility export for code that previously used Cloudflare bindings.
 * Netlify now provides the runtime while Neon supplies relational storage and
 * Netlify Blobs supplies file/object storage.
 */
export const env = {
  DB: new NeonD1Database(),
  FILES: files,
};
