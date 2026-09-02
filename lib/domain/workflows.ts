import { percentage } from './money';

export type BidForConversion = { id: string; status: string; title: string; customerId: string; estimatedValueMinor: string; currency: string; category?: string; assignedManagerId?: string };
export function convertWinningBidToProject(bid: BidForConversion, nextProjectCode: string) {
  if (bid.status !== 'won') throw new Error('Only a won bid can be converted to a project.');
  return { code: nextProjectCode, name: bid.title, customerId: bid.customerId, bidId: bid.id, contractValueMinor: bid.estimatedValueMinor, contractCurrency: bid.currency, category: bid.category, projectManagerId: bid.assignedManagerId, status: 'active', completionBasisPoints: 0 };
}

export function calculateRetention(baseMinor: string, basisPoints = 500, receivedMinor = '0') {
  const amountMinor = percentage(baseMinor, basisPoints);
  const balance = BigInt(amountMinor) - BigInt(receivedMinor);
  if (balance < 0n) throw new Error('Retention received cannot exceed retention withheld.');
  return { baseMinor, basisPoints, amountMinor, receivedMinor, balanceMinor: balance.toString() };
}

export type ApprovalBand = { upToMinor: string | null; requiredRoles: string[] };
export function resolveApprovalRoute(amountMinor: string, bands: ApprovalBand[]) {
  const amount = BigInt(amountMinor);
  const ordered = [...bands].sort((a, b) => a.upToMinor === null ? 1 : b.upToMinor === null ? -1 : Number(BigInt(a.upToMinor) - BigInt(b.upToMinor)));
  const band = ordered.find((item) => item.upToMinor === null || amount <= BigInt(item.upToMinor));
  if (!band) throw new Error('No approval rule covers this amount.');
  return band.requiredRoles;
}
