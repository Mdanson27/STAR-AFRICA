'use client';

import { Printer } from 'lucide-react';
import { StarAfricaLogo } from '@/components/star-africa-logo';
import { MoneyDisplay } from '@/components/brand-primitives';
import { Button } from '@/components/ui/button';

const lines = [
  ['Site mobilisation and preliminaries', 1, 42_000_000],
  ['Laboratory fit-out works — certified stage 04', 1, 126_000_000],
] as const;

export default function InvoicePreviewPage() {
  const subtotal = lines.reduce((sum, line) => sum + line[2], 0);
  const vat = subtotal * 0.18;
  const total = subtotal + vat;
  return <main className="print-preview-page"><div className="print-preview-actions"><Button variant="outline" onClick={() => history.back()}>Back</Button><Button onClick={() => window.print()}><Printer /> Print / save PDF</Button></div><article className="print-document">
    <header><StarAfricaLogo size="large" /><div><p>TAX INVOICE</p><strong>INV-2026-0184</strong><span>Issue date: 15 August 2026</span><span>Due date: 29 August 2026</span></div></header>
    <section className="print-parties"><div><small>ISSUED BY</small><strong>Star Africa Logistics</strong><span>Kampala, Uganda</span><span>TIN: Demo value — configure before production</span></div><div><small>BILL TO</small><strong>Ministry of Health</strong><span>Kampala, Uganda</span><span>Project: SA-PRJ-024</span></div></section>
    <table><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>{lines.map(([description, quantity, amount]) => <tr key={description}><td>{description}</td><td>{quantity}</td><td><MoneyDisplay value={amount} /></td><td><MoneyDisplay value={amount * quantity} /></td></tr>)}</tbody></table>
    <section className="print-totals"><div><span>Subtotal</span><MoneyDisplay value={subtotal} /></div><div><span>VAT — illustrative 18%</span><MoneyDisplay value={vat} /></div><div className="grand-total"><strong>Total due</strong><strong><MoneyDisplay value={total} /></strong></div></section>
    <footer><p>Payment reference: INV-2026-0184</p><span>This is fictional demonstration data. Confirm company, bank, tax, and statutory details before production use.</span></footer>
  </article></main>;
}
