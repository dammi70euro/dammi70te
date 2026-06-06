import { driveMediaUrl } from '../config/drive';
import type { VisuatronImage } from '../hooks/useVisuatronImages';
import {
  drawConcertSpotlights,
  drawDiscoAudioPulse,
  renderDiscoBase,
} from './effects';

export type VisuatronEffect = 'disco' | 'mirror' | 'vortex' | 'glitch';

const imageCache = new Map<string, HTMLImageElement>();

export async function loadVisuatronImage(image: VisuatronImage): Promise<HTMLImageElement | null> {
  const cached = imageCache.get(image.id);
  if (cached?.complete && cached.naturalWidth > 0) return cached;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(image.id, img);
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = image.source === 'local' && image.url ? image.url : driveMediaUrl(image.id);
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
  rotation = 0,
) {
  ctx.save();
  ctx.translate(width / 2 + panX, height / 2 + panY);
  ctx.rotate(rotation);
  const scale = Math.max(width / img.width, height / img.height) * zoom;
  const sw = img.width * scale;
  const sh = img.height * scale;
  ctx.drawImage(img, -sw / 2, -sh / 2, sw, sh);
  ctx.restore();
}

function syntheticEnergy(time: number, speed: number): number {
  return 0.28 + Math.sin(time * speed * 1.4) * 0.18 + Math.sin(time * speed * 2.7) * 0.1;
}

function renderMirror(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  time: number,
  speed: number,
) {
  const segments = 6;
  const sliceW = width / segments;
  const wobble = Math.sin(time * speed * 0.8) * 12;

  for (let i = 0; i < segments; i++) {
    const flip = i % 2 === 0 ? 1 : -1;
    const sx = (i / segments) * img.width;
    const sw = img.width / segments;

    ctx.save();
    ctx.beginPath();
    ctx.rect(i * sliceW, 0, sliceW, height);
    ctx.clip();

    ctx.translate(i * sliceW + sliceW / 2, height / 2);
    ctx.scale(flip, 1 + Math.sin(time * speed + i) * 0.06);
    ctx.translate(-(i * sliceW + sliceW / 2), -height / 2);

    const scale = Math.max(width / img.width, height / img.height) * 1.05;
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, sx, 0, sw, img.height, (width - dw) / 2 + wobble, (height - dh) / 2, dw, dh);
    ctx.restore();
  }

  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = `rgba(0, 229, 255, ${0.08 + Math.sin(time) * 0.04})`;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function renderVortex(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  time: number,
  speed: number,
) {
  ctx.fillStyle = '#050608';
  ctx.fillRect(0, 0, width, height);

  const count = 8;
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const angle = time * speed * 0.6 + t * Math.PI * 2;
    const zoom = 0.55 + t * 0.45;
    const alpha = 0.15 + (1 - t) * 0.35;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = 'screen';
    drawCover(ctx, img, width, height, zoom, Math.cos(angle) * width * 0.04, Math.sin(angle) * height * 0.04, angle * 0.15);
    ctx.restore();
  }
}

function renderGlitch(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  time: number,
  speed: number,
) {
  drawCover(ctx, img, width, height, 1.02);

  const energy = syntheticEnergy(time, speed);
  const sliceCount = 6 + Math.floor(energy * 4);

  for (let i = 0; i < sliceCount; i++) {
    const y = ((i * 997 + Math.floor(time * 40 * speed)) % 1000) / 1000 * height;
    const h = height * (0.02 + Math.random() * 0.04);
    const shift = (Math.random() - 0.5) * width * 0.08 * energy;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.35;
    ctx.drawImage(ctx.canvas, 0, y, width, h, shift, y, width, h);
    ctx.restore();
  }

  ctx.save();
  ctx.fillStyle = `rgba(255, 40, 120, ${0.04 + energy * 0.06})`;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = `rgba(0, 229, 255, ${0.03 + energy * 0.05})`;
  ctx.fillRect(energy * 6, 0, width, height);
  ctx.restore();
}

export function renderVisuatronFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  effect: VisuatronEffect,
  time: number,
  speed: number,
) {
  const energy = syntheticEnergy(time, speed);

  switch (effect) {
    case 'disco': {
      renderDiscoBase(ctx, img, width, height, time * speed, energy);
      drawConcertSpotlights(ctx, width, height, time * speed, energy);
      drawDiscoAudioPulse(ctx, width, height, energy);
      break;
    }
    case 'mirror':
      renderMirror(ctx, img, width, height, time * speed, speed);
      break;
    case 'vortex':
      renderVortex(ctx, img, width, height, time * speed, speed);
      break;
    case 'glitch':
      renderGlitch(ctx, img, width, height, time * speed, speed);
      break;
  }
}

export const VISUATRON_EFFECTS: { id: VisuatronEffect; label: string; icon: string }[] = [
  { id: 'disco', label: 'Disco', icon: '🪩' },
  { id: 'mirror', label: 'Specchio', icon: '🪞' },
  { id: 'vortex', label: 'Vortice', icon: '🌀' },
  { id: 'glitch', label: 'Glitch', icon: '⚡' },
];
