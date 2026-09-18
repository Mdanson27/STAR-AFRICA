import { z } from 'zod';
import { guardApi } from '@/lib/security/api-guard';
import { AccountingValidationError, validateJournal } from '@/lib/domain/accounting';

const journalSchema = z.object({
  sourceType: z.string().min(1), sourceId: z.string().min(1), memo: z.string().min(1), currency: z.string().length(3),
  lines: z.array(z.object({ accountCode: z.string().min(1), description: z.string(), debitMinor: z.string().regex(/^\d+$/), creditMinor: z.string().regex(/^\d+$/), projectId: z.string().optional(), customerId: z.string().optional(), supplierId: z.string().optional() })).min(2),
});

export async function POST(request: Request) {
  const guard = await guardApi(request, {
    permission: 'finance.view',
    action: 'accounting.validate',
    maxRequests: 60,
    windowMs: 60_000,
  });
  if ('response' in guard) return guard.response;
  const parsed = journalSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Invalid journal payload.', fields: z.treeifyError(parsed.error) }, { status: 400 });
  try {
    return Response.json({ valid: true, totals: validateJournal(parsed.data), mode: 'validation-only' });
  } catch (error) {
    const message = error instanceof AccountingValidationError ? error.message : 'Unable to validate journal.';
    return Response.json({ valid: false, error: message }, { status: 422 });
  }
}
