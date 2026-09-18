import { NextResponse } from 'next/server';
import { guardApi } from '@/lib/security/api-guard';
import { likelyDuplicate } from '@/lib/bids/domain';
import { getDb } from '@/db';
import { auditLogs, bidImportJobs, bids } from '@/db/schema';
type Row = {
  reference: string;
  title: string;
  organization: string;
  deadline: string;
  category: string;
  estimatedValue: string;
  currency: string;
};
export async function POST(request: Request) {
  const guard = await guardApi(request, {
    permission: 'bids.create',
    action: 'bids.import',
    maxRequests: 8,
    windowMs: 15 * 60 * 1000,
    blockMs: 15 * 60 * 1000,
  });
  if ('response' in guard) return guard.response;
  const { session } = guard;

  const body = (await request.json().catch(() => null)) as {
    filename?: string;
    rows?: Row[];
  } | null;
  if (!body?.rows?.length)
    return NextResponse.json(
      { error: 'No opportunity rows supplied.' },
      { status: 400 },
    );
  const db = getDb();
  const persistedBids = await db
    .select({
      reference: bids.reference,
      organization: bids.organization,
      title: bids.title,
      closesAt: bids.closesAt,
    })
    .from(bids);
  const existing = persistedBids.map((bid) => ({
    reference: bid.reference,
    organization: bid.organization,
    title: bid.title,
    deadline: bid.closesAt instanceof Date
      ? bid.closesAt.toISOString().slice(0, 10)
      : new Date(bid.closesAt).toISOString().slice(0, 10),
  }));
  const accepted: Row[] = [];
  let duplicates = 0;
  let errors = 0;
  for (const row of body.rows) {
    if (
      !row.reference ||
      !row.title ||
      !row.organization ||
      !/^\d{4}-\d{2}-\d{2}/.test(row.deadline) ||
      !Number.isFinite(Number(row.estimatedValue))
    ) {
      errors++;
      continue;
    }
    if (likelyDuplicate(row, [...existing, ...accepted])) {
      duplicates++;
      continue;
    }
    accepted.push(row);
  }
  const now = new Date();
  const jobId = `import-${crypto.randomUUID()}`;
  const bidStatements = accepted.map((row) =>
    db
      .insert(bids)
      .values({
        id: `bid-${crypto.randomUUID()}`,
        companyId: 'company-star-africa',
        reference: row.reference,
        title: row.title,
        organization: row.organization,
        category: row.category,
        source: 'CSV Import',
        closesAt: new Date(`${row.deadline}T11:00:00+03:00`),
        currency: row.currency || 'UGX',
        estimatedValueMinor: BigInt(
          Math.round(Number(row.estimatedValue) * 100),
        ).toString(),
        status: 'new',
        assignedTo: session.userId,
        createdAt: now,
        updatedAt: now,
      }),
  );
  const importStatement = db
    .insert(bidImportJobs)
    .values({
      id: jobId,
      companyId: 'company-star-africa',
      provider: 'csv',
      filename: body.filename,
      status: errors ? 'completed_with_errors' : 'completed',
      mappingJson: JSON.stringify({ mode: 'canonical_headers' }),
      insertedCount: accepted.length,
      duplicateCount: duplicates,
      errorCount: errors,
      skippedCount: duplicates,
      createdBy: session.userId,
      createdAt: now,
      updatedAt: now,
    });
  const auditStatement = db
    .insert(auditLogs)
    .values({
      id: `audit-${crypto.randomUUID()}`,
      companyId: 'company-star-africa',
      userId: session.userId,
      action: 'bid.import.completed',
      entityType: 'bid_import_job',
      entityId: jobId,
      newValueJson: JSON.stringify({
        inserted: accepted.length,
        duplicates,
        errors,
      }),
      occurredAt: now,
    });
  try {
    await db.batch([importStatement, auditStatement, ...bidStatements]);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not import opportunities.',
      },
      { status: 503 },
    );
  }
  return NextResponse.json({ inserted: accepted.length, duplicates, errors });
}
