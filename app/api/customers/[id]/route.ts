import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { guardApi } from '@/lib/security/api-guard';
import { writeAuditLog } from '@/lib/security/production-auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
  const permission =
    body.action === 'archive' ? 'customers.archive' : 'customers.edit';
  const guard = await guardApi(request, {
    permission,
    action: body.action === 'archive' ? 'customers.archive' : 'customers.edit',
    maxRequests: 40,
    windowMs: 60_000,
  });
  if ('response' in guard) return guard.response;
  const { session } = guard;

  const existing = await env.DB.prepare(
    'SELECT id,name FROM customers WHERE id=? AND company_id=?',
  )
    .bind(id, 'company-star-africa')
    .first();
  if (!existing)
    return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
  if (body.action === 'archive') {
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
    await writeAuditLog({
      request,
      userId: session.userId,
      companyId: session.companyId,
      action: 'customer.archived',
      entityType: 'customer',
      entityId: id,
      oldValue: existing,
      newValue: { status: 'archived' },
    });
    return NextResponse.json({ archived: true });
  }
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
  await writeAuditLog({
    request,
    userId: session.userId,
    companyId: session.companyId,
    action: 'customer.updated',
    entityType: 'customer',
    entityId: id,
    oldValue: existing,
    newValue: body,
  });
  return NextResponse.json({ updated: true });
}
