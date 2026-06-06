import { driveMediaUrl } from '../config/drive';
import type { DriveVisualImage } from '../hooks/useDriveVisualImages';

export type VisualEffect =
  | 'duotone'
  | 'glitch'
  | 'kaleidoscope'
  | 'scanrgb'
  | 'pulse'
  | 'wave'
  | 'pixel'
  | 'neon';

const EFFECTS: VisualEffect[] = [
  'duotone',
  'glitch',
  'kaleidoscope',
  'scanrgb',
  'pulse',
  'wave',
  'pixel',
  'neon',
];

const imageCache = new Map<string, HTMLImageElement>();

export function pickRandomImage(
  images: DriveVisualImage[],
  excludeId?: string,
): DriveVisualImage {
  if (images.length === 1) return images[0];
  let next = images[Math.floor(Math.random() * images.length)];
  if (excludeId && images.length > 1) {
    let guard = 0;
    while (next.id === excludeId && guard++ < 12) {
      next = images[Math.floor(Math.random() * images.length)];
    }
  }
  return next;
}

export function pickRandomEffect(exclude?: VisualEffect): VisualEffect {
  if (EFFECTS.length === 1) return EFFECTS[0];
  let next = EFFECTS[Math.floor(Math.random() * EFFECTS.length)];
  if (exclude && EFFECTS.length > 1) {
    let guard = 0;
    while (next === exclude && guard++ < 12) {
      next = EFFECTS[Math.floor(Math.random() * EFFECTS.length)];
    }
  }
  return next;
}

export async function loadDriveImage(id: string): Promise<HTMLImageElement | null> {
  const cached = imageCache.get(id);
  if (cached?.complete && cached.naturalWidth > 0) return cached;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(id, img);
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = driveMediaUrl(id);
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  zoom = 1,
  panX = 0,
  panY = 0,
) {
  const scale = Math.max(width / img.width, height / img.height) * zoom;
  const sw = img.width * scale;
  const sh = img.height * scale;
  const x = (width - sw) / 2 + panX;
  const y = (height - sh) / 2 + panY;
  ctx.drawImage(img, x, y, sw, sh);
}

function drawBase(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  time: number,
  energy: number,
) {
  const zoom = 1 + Math.sin(time * 0.8) * 0.04 * (0.35 + energy);
  const panX = Math.sin(time * 0.5) * width * 0.03;
  const panY = Math.cos(time * 0.45) * height * 0.02;
  drawCover(ctx, img, width, height, zoom, panX, panY);
}

