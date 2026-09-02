import { minor } from './money';

export type JournalLine = Readonly<{
  accountCode: string;
  description: string;
  debitMinor: string;
  creditMinor: string;
  projectId?: string;
  customerId?: string;
  supplierId?: string;
}>;

export type JournalDraft = Readonly<{
  sourceType: string;
  sourceId: string;
  memo: string;
  currency: string;
  lines: JournalLine[];
}>;

export class AccountingValidationError extends Error {}

export function validateJournal(draft: JournalDraft) {
  if (!draft.sourceId) throw new AccountingValidationError('A source ID is required for idempotency.');
  if (draft.lines.length < 2) throw new AccountingValidationError('A journal needs at least two lines.');

  let debits = 0n;
  let credits = 0n;
  for (const line of draft.lines) {
    const debit = minor(line.debitMinor);
    const credit = minor(line.creditMinor);
    if ((debit === 0n) === (credit === 0n)) throw new AccountingValidationError('Every line must contain exactly one non-zero debit or credit.');
    debits += debit;
    credits += credit;
  }
  if (debits !== credits) throw new AccountingValidationError(`Journal is out of balance by ${(debits - credits).toString()} minor units.`);
  return { debitMinor: debits.toString(), creditMinor: credits.toString(), balanced: true as const };
}

export function invoicePosting(input: { invoiceId: string; number: string; customerId: string; projectId?: string; currency: string; subtotalMinor: string; taxMinor: string; retentionMinor: string }): JournalDraft {
  const subtotal = minor(input.subtotalMinor);
  const tax = minor(input.taxMinor);
  const retention = minor(input.retentionMinor);
  const receivable = subtotal + tax - retention;
  if (receivable < 0n) throw new AccountingValidationError('Retention cannot exceed the invoiced subtotal and tax.');
  const dimensions = { projectId: input.projectId, customerId: input.customerId };
  const lines: JournalLine[] = [
    { accountCode: '1100', description: `Accounts receivable · ${input.number}`, debitMinor: receivable.toString(), creditMinor: '0', ...dimensions },
    { accountCode: '4000', description: `Contract revenue · ${input.number}`, debitMinor: '0', creditMinor: subtotal.toString(), ...dimensions },
  ];
  if (tax > 0n) lines.push({ accountCode: '2105', description: `Output VAT · ${input.number}`, debitMinor: '0', creditMinor: tax.toString(), ...dimensions });
  if (retention > 0n) lines.push({ accountCode: '1110', description: `Retention receivable · ${input.number}`, debitMinor: retention.toString(), creditMinor: '0', ...dimensions });
  const draft = { sourceType: 'invoice', sourceId: input.invoiceId, memo: `Invoice ${input.number}`, currency: input.currency, lines };
  validateJournal(draft);
  return draft;
}

export function customerPaymentPosting(input: { paymentId: string; reference: string; customerId: string; projectId?: string; currency: string; amountMinor: string; bankAccountCode: string }): JournalDraft {
  const amount = minor(input.amountMinor).toString();
  const dimensions = { projectId: input.projectId, customerId: input.customerId };
  const draft = { sourceType: 'customer_payment', sourceId: input.paymentId, memo: `Customer payment ${input.reference}`, currency: input.currency, lines: [
    { accountCode: input.bankAccountCode, description: input.reference, debitMinor: amount, creditMinor: '0', ...dimensions },
    { accountCode: '1100', description: input.reference, debitMinor: '0', creditMinor: amount, ...dimensions },
  ] } satisfies JournalDraft;
  validateJournal(draft);
  return draft;
}

export function reverseJournal(original: JournalDraft, reversalId: string): JournalDraft {
  const reversal = { sourceType: 'reversal', sourceId: reversalId, memo: `Reversal: ${original.memo}`, currency: original.currency, lines: original.lines.map((line) => ({ ...line, debitMinor: line.creditMinor, creditMinor: line.debitMinor })) } satisfies JournalDraft;
  validateJournal(reversal);
  return reversal;
}
