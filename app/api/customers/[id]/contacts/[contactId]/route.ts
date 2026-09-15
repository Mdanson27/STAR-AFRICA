import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { hasPermission } from '@/lib/security/permissions';
import { getSession } from '@/lib/security/session';

type Input = {
  action?: 'edit' | 'set_primary' | 'set_billing' | 'archive';
  name?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  contactType?: string;
  notes?: string;
};

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in is required.' }, { status: 401 });
  if (!hasPermission(session.permissions, 'customers.contacts.manage')) {
    return NextResponse.json({ error: 'You do not have permission to manage customer contacts.' }, { status: 403 });
  }
  const { id, contactId } = await params;
  const body = (await request.json()) as Input;
  const contact = await env.DB.prepare(
    'SELECT * FROM customer_contacts WHERE id=? AND customer_id=?',
  )
    .bind(contactId, id)
    .first<Record<string, unknown>>();
  if (!contact) return NextResponse.json({ error: 'Customer contact not found.' }, { status: 404 });

  const now = Date.now();
  const activity = (action: string, summary: string) =>
    env.DB.prepare(
      'INSERT INTO customer_activities (id,customer_id,actor_id,action,summary,entity_type,entity_id,occurred_at) VALUES (?,?,?,?,?,?,?,?)',
    ).bind(crypto.randomUUID(), id, session.userId, action, summary, 'Customer Contact', contactId, now);

  if (body.action === 'set_primary') {
    await env.DB.batch([
      env.DB.prepare('UPDATE customer_contacts SET primary_contact=0,updated_at=? WHERE customer_id=?').bind(now, id),
      env.DB.prepare("UPDATE customer_contacts SET primary_contact=1,status='active',archived_at=NULL,updated_at=? WHERE id=?").bind(now, contactId),
      activity('customer.contact.primary_changed', `${String(contact.name)} set as primary contact`),
    ]);
    return NextResponse.json({ updated: true });
  }
  if (body.action === 'set_billing') {
    await env.DB.batch([
      env.DB.prepare('UPDATE customer_contacts SET billing_contact=0,updated_at=? WHERE customer_id=?').bind(now, id),
      env.DB.prepare("UPDATE customer_contacts SET billing_contact=1,status='active',archived_at=NULL,updated_at=? WHERE id=?").bind(now, contactId),
      activity('customer.contact.billing_changed', `${String(contact.name)} set as billing contact`),
    ]);
    return NextResponse.json({ updated: true });
  }
  if (body.action === 'archive') {
    await env.DB.batch([
      env.DB.prepare("UPDATE customer_contacts SET status='archived',primary_contact=0,billing_contact=0,archived_at=?,updated_at=? WHERE id=?").bind(now, now, contactId),
      activity('customer.contact.archived', `${String(contact.name)} archived`),
    ]);
    return NextResponse.json({ archived: true });
  }

  const name = text(body.name) || String(contact.name);
  const email = body.email === undefined ? text(contact.email) : text(body.email);
  const phone = body.phone === undefined ? text(contact.phone) : text(body.phone);
  const whatsapp = text(contact.whatsapp);
  if (!name || (!email && !phone && !whatsapp)) {
    return NextResponse.json({ error: 'Contact name and at least one contact method are required.' }, { status: 400 });
  }
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid contact email.' }, { status: 400 });
  }
  await env.DB.batch([
    env.DB.prepare(
      'UPDATE customer_contacts SET name=?,email=?,phone=?,job_title=?,department=?,contact_type=?,notes=?,updated_at=? WHERE id=?',
    ).bind(
      name,
      email || null,
      phone || null,
      body.jobTitle === undefined ? contact.job_title : text(body.jobTitle) || null,
      body.department === undefined ? contact.department : text(body.department) || null,
      body.contactType === undefined ? contact.contact_type : text(body.contactType) || 'Other',
      body.notes === undefined ? contact.notes : text(body.notes) || null,
      now,
      contactId,
    ),
    activity('customer.contact.updated', `${name} contact details updated`),
  ]);
  return NextResponse.json({ updated: true });
}
