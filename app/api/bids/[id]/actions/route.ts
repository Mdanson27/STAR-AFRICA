import { NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import {
  bidActivities,
  bidApprovals,
  bidRequirements,
  bidResults,
  bidSubmissions,
  bids,
} from '@/db/schema';
import { guardApi } from '@/lib/security/api-guard';
import { writeAuditLog } from '@/lib/security/production-auth';

const actionPermission: Record<string, string> = {
  approve_pursuit: 'bids.approve',
  final_approval: 'bids.approve',
  submit: 'bids.submit',
  record_result: 'bids.award',
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as
    | { type?: string; result?: string; comments?: string }
    | null;
  const type = body?.type ?? '';
  const permission = actionPermission[type];

  if (!permission) {
    return NextResponse.json({ error: 'Unsupported bid action.' }, { status: 400 });
  }

  const guard = await guardApi(request, {
    permission,
    action: `bids.${type}`,
    maxRequests: 30,
    windowMs: 60_000,
  });
  if ('response' in guard) return guard.response;
  const { session } = guard;

  const db = getDb();
  const [bid] = await db
    .select()
    .from(bids)
    .where(and(eq(bids.id, id), eq(bids.companyId, session.companyId)))
    .limit(1);

  if (!bid) {
    return NextResponse.json({ error: 'Bid not found.' }, { status: 404 });
  }

  const now = new Date();
  let nextStatus: string | undefined;
  let message = 'Action recorded.';

  if (type === 'approve_pursuit') {
    if (bid.status !== 'qualification') {
      return NextResponse.json(
        { error: 'Pursuit approval is only valid while the bid is in Qualification.' },
        { status: 409 },
      );
    }
    nextStatus = 'approved_to_pursue';
    message = 'Pursuit approved.';
  }

  if (type === 'final_approval') {
    if (!['preparing', 'ready_for_submission', 'approved_to_pursue'].includes(bid.status)) {
      return NextResponse.json(
        { error: 'Final approval is not available at the current bid stage.' },
        { status: 409 },
      );
    }
    const previous = await db
      .select({ id: bidApprovals.id })
      .from(bidApprovals)
      .where(
        and(
          eq(bidApprovals.bidId, id),
          eq(bidApprovals.type, 'final_submission'),
          eq(bidApprovals.decision, 'approved'),
        ),
      )
      .limit(1);
    if (!previous.length) {
      await db.insert(bidApprovals).values({
        id: `approval-${crypto.randomUUID()}`,
        bidId: id,
        type: 'final_submission',
        approverId: session.userId,
        decision: 'approved',
        comments: body?.comments?.trim() || 'Approved for final submission.',
        decidedAt: now,
        createdAt: now,
      });
    }
    nextStatus = 'ready_for_submission';
    message = 'Final submission approval recorded.';
  }

  if (type === 'submit') {
    const [outstanding] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bidRequirements)
      .where(
        and(
          eq(bidRequirements.bidId, id),
          eq(bidRequirements.required, true),
          eq(bidRequirements.verified, false),
        ),
      );

    const approval = await db
      .select({ id: bidApprovals.id })
      .from(bidApprovals)
      .where(
        and(
          eq(bidApprovals.bidId, id),
          eq(bidApprovals.type, 'final_submission'),
          eq(bidApprovals.decision, 'approved'),
        ),
      )
      .limit(1);

    if (Number(outstanding?.count ?? 0) > 0 || !approval.length) {
      return NextResponse.json(
        {
          error:
            'Submission is blocked until every mandatory requirement is verified and final approval is recorded.',
        },
        { status: 409 },
      );
    }

    await db.insert(bidSubmissions).values({
      id: `submission-${crypto.randomUUID()}`,
      bidId: id,
      method: 'portal',
      submittedAt: now,
      submittedBy: session.userId,
      packageManifestJson: '[]',
      status: 'submitted',
      createdAt: now,
    });
    nextStatus = 'awaiting_result';
    message = 'Bid submission recorded.';
  }

  if (type === 'record_result') {
    const result = body?.result ?? '';
    if (!['won', 'lost'].includes(result)) {
      return NextResponse.json(
        { error: 'Result must be won or lost.' },
        { status: 400 },
      );
    }
    if (bid.status !== 'awaiting_result') {
      return NextResponse.json(
        { error: 'A result can only be recorded while awaiting result.' },
        { status: 409 },
      );
    }
    await db.insert(bidResults).values({
      id: `result-${crypto.randomUUID()}`,
      bidId: id,
      result,
      decisionDate: now,
      currency: bid.currency,
      recordedBy: session.userId,
      createdAt: now,
      updatedAt: now,
    });
    nextStatus = result;
    message = `Bid result recorded as ${result.toUpperCase()}.`;
  }

  if (nextStatus) {
    await db
      .update(bids)
      .set({ status: nextStatus, updatedAt: now })
      .where(eq(bids.id, id));
  }

  await db.insert(bidActivities).values({
    id: `activity-${crypto.randomUUID()}`,
    bidId: id,
    actorId: session.userId,
    action: `bid.${type}`,
    linkedEntityType: 'bid',
    linkedEntityId: id,
    summary: message,
    occurredAt: now,
  });

  await writeAuditLog({
    request,
    userId: session.userId,
    companyId: session.companyId,
    action: `bid.${type}`,
    entityType: 'bid',
    entityId: id,
    oldValue: { status: bid.status },
    newValue: { status: nextStatus ?? bid.status, result: body?.result },
  });

  return NextResponse.json({ message, status: nextStatus ?? bid.status });
}
