'use client';
/* eslint-disable next/no-img-element, jsx-a11y/label-has-associated-control */
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, Camera, Check, Crop, ImageUp, RefreshCw, RotateCw, SwitchCamera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';

async function transformImage(dataUrl: string, rotation = 0, inset = 0) {
  const image = new Image(); image.src = dataUrl; await image.decode();
  const cropX = Math.round(image.width * inset / 100); const cropY = Math.round(image.height * inset / 100);
  const sourceWidth = image.width - cropX * 2; const sourceHeight = image.height - cropY * 2;
  const swap = Math.abs(rotation % 180) === 90;
  const canvas = document.createElement('canvas'); canvas.width = swap ? sourceHeight : sourceWidth; canvas.height = swap ? sourceWidth : sourceHeight;
  const context = canvas.getContext('2d'); if (!context) return dataUrl;
  context.translate(canvas.width / 2, canvas.height / 2); context.rotate(rotation * Math.PI / 180);
  context.drawImage(image, cropX, cropY, sourceWidth, sourceHeight, -sourceWidth / 2, -sourceHeight / 2, sourceWidth, sourceHeight);
  return canvas.toDataURL('image/jpeg', .92);
}

export function ReceiptScanner({ projects }: { projects: Array<{ id: string; code: string; name: string }> }) {
  const videoRef = useRef<HTMLVideoElement>(null); const streamRef = useRef<MediaStream | null>(null); const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<'ready' | 'camera' | 'preview' | 'saving'>('ready');
  const [capture, setCapture] = useState(''); const [error, setError] = useState(''); const [qualityWarning, setQualityWarning] = useState('');
  const [facing, setFacing] = useState<'environment' | 'user'>('environment'); const [inset, setInset] = useState(0);
  const [meta, setMeta] = useState({ title: `Receipt ${new Date().toLocaleDateString('en-UG')}`, referenceNumber: '', documentDate: new Date().toISOString().slice(0, 10), projectId: '' });
  const stopCamera = useCallback(() => { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; if (videoRef.current) videoRef.current.srcObject = null; }, []);
  useEffect(() => () => stopCamera(), [stopCamera]);
  const startCamera = async (nextFacing = facing) => {
    setError(''); stopCamera();
    if (!navigator.mediaDevices?.getUserMedia) { setError('A camera is not available in this browser. Upload an image instead.'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: nextFacing }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      streamRef.current = stream; setPhase('camera'); requestAnimationFrame(() => { if (videoRef.current) { videoRef.current.srcObject = stream; void videoRef.current.play(); } });
    } catch { setError('Camera access is required to scan a receipt. Check browser permission, or upload an image instead.'); setPhase('ready'); }
  };
  const takePhoto = () => {
    const video = videoRef.current; if (!video?.videoWidth) { setError('The camera is not ready yet.'); return; }
    const canvas = document.createElement('canvas'); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0); setCapture(canvas.toDataURL('image/jpeg', .92));
    setQualityWarning(video.videoWidth < 800 || video.videoHeight < 600 ? 'Image quality may reduce OCR accuracy. The capture resolution is low.' : ''); stopCamera(); setPhase('preview');
  };
  const uploadInstead = (file?: File) => { if (!file || !file.type.startsWith('image/')) return; const reader = new FileReader(); reader.onload = () => { if (typeof reader.result === 'string') { setCapture(reader.result); setPhase('preview'); } }; reader.readAsDataURL(file); };
  const rotate = async () => setCapture(await transformImage(capture, 90));
  const applyCrop = async () => { setCapture(await transformImage(capture, 0, inset)); setInset(0); };
  const save = async () => {
    setPhase('saving'); setError('');
    try {
      const blob = await (await fetch(capture)).blob(); const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const data = new FormData(); data.set('file', file); data.set('title', meta.title); data.set('category', 'Receipt'); data.set('referenceNumber', meta.referenceNumber); data.set('documentDate', meta.documentDate); data.set('relatedModule', meta.projectId ? 'Project' : ''); data.set('relatedRecordId', meta.projectId); data.set('ocrRequired', 'true'); data.set('description', 'Receipt captured with the Star Africa camera scanner');
      const response = await fetch('/api/documents', { method: 'POST', body: data }); const result = await response.json() as { id?: string; error?: string };
      if (!response.ok || !result.id) throw new Error(result.error || 'The captured receipt could not be stored.');
      const ocrResponse = await fetch(`/api/documents/${result.id}/ocr`, { method: 'POST' });
      window.location.assign(ocrResponse.ok ? `/documents/${result.id}/review` : `/documents/${result.id}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The receipt could not be saved.'); setPhase('preview'); }
  };
  return <main className="page-content receipt-scan-page">
    <header className="document-page-head"><Link href="/documents"><ArrowLeft />Back to documents</Link><div><p className="eyebrow">Mobile receipt capture</p><h1>Scan receipt</h1><p>Frame the full receipt, check readability, then send the secured original to OCR review.</p></div></header>
    <section className="document-workflow compact" aria-label="Receipt scan progress">{['Upload', 'Process', 'Extract', 'Review', 'Confirm'].map((step, index) => <div className={(phase === 'preview' && index === 0) || (phase === 'saving' && index <= 1) ? 'active' : ''} key={step}><span>{index + 1}</span><strong>{step}</strong></div>)}</section>
    <section className="scanner-shell panel">
      {phase === 'ready' ? <div className="camera-ready"><span><Camera /></span><h2>Ready to capture company evidence</h2><p>Camera access begins only when you press the button below. On phones, Star Africa will prefer the rear camera.</p><Button size="lg" onClick={() => startCamera()}><Camera />Open camera</Button><button onClick={() => fileRef.current?.click()}><ImageUp />Upload image instead</button><input className="sr-only" ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload receipt image instead" onChange={(e) => uploadInstead(e.target.files?.[0])} /></div> : null}
      {phase === 'camera' ? <div className="live-camera"><video ref={videoRef} muted playsInline aria-label="Live receipt camera preview" /><div className="receipt-frame"><span>Align receipt inside frame</span></div><div className="camera-controls"><button aria-label="Cancel camera" onClick={() => { stopCamera(); setPhase('ready'); }}><X /></button><button className="capture-button" aria-label="Capture receipt" onClick={takePhoto}><span /></button><button aria-label="Switch camera" onClick={() => { const next = facing === 'environment' ? 'user' : 'environment'; setFacing(next); void startCamera(next); }}><SwitchCamera /></button></div></div> : null}
      {(phase === 'preview' || phase === 'saving') ? <div className="scan-review"><div className="scan-photo"><img src={capture} alt="Captured receipt preview" /><div className="scan-image-tools"><Button variant="outline" onClick={rotate}><RotateCw />Rotate</Button><label><Crop />Trim edges <input aria-label="Crop receipt edges" type="range" min="0" max="15" value={inset} onChange={(e) => setInset(Number(e.target.value))} /></label><Button variant="outline" disabled={!inset} onClick={applyCrop}>Apply crop</Button></div></div><div className="scan-metadata"><p className="eyebrow">Before OCR</p><h2>Use this photo?</h2><p>Make sure the merchant name, receipt number, date, and total are readable.</p>{qualityWarning ? <div className="inline-warning"><AlertTriangle /><span><strong>Quality warning</strong>{qualityWarning}</span></div> : null}<label><span>Document title</span><Input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} /></label><label><span>Receipt reference</span><Input value={meta.referenceNumber} onChange={(e) => setMeta({ ...meta, referenceNumber: e.target.value })} /></label><label><span>Receipt date</span><Input type="date" value={meta.documentDate} onChange={(e) => setMeta({ ...meta, documentDate: e.target.value })} /></label><label><span>Project (optional)</span><NativeSelect value={meta.projectId} onChange={(e) => setMeta({ ...meta, projectId: e.target.value })}><option value="">Link during review</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.code} — {project.name}</option>)}</NativeSelect></label><div className="scan-actions"><Button variant="outline" disabled={phase === 'saving'} onClick={() => { setCapture(''); setPhase('ready'); }}><RefreshCw />Retake</Button><Button disabled={phase === 'saving' || !meta.title.trim()} onClick={save}>{phase === 'saving' ? 'Processing receipt…' : <><Check />Use photo &amp; OCR</>}</Button></div></div></div> : null}
      {error ? <div className="scanner-error" role="alert"><AlertTriangle />{error}<button onClick={() => fileRef.current?.click()}>Upload image instead</button></div> : null}
    </section>
  </main>;
}
