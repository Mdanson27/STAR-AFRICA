import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from './schema';

type ProxyMethod = 'all' | 'run' | 'get' | 'values';
type ProxyQuery = { sql: string; params: unknown[]; method: ProxyMethod };

/**
 * The application was originally modelled with Drizzle's SQLite dialect for
 * Cloudflare D1. The demo now runs on Netlify with Neon Postgres. Keeping the
 * existing schema/query builders avoids a risky application-wide rewrite, while
 * this adapter translates SQLite-style positional placeholders to PostgreSQL.
 *
 * The Neon bootstrap script creates a Postgres-compatible copy of the existing
 * D1 schema. Integer-backed booleans and millisecond timestamps remain BIGINTs,
 * so the application sees the same driver values it saw with D1.
 */
function databaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error('DATABASE_URL is not configured for the Star Africa demo.');
  }
  return value;
}

function postgresPlaceholders(sql: string) {
  let index = 0;
  let singleQuoted = false;
  let doubleQuoted = false;
  let output = '';

  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i];
    const previous = sql[i - 1];

    if (char === "'" && !doubleQuoted && previous !== '\\') {
      // SQL escapes a quote by doubling it. Do not toggle on the second quote.
      if (singleQuoted && sql[i + 1] === "'") {
        output += "''";
        i += 1;
        continue;
      }
      singleQuoted = !singleQuoted;
      output += char;
      continue;
    }

    if (char === '"' && !singleQuoted && previous !== '\\') {
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

function normalizeParams(params: unknown[]) {
  return params.map((value) => {
    if (typeof value === 'bigint') return value.toString();
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (value instanceof Date) return value.getTime();
    return value;
  });
}

function normalizeResultRows(rows: unknown[][], fields: Array<{ dataTypeID?: number }> = []) {
  return rows.map((row) =>
    row.map((value, columnIndex) => {
      // PostgreSQL int8 values are strings in many JS drivers. Our SQLite schema
      // expects integer-backed booleans/timestamps/counts as JS numbers.
      if (fields[columnIndex]?.dataTypeID === 20 && typeof value === 'string') {
        const numeric = Number(value);
        if (Number.isSafeInteger(numeric)) return numeric;
      }
      return value;
    }),
  );
}

async function executeProxyQuery(query: ProxyQuery) {
  const sqlClient = neon(databaseUrl());
  const result = await sqlClient.query(
    postgresPlaceholders(query.sql),
    normalizeParams(query.params),
    { arrayMode: true, fullResults: true },
  );

  return {
    rows: normalizeResultRows(
      (result.rows ?? []) as unknown[][],
      (result.fields ?? []) as Array<{ dataTypeID?: number }>,
    ),
  };
}

export function getDb() {
  return drizzle(
    async (sql, params, method) =>
      executeProxyQuery({
        sql,
        params: params as unknown[],
        method: method as ProxyMethod,
      }),
    async (queries) => {
      // sqlite-proxy exposes batch as a separate callback. Execute in order so
      // dependent inserts (customer -> project -> activity, etc.) remain
      // deterministic. The demo APIs already surface any failure to the caller.
      const results = [];
      for (const query of queries) {
        results.push(
          await executeProxyQuery({
            sql: query.sql,
            params: query.params as unknown[],
            method: query.method as ProxyMethod,
          }),
        );
      }
      return results;
    },
    { schema },
  );
}
