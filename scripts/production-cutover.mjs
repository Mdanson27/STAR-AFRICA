import pg from 'pg';

const { Client } = pg;

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const confirmation = process.env.STAR_AFRICA_CONFIRM_CUTOVER;
const backupAck = process.env.STAR_AFRICA_CUTOVER_BACKUP_ID;

if (!databaseUrl) throw new Error('DATABASE_URL is required.');
if (confirmation !== 'DELETE_DEMO_DATA_PRODUCTION_V1') {
  throw new Error(
    'Cutover refused. Set STAR_AFRICA_CONFIRM_CUTOVER=DELETE_DEMO_DATA_PRODUCTION_V1 only after backup and release validation.',
  );
}
if (!backupAck) {
  throw new Error(
    'Cutover refused. Set STAR_AFRICA_CUTOVER_BACKUP_ID to the verified Neon backup branch ID.',
  );
}

const preserve = new Set([
  '_star_africa_migrations',
  'companies',
  'roles',
  'permissions',
  'role_permissions',
  'positions',
  'departments',
  'project_stages',
  'business_categories',
]);

const client = new Client({
  connectionString: databaseUrl,
  ssl: /localhost|127\.0\.0\.1/.test(databaseUrl)
    ? false
    : { rejectUnauthorized: false },
});

await client.connect();

try {
  const tablesResult = await client.query(
    `SELECT tablename
     FROM pg_tables
     WHERE schemaname='public'
     ORDER BY tablename`,
  );

  const truncate = tablesResult.rows
    .map((row) => String(row.tablename))
    .filter((name) => !preserve.has(name));

  if (!truncate.length) {
    console.log('[Star Africa] No business/demo tables require clearing.');
    process.exit(0);
  }

  const before = {};
  for (const table of truncate) {
    const result = await client.query(
      `SELECT COUNT(*)::int AS count FROM "${table.replaceAll('"', '""')}"`,
    );
    before[table] = Number(result.rows[0]?.count ?? 0);
  }

  await client.query('BEGIN');
  try {
    const quoted = truncate
      .map((table) => `"${table.replaceAll('"', '""')}"`)
      .join(', ');
    await client.query(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);

    await client.query(
      `UPDATE companies
       SET name='Star Africa Logistics Company Ltd',
           country_code='UG',
           base_currency='UGX',
           timezone='Africa/Kampala',
           updated_at=$1
       WHERE id='company-star-africa'`,
      [Date.now()],
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }

  const removedRows = Object.values(before).reduce(
    (total, count) => total + Number(count),
    0,
  );

  console.log(
    `[Star Africa] Production cutover complete. Cleared ${truncate.length} business/demo tables containing ${removedRows} rows.`,
  );
  console.log(
    `[Star Africa] Preserved structural tables: ${Array.from(preserve).join(', ')}.`,
  );
  console.log(
    `[Star Africa] Backup acknowledgement: ${backupAck}. Next: import QuickBooks master data, then provision real administrator accounts.`,
  );
} finally {
  await client.end();
}
