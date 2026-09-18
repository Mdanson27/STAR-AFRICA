import pg from 'pg';
import { randomBytes, randomUUID, scrypt as nodeScrypt } from 'node:crypto';
import { promisify } from 'node:util';

const { Client } = pg;
const scrypt = promisify(nodeScrypt);

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const email = process.env.STAR_AFRICA_ADMIN_EMAIL?.trim().toLowerCase();
const name = process.env.STAR_AFRICA_ADMIN_NAME?.trim();
const password = process.env.STAR_AFRICA_ADMIN_PASSWORD;
const companyId = 'company-star-africa';

if (!databaseUrl) throw new Error('DATABASE_URL is required.');
if (!email || !name || !password) {
  throw new Error(
    'Set STAR_AFRICA_ADMIN_EMAIL, STAR_AFRICA_ADMIN_NAME and STAR_AFRICA_ADMIN_PASSWORD before running this script.',
  );
}
if (
  password.length < 12 ||
  !/[a-z]/.test(password) ||
  !/[A-Z]/.test(password) ||
  !/\d/.test(password) ||
  !/[^A-Za-z0-9]/.test(password)
) {
  throw new Error(
    'The initial password must be at least 12 characters and contain upper-case, lower-case, a number and a symbol.',
  );
}

async function hashPassword(value) {
  const salt = randomBytes(16);
  const N = 16384;
  const r = 8;
  const p = 1;
  const derived = await scrypt(value, salt, 32, {
    N,
    r,
    p,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${Buffer.from(derived).toString('base64url')}`;
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: /localhost|127\.0\.0\.1/.test(databaseUrl)
    ? false
    : { rejectUnauthorized: false },
});

await client.connect();
try {
  const now = Date.now();
  const passwordHash = await hashPassword(password);
  await client.query('BEGIN');

  const existing = await client.query(
    'SELECT id FROM users WHERE company_id=$1 AND lower(email)=lower($2) LIMIT 1',
    [companyId, email],
  );
  const userId = existing.rows[0]?.id ?? `user-${randomUUID()}`;

  if (existing.rows.length) {
    await client.query(
      `UPDATE users SET
        display_name=$1,
        password_hash=$2,
        must_change_password=1,
        failed_login_attempts=0,
        locked_until=NULL,
        status='active',
        updated_at=$3
       WHERE id=$4`,
      [name, passwordHash, now, userId],
    );
  } else {
    await client.query(
      `INSERT INTO users
        (id,company_id,external_identity_id,email,display_name,department,password_hash,must_change_password,failed_login_attempts,status,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,'Administration',$6,1,0,'active',$7,$7)`,
      [userId, companyId, `production:${email}`, email, name, passwordHash, now],
    );
  }

  const role = await client.query(
    `SELECT id FROM roles
     WHERE company_id=$1 AND upper(name) IN ('SUPER ADMIN','SUPER_ADMIN')
     ORDER BY id LIMIT 1`,
    [companyId],
  );
  if (!role.rows.length) {
    throw new Error('SUPER ADMIN role is missing. Run database bootstrap first.');
  }

  await client.query(
    `INSERT INTO user_roles(user_id,role_id,assigned_at)
     VALUES ($1,$2,$3)
     ON CONFLICT (user_id,role_id) DO UPDATE SET assigned_at=EXCLUDED.assigned_at`,
    [userId, role.rows[0].id, now],
  );

  await client.query('COMMIT');
  console.log(
    `[Star Africa] Production administrator provisioned for ${email}. Password change required at first sign-in.`,
  );
} catch (error) {
  await client.query('ROLLBACK').catch(() => undefined);
  throw error;
} finally {
  await client.end();
}
