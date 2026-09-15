'use client';
/* eslint-disable next/no-img-element, jsx-a11y/label-has-associated-control */
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, FileText, Maximize2, RotateCcw, RotateCw, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { documentCategories, maxDocumentBytes } from '@/lib/documents/types';

type Options = { projects: Array<{ id: string; code: string; name: string }>; suppliers: Array<{ id: string; code: string; name: string }> };
type Quality = { warning?: string; width?: number; height?: number };

export function DocumentUpload({ options }: { options: Options }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [dragging, setDragging] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [duplicateId, setDuplicateId] = useState('');
  const [quality, setQuality] = useState<Quality>({});
  const [form, setForm] = useState({ title: '', category: 'Receipt', referenceNumber: '', documentDate: new Date().toISOString().slice(0, 10), description: '', relatedModule: '', relatedRecordId: '', tags: '', notes: '', ocrRequired: true });
  const relatedRecords = useMemo(() => form.relatedModule === 'Project' ? options.projects.map((item) => ({ id: item.id, label: `${item.code} — ${item.name}` })) : form.relatedModule === 'Supplier' ? options.suppliers.map((item) => ({ id: item.id, label: `${item.code} — ${item.name}` })) : [], [form.relatedModule, options]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  useEffect(() => { const params = new URLSearchParams(window.location.search); const relatedModule = params.get('relatedModule'); const relatedRecordId = params.get('relatedRecordId'); if (relatedModule && relatedRecordId) queueMicrotask(() => setForm((current) => ({ ...current, relatedModule, relatedRecordId }))); }, []);
  const choose = (selected?: File) => {
    if (!selected) return;
    setError(''); setDuplicateId(''); setQuality({});
    if (selected.size > maxDocumentBytes) { setError('The file exceeds the 15 MB upload limit.'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(selected.type)) { setError('Upload a JPG, JPEG, PNG, WEBP, or PDF file.'); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(selected); setFile(selected); setPreviewUrl(url); setRotation(0); setZoom(1);
    setForm((current) => ({ ...current, title: current.title || selected.name.replace(/\.[^.]+$/, ''), category: selected.name.toLowerCase().includes('invoice') ? 'Supplier Invoice' : current.category }));
    if (selected.type.startsWith('image/')) {
      const image = new Image(); image.onload = () => setQuality(image.naturalWidth < 800 || image.naturalHeight < 600 ? { width: image.naturalWidth, height: image.naturalHeight, warning: 'Image quality may reduce OCR accuracy. The resolution is lower than recommended.' } : { width: image.naturalWidth, height: image.naturalHeight }); image.onerror = () => setError('The image could not be previewed and may be corrupt.'); image.src = url;
    }
  };
  const upload = (allowDuplicate = false) => {
    if (!file) { setError('Choose a document before continuing.'); return; }
    setBusy(true); setError(''); setProgress(0);
    const data = new FormData(); data.set('file', file); Object.entries(form).forEach(([key, value]) => data.set(key, String(value))); if (allowDuplicate) data.set('allowDuplicate', 'true');
    const xhr = new XMLHttpRequest(); xhr.open('POST', '/api/documents');
    xhr.upload.onprogress = (event) => { if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 90)); };
    xhr.onerror = () => { setBusy(false); setError('The upload was interrupted. Your document was not saved.'); };
    xhr.onload = async () => {
      setBusy(false); const body = JSON.parse(xhr.responseText || '{}') as { id?: string; error?: string; duplicate?: { id: string } };
      if (xhr.status === 409 && body.duplicate) { setDuplicateId(body.duplicate.id); setError(body.error ?? 'Possible duplicate document.'); return; }
      if (xhr.status < 200 || xhr.status >= 300 || !body.id) { setError(body.error ?? 'The document could not be saved.'); return; }
      setProgress(100);
      if (form.ocrRequired) {
        const response = await fetch(`/api/documents/${body.id}/ocr`, { method: 'POST' });
        window.location.assign(response.ok ? `/documents/${body.id}/review` : `/documents/${body.id}`);
      } else window.location.assign(`/documents/${body.id}`);
    };
    xhr.send(data);
  };
  return <main className="page-content document-capture-page">
    <header className="document-page-head"><Link href="/documents"><ArrowLeft />Back to documents</Link><div><p className="eyebrow">New company evidence</p><h1>Upload document</h1><p>Add the original file, describe it, then choose whether it should enter the OCR review workflow.</p></div></header>
    <section className="document-workflow compact" aria-label="Upload progress">{['Upload', 'Process', 'Extract', 'Review', 'Confirm'].map((step, index) => <div className={index === 0 ? 'active' : ''} key={step}><span>{index + 1}</span><strong>{step}</strong></div>)}</section>
    <div className="upload-layout">
      <section className="panel upload-evidence-panel">
        <header><div><p className="eyebrow">Original document</p><h2>{file ? 'Preview' : 'Choose a file'}</h2></div>{file ? <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPreviewUrl(''); }}><X />Remove</Button> : null}</header>
        {!file ? <div className={`upload-dropzone ${dragging ? 'dragging' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); choose(e.dataTransfer.files[0]); }}>
          <UploadCloud /><h3>Drop company evidence here</h3><p>JPG, JPEG, PNG, WEBP, or PDF · maximum 15 MB</p><Button type="button" onClick={() => inputRef.current?.click()}>Browse files</Button><input ref={inputRef} className="sr-only" aria-label="Choose a document" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={(e) => choose(e.target.files?.[0])} />
        </div> : <><div className="preview-toolbar"><Button variant="outline" size="sm" onClick={() => setZoom((v) => Math.min(v + .25, 2.5))}>Zoom +</Button><Button variant="outline" size="sm" onClick={() => setZoom(1)}>Fit</Button><Button aria-label="Rotate left" variant="outline" size="icon-sm" onClick={() => setRotation((v) => v - 90)}><RotateCcw /></Button><Button aria-label="Rotate right" variant="outline" size="icon-sm" onClick={() => setRotation((v) => v + 90)}><RotateCw /></Button><Button aria-label="Fullscreen preview" variant="outline" size="icon-sm" onClick={() => previewRef.current?.requestFullscreen()}><Maximize2 /></Button></div><div ref={previewRef} className="document-preview-stage">{file.type === 'application/pdf' ? <iframe title="PDF preview" src={previewUrl} /> : <img alt="Selected document preview" src={previewUrl} style={{ transform: `rotate(${rotation}deg) scale(${zoom})` }} />}</div><footer><FileText /><span><strong>{file.name}</strong><small>{(file.size / 1024 / 1024).toFixed(2)} MB{quality.width ? ` · ${quality.width} × ${quality.height}px` : ''}</small></span></footer></>}
        {quality.warning ? <div className="inline-warning"><AlertTriangle /><span><strong>Image quality warning</strong>{quality.warning}</span></div> : null}
      </section>
      <section className="panel upload-metadata-panel"><header><p className="eyebrow">Document metadata</p><h2>Describe this evidence</h2><p>These details make the original searchable and linkable after upload.</p></header>
        <div className="document-form-grid">
          <label className="wide"><span>Document title <b>*</b></span><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
          <label><span>Category <b>*</b></span><NativeSelect value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{documentCategories.map((category) => <option key={category}>{category}</option>)}</NativeSelect></label>
          <label><span>Reference number</span><Input value={form.referenceNumber} onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })} /></label>
          <label><span>Document date</span><Input type="date" value={form.documentDate} onChange={(e) => setForm({ ...form, documentDate: e.target.value })} /></label>
          <label><span>Related module</span><NativeSelect value={form.relatedModule} onChange={(e) => setForm({ ...form, relatedModule: e.target.value, relatedRecordId: '' })}><option value="">Not linked yet</option><option>Project</option><option>Supplier</option><option>Customer</option><option>Invoice</option><option>Payment</option><option>Purchase Order</option><option>Bid</option><option>Expense</option></NativeSelect></label>
          <label className="wide"><span>Related record</span>{relatedRecords.length ? <NativeSelect value={form.relatedRecordId} onChange={(e) => setForm({ ...form, relatedRecordId: e.target.value })}><option value="">Select a record</option>{relatedRecords.map((record) => <option value={record.id} key={record.id}>{record.label}</option>)}</NativeSelect> : <Input placeholder="Record ID or reference" value={form.relatedRecordId} onChange={(e) => setForm({ ...form, relatedRecordId: e.target.value })} />}</label>
          <label className="wide"><span>Description</span><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label className="wide"><span>Tags</span><Input placeholder="receipt, materials, jinja" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></label>
          <label className="wide"><span>Notes</span><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <label className="ocr-toggle wide"><input type="checkbox" checked={form.ocrRequired} onChange={(e) => setForm({ ...form, ocrRequired: e.target.checked })} /><span><strong>Process with OCR</strong><small>Extract receipt or invoice fields, then require human review before confirmation.</small></span></label>
        </div>
        {error ? <div className="form-error" role="alert"><AlertTriangle />{error}{duplicateId ? <span><Link href={`/documents/${duplicateId}`}>View existing</Link><button onClick={() => upload(true)}>Save anyway — authorized</button></span> : null}</div> : null}
        {busy || progress ? <div className="upload-progress" aria-live="polite"><div><span>{busy ? 'Securing original document…' : 'Upload complete'}</span><strong>{progress}%</strong></div><progress max="100" value={progress} /></div> : null}
        <footer><Button variant="outline" render={<Link href="/documents" />}>Cancel</Button><Button disabled={busy || !file || !form.title.trim()} onClick={() => upload()}>{busy ? 'Saving…' : <><Check />Save &amp; continue</>}</Button></footer>
      </section>
    </div>
  </main>;
}
