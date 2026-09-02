export type CurrencyCode = string;
export type Money = Readonly<{ amountMinor: string; currency: CurrencyCode }>;

export function minor(value: string | number | bigint): bigint {
  const parsed = BigInt(value);
  if (parsed < 0n) throw new Error('Money amount cannot be negative in this context.');
  return parsed;
}

export function addMoney(...values: Money[]): Money {
  if (!values.length) throw new Error('At least one amount is required.');
  const currency = values[0].currency;
  if (values.some((value) => value.currency !== currency)) throw new Error('Currency mismatch.');
  return { currency, amountMinor: values.reduce((sum, value) => sum + minor(value.amountMinor), 0n).toString() };
}

export function percentage(amountMinor: string, basisPoints: number): string {
  if (!Number.isInteger(basisPoints) || basisPoints < 0 || basisPoints > 10_000) throw new Error('Basis points must be an integer from 0 to 10,000.');
  return ((minor(amountMinor) * BigInt(basisPoints) + 5_000n) / 10_000n).toString();
}
