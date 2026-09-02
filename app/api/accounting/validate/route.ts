import { z } from 'zod';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { AccountingValidationError, validateJournal } from '@/lib/domain/accounting';

const journalSchema = z.object({
  sourceType: z.string().min(1), sourceId: z.string().min(1), memo: z.string().min(1), currency: z.string().length(3),
  lines: z.array(z.object({ accountCode: z.string().min(1), description: z.string(), debitMinor: z.string().regex(/^\d+$/), creditMinor: z.string().regex(/^\d+$/), projectId: z.string().optional(), customerId: z.string().optional(), supplierId: z.string().optional() })).min(2),
});

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user && process.env.NODE_ENV === 'production') return Response.json({ error: 'Authentication required.' }, { status: 401 });
  const parsed = journalSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Invalid journal payload.', fields: z.treeifyError(parsed.error) }, { status: 400 });
  try {
    return Response.json({ valid: true, totals: validateJournal(parsed.data), mode: 'validation-only' });
  } catch (error) {
    const message = error instanceof AccountingValidationError ? error.message : 'Unable to validate journal.';
    return Response.json({ valid: false, error: message }, { status: 422 });
  }
}
