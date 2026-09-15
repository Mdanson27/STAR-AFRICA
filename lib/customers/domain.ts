export type StatementEvent = {
  occurredAt: number;
  reference: string;
  description: string;
  debitMinor: string;
  creditMinor: string;
  entityType: string;
  entityId: string;
};
export type StatementLine = StatementEvent & {
  balanceMinor: string;
  sequence: number;
};

export function buildStatement(
  openingBalanceMinor: string,
  events: StatementEvent[],
) {
  let balance = BigInt(openingBalanceMinor);
  const lines: StatementLine[] = [...events]
    .sort(
      (a, b) =>
        a.occurredAt - b.occurredAt || a.reference.localeCompare(b.reference),
    )
    .map((event, sequence) => {
      balance += BigInt(event.debitMinor) - BigInt(event.creditMinor);
      return { ...event, balanceMinor: balance.toString(), sequence };
    });
  return { lines, closingBalanceMinor: balance.toString() };
}

export function customerFinancialHealth(input: {
  outstandingMinor: string;
  overdueMinor: string;
  retentionMinor: string;
  creditLimitMinor: string;
}) {
  const outstanding = BigInt(input.outstandingMinor);
  const overdue = BigInt(input.overdueMinor);
  const retention = BigInt(input.retentionMinor);
  const limit = BigInt(input.creditLimitMinor || '0');
  if (limit > 0n && outstanding > limit) return 'High exposure';
  if (overdue > 0n) return 'Overdue';
  if (outstanding > 0n) return 'Payment due';
  if (retention > 0n) return 'Retention outstanding';
  return 'Healthy';
}

export function moneyInputToMinor(value: unknown) {
  if (typeof value !== 'string' && typeof value !== 'number') return '0';
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  if (!cleaned || !Number.isFinite(Number(cleaned))) return '0';
  return String(Math.round(Number(cleaned) * 100));
}
