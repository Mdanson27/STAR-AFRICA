export function formatUgx(value: number | bigint, compact = false): string {
  const amount = typeof value === 'bigint' ? value : BigInt(Math.trunc(value));
  const negative = amount < 0n;
  const absolute = negative ? -amount : amount;
  const formatted = compact && absolute >= 1_000_000_000n
    ? `${(Number(absolute) / 1_000_000_000).toFixed(1).replace('.0', '')}B`
    : new Intl.NumberFormat('en-UG', { maximumFractionDigits: 0 }).format(absolute);
  return `${negative ? '-' : ''}UGX ${formatted}`;
}

export function statusTone(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  const value = status.toLowerCase();
  if (/(paid|won|complete|reconciled|approved|active|posted|received)/.test(value)) return 'success';
  if (/(overdue|failed|rejected|critical|expired)/.test(value)) return 'danger';
  if (/(pending|due|awaiting|review|low|partial)/.test(value)) return 'warning';
  if (/(draft|progress|new|open|issued|processing)/.test(value)) return 'info';
  return 'neutral';
}
