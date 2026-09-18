import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guardApi } from '@/lib/security/api-guard';
import { getDb } from '@/db';
import { auditLogs, bids } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

const opportunitySchema = z.object({
  reference: z.string().trim().min(3).max(80),
  title: z.string().trim().min(5).max(240),
  organization: z.string().trim().min(2).max(180),
  category: z.string().trim().min(2).max(100),
  source: z.string().trim().max(60).default('Manual'),
  sourceUrl: z.union([z.url(), z.literal('')]).optional(),
  publicationDate: z.string().optional(),
  deadline: z.string().min(1),
  estimatedValue: z.coerce.number().nonnegative(),
  currency: z.string().length(3).default('UGX'),
  owner: z.string().default('Irene Adoch'),
});

export async function POST(request: Request) {
  const guard = await guardApi(request, {
    permission: 'bids.create',
    action: 'bids.create',
    maxRequests: 30,
    windowMs: 60_000,
  });
  if ('response' in guard) return guard.response;
  const { session } = guard;

  const parsed = opportunitySchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid opportunity data.' },
      { status: 400 },
    );
  const data = parsed.data;
  const now = new Date();
  const id = `bid-${crypto.randomUUID()}`;
  const estimatedValueMinor = BigInt(
    Math.round(data.estimatedValue * 100),
  ).toString();
  try {
    const db = getDb();
    const [existing] = await db
      .select({ id: bids.id, reference: bids.reference })
      .from(bids)
      .where(
        and(
          eq(bids.companyId, 'company-star-africa'),
          eq(bids.reference, data.reference),
        ),
      )
      .limit(1);
    if (existing)
      return NextResponse.json(
        {
          error: 'A likely duplicate opportunity already exists.',
          duplicate: { reference: existing.reference },
        },
        { status: 409 },
      );
    await db.batch([
      db
        .insert(bids)
        .values({
          id,
          companyId: 'company-star-africa',
          reference: data.reference,
          title: data.title,
          organization: data.organization,
          category: data.category,
          source: data.source,
          sourceUrl: data.sourceUrl || null,
          publishedAt: data.publicationDate
            ? new Date(data.publicationDate)
            : null,
          closesAt: new Date(data.deadline),
          currency: data.currency,
          estimatedValueMinor,
          status: 'new',
          assignedTo: session.userId,
          createdAt: now,
          updatedAt: now,
        }),
      db
        .insert(auditLogs)
        .values({
          id: `audit-${crypto.randomUUID()}`,
          companyId: 'company-star-africa',
          userId: session.userId,
          action: 'bid.created',
          entityType: 'bid',
          entityId: id,
          newValueJson: JSON.stringify({
            reference: data.reference,
            title: data.title,
            organization: data.organization,
          }),
          occurredAt: now,
        }),
    ]);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Could not persist the opportunity: ${error.message}`
            : 'Could not persist the opportunity.',
      },
      { status: 503 },
    );
  }
  return NextResponse.json({ id }, { status: 201 });
}