function applyDuotone(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  time: number,
  energy: number,
) {
  drawBase(ctx, img, width, height, time, energy);
  ctx.globalCompositeOperation = 'multiply';
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, `rgba(0, 80, 100, ${0.55 + energy * 0.25})`);
  grad.addColorStop(0.5, `rgba(120, 60, 0, ${0.35 + energy * 0.2})`);
  grad.addColorStop(1, `rgba(0, 229, 255, ${0.45 + energy * 0.3})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = `rgba(245, 166, 35, ${0.08 + energy * 0.12})`;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
}

function applyGlitch(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  time: number,
  energy: number,
) {
  const temp = document.createElement('canvas');
  temp.width = width;
  temp.height = height;
  const tctx = temp.getContext('2d');
  if (!tctx) return;
  drawBase(tctx, img, width, height, time, energy * 0.5);
  ctx.drawImage(temp, 0, 0);

  const slices = 10 + Math.floor(energy * 14);
  for (let i = 0; i < slices; i++) {
    if (Math.random() > 0.35 + energy * 0.45) continue;
    const sh = Math.random() * (height / 6) + 4;
    const sy = Math.random() * (height - sh);
    const offset = (Math.random() - 0.5) * width * 0.12 * (0.4 + energy);
    ctx.drawImage(temp, 0, sy, width, sh, offset, sy, width, sh);
  }
  ctx.fillStyle = `rgba(0, 229, 255, ${0.04 + energy * 0.08})`;
  ctx.fillRect(0, 0, width, height);
}

function applyKaleidoscope(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  time: number,
  energy: number,
) {
  const cx = width / 2;
  const cy = height / 2;
  const segments = 6;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(time * 0.15);
  for (let i = 0; i < segments; i++) {
    ctx.save();
    ctx.rotate((Math.PI * 2 * i) / segments);
    ctx.scale(1, i % 2 === 0 ? 1 : -1);
    ctx.translate(-cx, -cy);
    drawCover(ctx, img, width, height, 1.05 + energy * 0.15);
    ctx.restore();
  }
  ctx.restore();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = `rgba(245, 166, 35, ${0.06 + energy * 0.1})`;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
}

function applyScanRgb(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  time: number,
  energy: number,
) {
  const temp = document.createElement('canvas');
  temp.width = width;
  temp.height = height;
  const tctx = temp.getContext('2d');
  if (!tctx) return;

  tctx.filter = 'grayscale(1) contrast(1.2)';
  drawCover(tctx, img, width, height, 1.02);
  tctx.filter = 'none';

  const shift = 3 + energy * 10;
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(temp, shift, 0);
  ctx.globalAlpha = 0.55;
  ctx.drawImage(temp, -shift, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  for (let y = 0; y < height; y += 3) {
    ctx.fillRect(0, y, width, 1);
  }
  ctx.fillStyle = `rgba(0, 229, 255, ${0.05 + Math.sin(time * 6) * 0.03})`;
  ctx.fillRect(0, (time * 80) % height, width, 2);
}

function applyPulse(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  time: number,
  energy: number,
) {
  const pulse = 1 + Math.sin(time * 3) * 0.08 * (0.5 + energy);
  ctx.filter = `saturate(${1.2 + energy * 0.8}) contrast(${1.05 + energy * 0.3})`;
  drawCover(ctx, img, width, height, pulse);
  ctx.filter = 'none';
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) * (0.35 + energy * 0.25);
  const ring = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r);
  ring.addColorStop(0, 'transparent');
  ring.addColorStop(1, `rgba(0, 229, 255, ${0.15 + energy * 0.35})`);
  ctx.fillStyle = ring;
  ctx.fillRect(0, 0, width, height);
}

function applyWave(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  time: number,
  energy: number,
) {
  const temp = document.createElement('canvas');
  temp.width = width;
  temp.height = height;
  const tctx = temp.getContext('2d');
  if (!tctx) return;
  drawCover(tctx, img, width, height);

  const stripH = 4;
  for (let y = 0; y < height; y += stripH) {
    const wave = Math.sin(y * 0.04 + time * 2) * (8 + energy * 22);
    ctx.drawImage(temp, 0, y, width, stripH + 1, wave, y, width, stripH + 1);
  }
}

function applyPixel(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  time: number,
  energy: number,
) {
  const block = Math.max(6, Math.floor(24 - energy * 16 + Math.sin(time) * 4));
  const off = document.createElement('canvas');
  off.width = Math.ceil(width / block);
  off.height = Math.ceil(height / block);
  const offCtx = off.getContext('2d');
  if (!offCtx) {
    drawBase(ctx, img, width, height, time, energy);
    return;
  }
  offCtx.drawImage(img, 0, 0, off.width, off.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, 0, 0, off.width, off.height, 0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = `rgba(245, 166, 35, ${0.06 + energy * 0.08})`;
  ctx.fillRect(0, 0, width, height);
}

function applyNeon(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  time: number,
  energy: number,
) {
  ctx.filter = `hue-rotate(${(time * 40) % 360}deg) saturate(1.6) contrast(1.25) brightness(${0.9 + energy * 0.2})`;
  drawCover(ctx, img, width, height, 1.03);
  ctx.filter = 'none';
  ctx.globalCompositeOperation = 'screen';
  ctx.strokeStyle = `rgba(0, 229, 255, ${0.25 + energy * 0.4})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, width - 16, height - 16);
  ctx.globalCompositeOperation = 'source-over';
}

export function renderVisualEffect(
  ctx: CanvasRenderingContext2D,
  effect: VisualEffect,
  img: HTMLImageElement,
  width: number,
  height: number,
  time: number,
  energy: number,
) {
  switch (effect) {
    case 'duotone':
      applyDuotone(ctx, img, width, height, time, energy);
      break;
    case 'glitch':
      applyGlitch(ctx, img, width, height, time, energy);
      break;
    case 'kaleidoscope':
      applyKaleidoscope(ctx, img, width, height, time, energy);
      break;
    case 'scanrgb':
      applyScanRgb(ctx, img, width, height, time, energy);
      break;
    case 'pulse':
      applyPulse(ctx, img, width, height, time, energy);
      break;
    case 'wave':
      applyWave(ctx, img, width, height, time, energy);
      break;
    case 'pixel':
      applyPixel(ctx, img, width, height, time, energy);
      break;
    case 'neon':
      applyNeon(ctx, img, width, height, time, energy);
      break;
  }
}

export function drawAudioOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: Uint8Array<ArrayBuffer>,
  energy: number,
) {
  const barCount = 32;
  const step = Math.max(1, Math.floor(data.length / barCount));
  const gap = 2;
  const barW = (width - gap * (barCount - 1)) / barCount;

  for (let i = 0; i < barCount; i++) {
    let sum = 0;
    for (let j = 0; j < step; j++) sum += data[i * step + j];
    const level = sum / step / 255;
    const barH = Math.max(2, level * height * 0.22);
    const x = i * (barW + gap);
    ctx.fillStyle = `rgba(0, 229, 255, ${0.15 + level * 0.55})`;
    ctx.fillRect(x, height - barH, barW, barH);
  }

  if (energy > 0.08) {
    ctx.fillStyle = `rgba(245, 166, 35, ${energy * 0.12})`;
    ctx.fillRect(0, 0, width, height);
  }
}

export function drawStatusMessage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  message: string,
) {
  ctx.fillStyle = '#0a0b0d';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(0, 229, 255, 0.85)';
  ctx.font = '600 11px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = message.split('\n');
  const lineH = 16;
  const startY = height / 2 - ((lines.length - 1) * lineH) / 2;
  lines.forEach((line, i) => ctx.fillText(line, width / 2, startY + i * lineH));
}

export const IMAGE_CHANGE_MS = 30_000;
