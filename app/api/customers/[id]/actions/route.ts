import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/security/session';
import { hasPermission } from '@/lib/security/permissions';
import { generateStatementSnapshot } from '@/lib/customers/server';

type Body = { type?: string; [key: string]: unknown };
const value = (body: Body, key: string) =>
  typeof body[key] === 'string' ? String(body[key]).trim() : '';
const when = (raw: unknown, fallback = Date.now()) => {
  const parsed = Date.parse(typeof raw === 'string' ? raw : '');
  return Number.isFinite(parsed) ? parsed : fallback;
};
export async function POST(
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
  const body = (await request.json()) as Body;
  const customer = await env.DB.prepare(
    'SELECT id,name FROM customers WHERE id=? AND company_id=?',
  )
    .bind(id, 'company-star-africa')
    .first();
  if (!customer)
    return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
  const now = Date.now();
  if (body.type === 'contact') {
    if (!hasPermission(session.permissions, 'customers.contacts.manage'))
      return NextResponse.json(
        { error: 'You do not have permission to manage contacts.' },
        { status: 403 },
      );
    const name = value(body, 'name');
    if (
      !name ||
      (!value(body, 'email') &&
        !value(body, 'phone') &&
        !value(body, 'whatsapp'))
    )
      return NextResponse.json(
        { error: 'Contact name and at least one contact method are required.' },
        { status: 400 },
      );
    const contactId = crypto.randomUUID();
    const primary = body.primary === true;
    const statements = [];
    if (primary)
      statements.push(
        env.DB.prepare(
          'UPDATE customer_contacts SET primary_contact=0,updated_at=? WHERE customer_id=?',
        ).bind(now, id),
      );
    statements.push(
      env.DB.prepare(
        `INSERT INTO customer_contacts (id,customer_id,title,first_name,last_name,name,email,phone,alternative_phone,whatsapp,job_title,department,preferred_channel,contact_type,decision_maker,billing_contact,primary_contact,notes,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).bind(
        contactId,
        id,
        value(body, 'title') || null,
        value(body, 'firstName') || null,
        value(body, 'lastName') || null,
        name,
        value(body, 'email') || null,
        value(body, 'phone') || null,
        value(body, 'alternativePhone') || null,
        value(body, 'whatsapp') || null,
        value(body, 'jobTitle') || null,
        value(body, 'department') || null,
        value(body, 'preferredChannel') || null,
        value(body, 'contactType') || 'Other',
        body.decisionMaker === true ? 1 : 0,
        body.billing === true ? 1 : 0,
        primary ? 1 : 0,
        value(body, 'notes') || null,
        'active',
        now,
        now,
      ),
    );
    statements.push(
      env.DB.prepare(
        'INSERT INTO customer_activities (id,customer_id,actor_id,action,summary,entity_type,entity_id,occurred_at) VALUES (?,?,?,?,?,?,?,?)',
      ).bind(
        crypto.randomUUID(),
        id,
        session.userId,
        'customer.contact.created',
        `${name} added as customer contact`,
        'Customer Contact',
        contactId,
        now,
      ),
    );
    await env.DB.batch(statements);
    return NextResponse.json({ id: contactId }, { status: 201 });
  }
  if (body.type === 'communication') {
    if (!hasPermission(session.permissions, 'customers.communication.manage'))
      return NextResponse.json(
        { error: 'You do not have permission to record communication.' },
        { status: 403 },
      );
    if (!value(body, 'subject') || !value(body, 'summary'))
      return NextResponse.json(
        { error: 'Subject and summary are required.' },
        { status: 400 },
      );
    const communicationId = crypto.randomUUID();
    const followUp = value(body, 'followUpAt') ? when(body.followUpAt) : null;
    const statements = [
      env.DB.prepare(
        `INSERT INTO customer_communications (id,customer_id,contact_id,type,direction,occurred_at,subject,summary,outcome,next_action,follow_up_at,project_id,bid_id,invoice_id,recorded_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).bind(
        communicationId,
        id,
        value(body, 'contactId') || null,
        value(body, 'communicationType') || 'Call',
        value(body, 'direction') || 'Outbound',
        when(body.occurredAt),
        value(body, 'subject'),
        value(body, 'summary'),
        value(body, 'outcome') || null,
        value(body, 'nextAction') || null,
        followUp,
        value(body, 'projectId') || null,
        value(body, 'bidId') || null,
        value(body, 'invoiceId') || null,
        session.userId,
        now,
        now,
      ),
      env.DB.prepare(
        'INSERT INTO customer_activities (id,customer_id,actor_id,action,summary,entity_type,entity_id,occurred_at) VALUES (?,?,?,?,?,?,?,?)',
      ).bind(
        crypto.randomUUID(),
        id,
        session.userId,
        'customer.communication.recorded',
        `${value(body, 'communicationType') || 'Communication'}: ${value(body, 'subject')}`,
        'Customer Communication',
        communicationId,
        now,
      ),
    ];
    if (followUp)
      statements.push(
        env.DB.prepare(
          `INSERT INTO notifications (id,company_id,user_id,type,title,message,entity_type,entity_id,priority,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        ).bind(
          crypto.randomUUID(),
          'company-star-africa',
          session.userId,
          'customer.follow_up',
          'Customer follow-up due',
          value(body, 'nextAction') || value(body, 'subject'),
          'Customer',
          id,
          'normal',
          now,
        ),
      );
    await env.DB.batch(statements);
    return NextResponse.json({ id: communicationId }, { status: 201 });
  }
  if (body.type === 'note') {
    if (!hasPermission(session.permissions, 'customers.edit'))
      return NextResponse.json(
        { error: 'You do not have permission to add notes.' },
        { status: 403 },
      );
    const note = value(body, 'note');
    if (!note)
      return NextResponse.json({ error: 'Enter a note.' }, { status: 400 });
    const noteId = crypto.randomUUID();
    await env.DB.batch([
      env.DB.prepare(
        'INSERT INTO customer_notes (id,customer_id,note,pinned,visibility,author_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)',
      ).bind(
        noteId,
        id,
        note,
        body.pinned === true ? 1 : 0,
        'internal',
        session.userId,
        now,
        now,
      ),
      env.DB.prepare(
        'INSERT INTO customer_activities (id,customer_id,actor_id,action,summary,entity_type,entity_id,occurred_at) VALUES (?,?,?,?,?,?,?,?)',
      ).bind(
        crypto.randomUUID(),
        id,
        session.userId,
        'customer.note.added',
        'Internal note added',
        'Customer Note',
        noteId,
        now,
      ),
    ]);
    return NextResponse.json({ id: noteId }, { status: 201 });
  }
  if (body.type === 'statement') {
    if (!hasPermission(session.permissions, 'customers.statements.generate'))
      return NextResponse.json(
        { error: 'You do not have permission to generate statements.' },
        { status: 403 },
      );
    const from = when(body.from, NaN);
    const to = when(body.to, NaN);
    if (!Number.isFinite(from) || !Number.isFinite(to) || from > to)
      return NextResponse.json(
        { error: 'Choose a valid statement period.' },
        { status: 400 },
      );
    const currency = value(body, 'currency') || 'UGX';
    const snapshot = await generateStatementSnapshot({
      customerId: id,
      from,
      to: to + 86399999,
      currency,
      includePaid: body.includePaid !== false,
    });
    const count = await env.DB.prepare(
      'SELECT COUNT(*) count FROM customer_statements WHERE company_id=?',
    )
      .bind('company-star-africa')
      .first<{ count: number }>();
    const statementId = crypto.randomUUID();
    const statementNumber = `STM-${new Date(now).getUTCFullYear()}-${String((count?.count ?? 0) + 1).padStart(5, '0')}`;
    const overdue = await env.DB.prepare(
      `SELECT COALESCE(CAST(SUM(CAST(total_minor AS INTEGER)-CAST(paid_minor AS INTEGER)) AS TEXT),'0') amount FROM invoices WHERE customer_id=? AND currency=? AND due_date<? AND status NOT IN ('draft','void','paid')`,
    )
      .bind(id, currency, now)
      .first<{ amount: string }>();
    const retention = await env.DB.prepare(
      `SELECT COALESCE(CAST(SUM(CAST(r.amount_minor AS INTEGER)-CAST(r.received_minor AS INTEGER)) AS TEXT),'0') amount FROM retentions r JOIN projects p ON p.id=r.project_id WHERE p.customer_id=? AND r.status!='released'`,
    )
      .bind(id)
      .first<{ amount: string }>();
    const statements = [
      env.DB.prepare(
        `INSERT INTO customer_statements (id,company_id,statement_number,customer_id,period_from,period_to,currency,opening_balance_minor,closing_balance_minor,overdue_balance_minor,retention_outstanding_minor,options_json,generated_by,generated_at,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).bind(
        statementId,
        'company-star-africa',
        statementNumber,
        id,
        from,
        to,
        currency,
        snapshot.opening,
        snapshot.closingBalanceMinor,
        overdue?.amount ?? '0',
        retention?.amount ?? '0',
        JSON.stringify({
          includePaid: body.includePaid !== false,
          includeRetention: body.includeRetention !== false,
        }),
        session.userId,
        now,
        now,
      ),
      ...snapshot.lines.map((line) =>
        env.DB.prepare(
          'INSERT INTO customer_statement_lines (id,statement_id,occurred_at,reference,description,debit_minor,credit_minor,balance_minor,entity_type,entity_id,sequence) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        ).bind(
          crypto.randomUUID(),
          statementId,
          line.occurredAt,
          line.reference,
          line.description,
          line.debitMinor,
          line.creditMinor,
          line.balanceMinor,
          line.entityType,
          line.entityId,
          line.sequence,
        ),
      ),
      env.DB.prepare(
        'INSERT INTO customer_activities (id,customer_id,actor_id,action,summary,entity_type,entity_id,occurred_at) VALUES (?,?,?,?,?,?,?,?)',
      ).bind(
        crypto.randomUUID(),
        id,
        session.userId,
        'customer.statement.generated',
        `${statementNumber} generated`,
        'Customer Statement',
        statementId,
        now,
      ),
    ];
    await env.DB.batch(statements);
    return NextResponse.json(
      { id: statementId, statementNumber },
      { status: 201 },
    );
  }
  return NextResponse.json(
    { error: 'Unsupported customer action.' },
    { status: 400 },
  );
}
