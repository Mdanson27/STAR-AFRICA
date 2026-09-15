'use client';
import Link from 'next/link';
import { ArrowLeft, Download, ExternalLink, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StarAfricaLogo } from '@/components/star-africa-logo';
import { minorToMoney } from '@/lib/documents/types';

type ReceiptWorkspace = {
  document: { id: string; internalNumber: string; originalFilename: string };
  receipt: { receipt: { internalNumber: string; supplierNameRaw: string | null; receiptNumber: string | null; invoiceNumber: string | null; receiptDate: string | null; currency: string; subtotalMinor: string; discountMinor: string; vatAmountMinor: string; otherTaxMinor: string; totalMinor: string; paymentMethod: string | null; transactionReference: string | null; reviewedAt: string; notes: string | null }; reviewerName: string; supplierName: string | null };
  lines: Array<{ id: string; description: string; quantityMinor: string; unit: string | null; unitPriceMinor: string; taxMinor: string; lineTotalMinor: string }>;
};
const format = (value: string, currency: string) => `${currency} ${Number(minorToMoney(value)).toLocaleString('en-UG', { minimumFractionDigits: 2 })}`;

export function DigitizedReceipt({ workspace }: { workspace: ReceiptWorkspace }) {
  const receipt = workspace.receipt.receipt;
  return <main className="digitized-receipt-page">
    <nav className="receipt-page-actions"><Button variant="outline" render={<Link href={`/documents/${workspace.document.id}`} />}><ArrowLeft />Document</Button><div><Button variant="outline" render={<a aria-label="Download original receipt" href={`/api/documents/${workspace.document.id}/file?download=1`} />}><Download />Original</Button><Button onClick={() => window.print()}><Printer />Print / Export PDF</Button></div></nav>
    <article className="digitized-receipt-sheet"><header><StarAfricaLogo size="large" /><div><p>STAR AFRICA OS</p><h1>Digitized receipt record</h1><span>Internal operational record · not a replacement fiscal receipt</span></div></header>
      <section className="receipt-source-banner"><strong>Source: OCR / manual review from uploaded receipt</strong><span>The original document remains attached and unchanged.</span></section>
      <dl className="receipt-identifiers"><div><dt>Document ID</dt><dd>{workspace.document.internalNumber}</dd></div><div><dt>Internal receipt ID</dt><dd>{receipt.internalNumber}</dd></div><div><dt>Source receipt no.</dt><dd>{receipt.receiptNumber || 'Not provided'}</dd></div><div><dt>Date</dt><dd>{receipt.receiptDate ? new Date(receipt.receiptDate).toLocaleDateString('en-UG', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'Not provided'}</dd></div></dl>
      <section className="receipt-party"><span>Supplier / merchant</span><strong>{workspace.receipt.supplierName || receipt.supplierNameRaw || 'Not provided'}</strong>{receipt.invoiceNumber ? <small>Invoice: {receipt.invoiceNumber}</small> : null}</section>
      <table><thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>{workspace.lines.length ? workspace.lines.map((line) => <tr key={line.id}><td>{line.description}</td><td>{Number(line.quantityMinor) / 1000}</td><td>{line.unit || '—'}</td><td>{format(line.unitPriceMinor, receipt.currency)}</td><td>{format(line.lineTotalMinor, receipt.currency)}</td></tr>) : <tr><td colSpan={5}>No itemized lines were recorded.</td></tr>}</tbody></table>
      <div className="receipt-totals"><div><span>Subtotal</span><strong>{format(receipt.subtotalMinor, receipt.currency)}</strong></div>{Number(receipt.discountMinor) ? <div><span>Discount</span><strong>− {format(receipt.discountMinor, receipt.currency)}</strong></div> : null}<div><span>VAT</span><strong>{format(receipt.vatAmountMinor, receipt.currency)}</strong></div>{Number(receipt.otherTaxMinor) ? <div><span>Other tax</span><strong>{format(receipt.otherTaxMinor, receipt.currency)}</strong></div> : null}<div className="grand-total"><span>Total</span><strong>{format(receipt.totalMinor, receipt.currency)}</strong></div></div>
      <section className="receipt-footer-details"><div><span>Payment method</span><strong>{receipt.paymentMethod || 'Not provided'}</strong></div><div><span>Transaction reference</span><strong>{receipt.transactionReference || 'Not provided'}</strong></div><div><span>Verified by</span><strong>{workspace.receipt.reviewerName}</strong></div><div><span>Verification date</span><strong>{new Date(receipt.reviewedAt).toLocaleString('en-UG')}</strong></div></section>
      <footer><p>Source: Original receipt image captured or uploaded through Star Africa OS</p><Link href={`/documents/${workspace.document.id}`}><ExternalLink />View original document</Link></footer>
    </article>
  </main>;
}
