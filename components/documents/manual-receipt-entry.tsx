'use client';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Keyboard, Upload } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function ManualReceiptEntry() {
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const start = async () => { setBusy(true); setError(''); const response = await fetch('/api/documents/manual', { method: 'POST' }); const body = await response.json() as { id?: string; error?: string }; if (response.ok && body.id) window.location.assign(`/documents/${body.id}/review`); else { setBusy(false); setError(body.error ?? 'Manual entry could not be started.'); } };
  return <main className="manual-receipt-entry"><section className="panel"><Link href="/documents"><ArrowLeft />Back to documents</Link><span className="manual-icon"><Keyboard /></span><p className="eyebrow">OCR fallback</p><h1>Enter receipt manually</h1><p>Use the same structured review form when a camera is unavailable, OCR fails, or the paper is unreadable. The record will clearly identify manual entry and will never claim to replace a source receipt.</p><div className="manual-notice"><AlertTriangle /><span><strong>Supporting evidence matters</strong>Upload a readable photo or PDF whenever it becomes available. A manually entered record without an original remains visibly flagged.</span></div>{error ? <div className="form-error" role="alert">{error}</div> : null}<div><Button variant="outline" render={<Link href="/documents/upload" />}><Upload />Upload evidence first</Button><Button disabled={busy} onClick={start}><Keyboard />{busy ? 'Opening…' : 'Start manual entry'}</Button></div></section></main>;
}
