import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const source = fileURLToPath(new URL('../logo.png', import.meta.url));
const target = fileURLToPath(new URL('../public/branding/star-africa-mark.png', import.meta.url));
const compactLogo = fileURLToPath(new URL('../public/branding/star-africa-logo-compact.png', import.meta.url));
const favicon = fileURLToPath(new URL('../app/icon.png', import.meta.url));
const appleIcon = fileURLToPath(new URL('../app/apple-icon.png', import.meta.url));
const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;
const selected = new Uint8Array(width * height);
const queue = new Int32Array(width * height);
const isNavy = (pixel) => {
  const offset = pixel * channels;
  return data[offset] < 100 && data[offset + 1] < 135 && data[offset + 2] < 185 && data[offset + 3] > 100;
};

let seed = -1;
for (let y = 320; y < 760 && seed < 0; y += 1) {
  for (let x = 100; x < 430; x += 1) {
    const pixel = y * width + x;
    if (isNavy(pixel)) { seed = pixel; break; }
  }
}
if (seed < 0) throw new Error('Could not locate the official Africa/star mark.');

let read = 0;
let write = 0;
queue[write++] = seed;
selected[seed] = 1;
let minX = width;
let minY = height;
let maxX = 0;
let maxY = 0;
while (read < write) {
  const pixel = queue[read++];
  const x = pixel % width;
  const y = Math.floor(pixel / width);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) {
    if (!dx && !dy) continue;
    const nx = x + dx; const ny = y + dy;
    if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
    const next = ny * width + nx;
    if (!selected[next] && isNavy(next)) { selected[next] = 1; queue[write++] = next; }
  }
}

const croppedWidth = maxX - minX + 1;
const croppedHeight = maxY - minY + 1;
const isolated = Buffer.alloc(croppedWidth * croppedHeight * 4);
for (let y = minY; y <= maxY; y += 1) for (let x = minX; x <= maxX; x += 1) {
  const sourcePixel = y * width + x;
  if (!selected[sourcePixel]) continue;
  const sourceOffset = sourcePixel * channels;
  const targetOffset = ((y - minY) * croppedWidth + (x - minX)) * 4;
  data.copy(isolated, targetOffset, sourceOffset, sourceOffset + 4);
}

const mark = await sharp(isolated, { raw: { width: croppedWidth, height: croppedHeight, channels: 4 } })
  .resize(214, 214, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png()
  .toBuffer();
await sharp({ create: { width: 256, height: 256, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
  .composite([{ input: mark, gravity: 'centre' }])
  .png()
  .toFile(target);

await fs.access(target);
await sharp(source).trim({ background: '#ffffff', threshold: 12 }).extend({ top: 24, bottom: 24, left: 24, right: 24, background: '#ffffff' }).png().toFile(compactLogo);
await sharp(target).resize(32, 32).png().toFile(favicon);
await sharp(target).resize(180, 180).png().toFile(appleIcon);
process.stdout.write(`Created compact logo and favicon formats from the official asset (${croppedWidth}x${croppedHeight} mark).\n`);
