import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/security/session';
import { hasPermission } from '@/lib/security/permissions';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json(
      { error: 'Sign in is required.' },
      { status: 401 },
    );
  const { id } = await params;
  const body = (await request.json()) as {
    action?: string;
    name?: string;
    status?: string;
    category?: string;
    email?: string;
    phone?: string;
    notes?: string;
  };
  const existing = await env.DB.prepare(
    'SELECT id,name FROM customers WHERE id=? AND company_id=?',
  )
    .bind(id, 'company-star-africa')
    .first();
  if (!existing)
    return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
  if (body.action === 'archive') {
    if (!hasPermission(session.permissions, 'customers.archive'))
      return NextResponse.json(
        { error: 'You do not have permission to archive customers.' },
        { status: 403 },
      );
    const now = Date.now();
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE customers SET status='archived',archived_at=?,updated_at=? WHERE id=?",
      ).bind(now, now, id),
      env.DB.prepare(
        'INSERT INTO customer_activities (id,customer_id,actor_id,action,summary,entity_type,entity_id,occurred_at) VALUES (?,?,?,?,?,?,?,?)',
      ).bind(
        crypto.randomUUID(),
        id,
        session.userId,
        'customer.archived',
        `${String(existing.name)} archived`,
        'Customer',
        id,
        now,
      ),
    ]);
    return NextResponse.json({ archived: true });
  }
  if (!hasPermission(session.permissions, 'customers.edit'))
    return NextResponse.json(
      { error: 'You do not have permission to edit customers.' },
      { status: 403 },
    );
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare(
      'UPDATE customers SET name=COALESCE(?,name),status=COALESCE(?,status),category=COALESCE(?,category),email=?,phone=?,notes=?,updated_at=? WHERE id=?',
    ).bind(
      body.name?.trim() || null,
      body.status || null,
      body.category || null,
      body.email?.trim() || null,
      body.phone?.trim() || null,
      body.notes?.trim() || null,
      now,
      id,
    ),
    env.DB.prepare(
      'INSERT INTO customer_activities (id,customer_id,actor_id,action,summary,entity_type,entity_id,occurred_at) VALUES (?,?,?,?,?,?,?,?)',
    ).bind(
      crypto.randomUUID(),
      id,
      session.userId,
      'customer.updated',
      'Customer profile updated',
      'Customer',
      id,
      now,
    ),
  ]);
  return NextResponse.json({ updated: true });
}
