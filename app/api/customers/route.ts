import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/security/session';
import { hasPermission } from '@/lib/security/permissions';
import { moneyInputToMinor } from '@/lib/customers/domain';

type CustomerInput = Record<string, unknown> & {
  name?: string;
  code?: string;
  email?: string;
  phone?: string;
  tin?: string;
  registrationNumber?: string;
  allowDuplicate?: boolean;
};
const text = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';
const bool = (value: unknown) => value === true;
const date = (value: unknown) => {
  const parsed = Date.parse(text(value));
  return Number.isFinite(parsed) ? parsed : null;
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json(
      { error: 'Sign in is required.' },
      { status: 401 },
    );
  if (!hasPermission(session.permissions, 'customers.create'))
    return NextResponse.json(
      { error: 'You do not have permission to create customers.' },
      { status: 403 },
    );
  const body = (await request.json()) as CustomerInput;
  const name = text(body.name);
  if (!name)
    return NextResponse.json(
      { error: 'Organization name is required.' },
      { status: 400 },
    );
  if (body.email && !/^\S+@\S+\.\S+$/.test(text(body.email)))
    return NextResponse.json(
      { error: 'Enter a valid email address.' },
      { status: 400 },
    );
  const duplicate = await env.DB.prepare(
    `SELECT id,code,name FROM customers WHERE company_id=? AND archived_at IS NULL AND (lower(name)=lower(?) OR (tin IS NOT NULL AND tin!='' AND tin=?) OR (registration_number IS NOT NULL AND registration_number!='' AND registration_number=?) OR (email IS NOT NULL AND email!='' AND lower(email)=lower(?)) OR (phone IS NOT NULL AND phone!='' AND phone=?)) LIMIT 1`,
  )
    .bind(
      'company-star-africa',
      name,
      text(body.tin),
      text(body.registrationNumber),
      text(body.email),
      text(body.phone),
    )
    .first();
  if (duplicate && !body.allowDuplicate)
    return NextResponse.json(
      { error: 'Possible duplicate customer.', duplicate },
      { status: 409 },
    );
  const max = await env.DB.prepare(
    "SELECT MAX(CAST(substr(code,5) AS INTEGER)) value FROM customers WHERE company_id=? AND code LIKE 'CUS-%'",
  )
    .bind('company-star-africa')
    .first<{ value: number | null }>();
  const code =
    text(body.code) || `CUS-${String((max?.value ?? 0) + 1).padStart(4, '0')}`;
  const id = crypto.randomUUID();
  const now = Date.now();
  try {
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO customers (id,company_id,code,name,trading_name,customer_type,category,industry,tin,vat_registered,registration_number,website,email,correspondence_email,phone,secondary_phone,country,district,city,address,postal_address,billing_contact,billing_email,preferred_currency,payment_terms,due_days,retention_applicable,retention_basis_points,credit_limit_minor,account_manager_id,source,first_engagement_at,notes,tags_json,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).bind(
        id,
        'company-star-africa',
        code,
        name,
        text(body.tradingName) || null,
        text(body.customerType) || 'Company',
        text(body.category) || 'Other',
        text(body.industry) || null,
        text(body.tin) || null,
        bool(body.vatRegistered) ? 1 : 0,
        text(body.registrationNumber) || null,
        text(body.website) || null,
        text(body.email) || null,
        text(body.correspondenceEmail) || null,
        text(body.phone) || null,
        text(body.secondaryPhone) || null,
        text(body.country) || 'Uganda',
        text(body.district) || null,
        text(body.city) || null,
        text(body.address) || null,
        text(body.postalAddress) || null,
        text(body.billingContact) || null,
        text(body.billingEmail) || null,
        text(body.preferredCurrency) || 'UGX',
        text(body.paymentTerms) || '30 days',
        Math.max(0, Number(body.dueDays) || 0),
        bool(body.retentionApplicable) ? 1 : 0,
        Math.round((Number(body.retentionPercent) || 0) * 100),
        moneyInputToMinor(body.creditLimit),
        text(body.accountManagerId) || null,
        text(body.source) || null,
        date(body.firstEngagementAt),
        text(body.notes) || null,
        JSON.stringify(
          text(body.tags)
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
        ),
        text(body.status) || 'active',
        now,
        now,
      ),
      env.DB.prepare(
        'INSERT INTO customer_activities (id,customer_id,actor_id,action,summary,entity_type,entity_id,occurred_at) VALUES (?,?,?,?,?,?,?,?)',
      ).bind(
        crypto.randomUUID(),
        id,
        session.userId,
        'customer.created',
        `${name} created`,
        'Customer',
        id,
        now,
      ),
      env.DB.prepare(
        'INSERT INTO audit_logs (id,company_id,user_id,action,entity_type,entity_id,new_value_json,occurred_at) VALUES (?,?,?,?,?,?,?,?)',
      ).bind(
        crypto.randomUUID(),
        'company-star-africa',
        session.userId,
        'customer.created',
        'customer',
        id,
        JSON.stringify({ code, name }),
        now,
      ),
    ]);
    return NextResponse.json({ id, code }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Customer could not be saved.',
      },
      { status: 500 },
    );
  }
}
