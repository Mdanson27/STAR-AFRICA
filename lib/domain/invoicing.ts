import { addMoney, minor, percentage, type Money } from './money';

export type InvoiceLineInput = { quantityMinor: string; unitPriceMinor: string; taxBasisPoints: number };

export function calculateInvoice(lines: InvoiceLineInput[], discountMinor: string, retentionBasisPoints: number, currency = 'UGX') {
  if (!lines.length) throw new Error('An invoice needs at least one line.');
  const calculated = lines.map((line) => {
    const quantity = minor(line.quantityMinor);
    const unitPrice = minor(line.unitPriceMinor);
    const subtotalMinor = (quantity * unitPrice / 100n).toString();
    return { subtotalMinor, taxMinor: percentage(subtotalMinor, line.taxBasisPoints) };
  });
  const subtotal = addMoney(...calculated.map((line): Money => ({ amountMinor: line.subtotalMinor, currency })));
  const tax = calculated.reduce((sum, line) => sum + minor(line.taxMinor), 0n);
  const discount = minor(discountMinor);
  if (discount > minor(subtotal.amountMinor)) throw new Error('Discount cannot exceed subtotal.');
  const taxableTotal = minor(subtotal.amountMinor) - discount + tax;
  const retention = minor(percentage(taxableTotal.toString(), retentionBasisPoints));
  return { currency, subtotalMinor: subtotal.amountMinor, discountMinor: discount.toString(), taxMinor: tax.toString(), retentionMinor: retention.toString(), totalMinor: (taxableTotal - retention).toString(), grossMinor: taxableTotal.toString() };
}

export function allocatePayment(paymentMinor: string, invoices: { invoiceId: string; outstandingMinor: string; allocationMinor: string }[]) {
  const payment = minor(paymentMinor);
  const allocated = invoices.reduce((sum, invoice) => {
    const allocation = minor(invoice.allocationMinor);
    if (allocation > minor(invoice.outstandingMinor)) throw new Error(`Allocation exceeds outstanding balance for ${invoice.invoiceId}.`);
    return sum + allocation;
  }, 0n);
  if (allocated > payment) throw new Error('Allocations exceed the payment amount.');
  return { allocatedMinor: allocated.toString(), unallocatedMinor: (payment - allocated).toString() };
}
