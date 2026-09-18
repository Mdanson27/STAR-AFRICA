import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getDb } from '@/db';
import { suppliers } from '@/db/schema';
import { guardApi } from '@/lib/security/api-guard';
import { writeAuditLog } from '@/lib/security/production-auth';

const schema = z.object({
  code: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(160),
  tin: z.string().trim().max(80).optional().default(''),
  email: z.union([z.string().trim().email(), z.literal('')]).optional().default(''),
  phone: z.string().trim().max(60).optional().default(''),
  address: z.string().trim().max(500).optional().default(''),
  fax: z.string().trim().max(60).optional().default(''),
  creditTermsDays: z.number().int().min(0).max(365).default(0),
  vatRegistered: z.boolean().default(false),
});

export async function POST(request: Request) {
  const guard = await guardApi(request, {
    permission: 'suppliers.create',
    action: 'suppliers.create',
    maxRequests: 20,
    windowMs: 60_000,
  });
  if ('response' in guard) return guard.response;
  const { session } = guard;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid supplier details.' },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const id = `supplier-${randomUUID()}`;
  const now = new Date();

  try {
    await getDb().insert(suppliers).values({
      id,
      companyId: session.companyId,
      code: input.code.toUpperCase(),
      name: input.name,
      tin: input.tin || null,
      vatRegistered: input.vatRegistered,
      creditTermsDays: input.creditTermsDays,
      email: input.email || null,
      phone: input.phone || null,
      address: input.address || null,
      fax: input.fax || null,
      status: 'active',
      sourceSystem: 'Star Africa OS',
      sourceRef: null,
      sourceImportedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    await writeAuditLog({
      request,
      userId: session.userId,
      companyId: session.companyId,
      action: 'supplier.created',
      entityType: 'supplier',
      entityId: id,
      newValue: {
        code: input.code.toUpperCase(),
        name: input.name,
        source: 'Star Africa OS',
      },
    });

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (/unique|duplicate/i.test(message)) {
      return NextResponse.json(
        { error: 'A supplier with that code already exists.' },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: 'Unable to create supplier.' },
      { status: 500 },
    );
  }
}
