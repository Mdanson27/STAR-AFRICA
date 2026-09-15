'use client';
/* eslint-disable jsx-a11y/control-has-associated-label */
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Archive, Camera, Download, FileImage, FileText, FolderOpen, Keyboard, Search, SlidersHorizontal, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hasPermission } from '@/lib/security/permissions';

type DocumentRow = {
  id: string; internalNumber: string; title: string; originalFilename: string; mimeType: string; sizeBytes: number;
  category: string; referenceNumber: string | null; documentDate: string | null; relatedModule: string | null;
  relatedRecordId: string | null; ocrStatus: string; verificationStatus: string; uploadedAt: string; uploadedByName: string;
};

const labels: Record<string, string> = { uploaded: 'Uploaded', queued: 'Waiting', processing: 'Processing', extracted: 'Extracted', needs_review: 'Needs review', confirmed: 'Confirmed', failed: 'Failed', not_required: 'Not required', verified: 'Verified', pending: 'Pending' };
const tabs = ['All documents', 'OCR queue', 'Needs review', 'Verified', 'Folders'] as const;

function statusClass(value: string) { return value === 'confirmed' || value === 'verified' || value === 'extracted' ? 'success' : value === 'failed' ? 'danger' : value === 'needs_review' || value === 'queued' || value === 'processing' ? 'warning' : 'neutral'; }

export function DocumentsRegister({ documents, permissions }: { documents: DocumentRow[]; permissions: readonly string[] }) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<(typeof tabs)[number]>('All documents');
  const [type, setType] = useState('All types');
  const filtered = useMemo(() => documents.filter((document) => {
    const text = `${document.title} ${document.originalFilename} ${document.internalNumber} ${document.referenceNumber ?? ''} ${document.relatedRecordId ?? ''}`.toLowerCase();
    const tabMatch = tab === 'All documents' || (tab === 'OCR queue' && ['queued', 'processing', 'failed'].includes(document.ocrStatus)) || (tab === 'Needs review' && document.ocrStatus === 'needs_review') || (tab === 'Verified' && document.verificationStatus === 'verified') || (tab === 'Folders');
    const typeMatch = type === 'All types' || document.category === type;
    return tabMatch && typeMatch && text.includes(query.toLowerCase());
  }), [documents, query, tab, type]);
  const counts = { awaiting: documents.filter((d) => ['queued', 'processing'].includes(d.ocrStatus)).length, review: documents.filter((d) => d.ocrStatus === 'needs_review').length, verified: documents.filter((d) => d.verificationStatus === 'verified').length };
  const canUpload = hasPermission(permissions, 'documents.upload');
  return <main className="page-content documents-workspace">
    <section className="module-heading documents-heading">
      <div><p className="eyebrow">Company evidence, secured</p><h1>Documents &amp; OCR</h1><p>Store originals, review extracted receipt data, and connect verified evidence to business records.</p></div>
      <div className="heading-actions">{canUpload ? <><Button variant="ghost" render={<Link href="/documents/manual" />}><Keyboard />Enter manually</Button><Button variant="outline" render={<Link href="/documents/scan" />}><Camera />Scan receipt</Button><Button render={<Link href="/documents/upload" />}><Upload />Upload document</Button></> : null}</div>
    </section>
    <section className="document-workflow" aria-label="Document workflow">
      {['Upload', 'Process', 'Extract', 'Review', 'Confirm'].map((step, index) => <div key={step}><span>{index + 1}</span><strong>{step}</strong><small>{index === 4 ? 'Human verified' : 'Required step'}</small></div>)}
    </section>
    <section className="document-summary">
      <article><span>Total documents</span><strong>{documents.length}</strong><small>Private company records</small></article>
      <article><span>OCR queue</span><strong>{counts.awaiting}</strong><small>Waiting or processing</small></article>
      <article><span>Needs review</span><strong>{counts.review}</strong><small>Human action required</small></article>
      <article><span>Verified</span><strong>{counts.verified}</strong><small>Confirmed capture records</small></article>
    </section>
    <section className="panel document-register">
      <nav className="document-tabs" aria-label="Document views">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={tab === item ? 'active' : ''}>{item}</button>)}</nav>
      <header className="document-register-toolbar"><div><h2>{tab}</h2><p>{filtered.length} records visible</p></div><div className="document-filter-row"><label className="document-search"><Search /><span className="sr-only">Search documents</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search document, supplier, receipt, project…" /></label><label className="compact-filter"><SlidersHorizontal /><span className="sr-only">Filter by type</span><select value={type} onChange={(e) => setType(e.target.value)}><option>All types</option>{[...new Set(documents.map((d) => d.category))].map((value) => <option key={value}>{value}</option>)}</select></label></div></header>
      {tab === 'Folders' ? <div className="folder-grid">{['Projects', 'Bids', 'Finance', 'Procurement', 'Suppliers', 'HR', 'Contracts', 'Receipts', 'Invoices'].map((folder) => <button key={folder} onClick={() => { setTab('All documents'); setQuery(folder === 'Receipts' ? 'receipt' : folder === 'Invoices' ? 'invoice' : folder); }}><FolderOpen /><span><strong>{folder}</strong><small>Logical category</small></span></button>)}</div> : filtered.length ? <div className="table-scroll"><table className="document-table"><thead><tr><th>Document</th><th>Type / Reference</th><th>Linked record</th><th>Uploaded by</th><th>Uploaded</th><th>OCR status</th><th>Verification</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.map((document) => <tr key={document.id}><td><Link className="document-name" href={`/documents/${document.id}`}><span>{document.mimeType.startsWith('image/') ? <FileImage /> : <FileText />}</span><span><strong>{document.title}</strong><small>{document.internalNumber} · {(document.sizeBytes / 1024 / 1024).toFixed(1)} MB</small></span></Link></td><td><strong>{document.category}</strong><small>{document.referenceNumber || document.originalFilename}</small></td><td>{document.relatedRecordId ? <><strong>{document.relatedRecordId}</strong><small>{document.relatedModule}</small></> : <span className="muted">Unlinked</span>}</td><td>{document.uploadedByName}</td><td>{new Date(document.uploadedAt).toLocaleDateString('en-UG', { day: '2-digit', month: 'short', year: 'numeric' })}</td><td><span className={`document-status ${statusClass(document.ocrStatus)}`}>{labels[document.ocrStatus] ?? document.ocrStatus}</span></td><td><span className={`document-status ${statusClass(document.verificationStatus)}`}>{labels[document.verificationStatus] ?? document.verificationStatus}</span></td><td><div className="document-row-actions"><Link href={`/documents/${document.id}`}>View</Link>{document.ocrStatus === 'needs_review' ? <Link href={`/documents/${document.id}/review`}>Review</Link> : null}{hasPermission(permissions, 'documents.download') ? <a aria-label={`Download ${document.title}`} href={`/api/documents/${document.id}/file?download=1`}><Download /></a> : null}</div></td></tr>)}</tbody></table></div> : <div className="document-empty"><Archive /><h3>{tab === 'OCR queue' ? 'No documents awaiting OCR' : tab === 'Needs review' ? 'No documents need review' : 'No documents found'}</h3><p>{tab === 'OCR queue' ? 'Uploaded receipts that require processing will appear here.' : 'Adjust the filters or add company evidence.'}</p>{canUpload ? <div><Button variant="outline" render={<Link href="/documents/scan" />}><Camera />Scan receipt</Button><Button render={<Link href="/documents/upload" />}><Upload />Upload document</Button></div> : null}</div>}
    </section>
  </main>;
}
