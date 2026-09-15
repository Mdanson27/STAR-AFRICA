import { maxDocumentBytes, supportedMimeTypes } from './types';

const signatures: Record<string, (bytes: Uint8Array) => boolean> = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  'image/webp': (b) => String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP',
  'application/pdf': (b) => String.fromCharCode(...b.slice(0, 5)) === '%PDF-',
};

export function validateDocumentFile(file: File, bytes: ArrayBuffer) {
  if (!supportedMimeTypes.includes(file.type as (typeof supportedMimeTypes)[number])) return 'Unsupported file type. Upload JPG, JPEG, PNG, WEBP, or PDF.';
  if (file.size <= 0) return 'The selected file is empty.';
  if (file.size > maxDocumentBytes) return 'The file exceeds the 15 MB upload limit.';
  if (bytes.byteLength !== file.size) return 'The upload could not be read completely.';
  if (!signatures[file.type]?.(new Uint8Array(bytes).slice(0, 16))) return 'The file appears corrupt or its contents do not match its type.';
  return null;
}

export async function sha256Hex(bytes: ArrayBuffer) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function sanitizeFilename(value: string) {
  return value.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 150) || 'document';
}
