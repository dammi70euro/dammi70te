import { driveMediaUrl } from '../config/drive';
import type { DriveVisualImage } from '../hooks/useDriveVisualImages';

const imageCache = new Map<string, HTMLImageElement>();

const SPOTLIGHT_COLORS: [number, number, number][] = [
  [255, 40, 90],
  [0, 210, 255],
  [170, 50, 255],
  [255, 210, 0],
  [0, 255, 130],
  [255, 80, 180],
];

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

function drawSpotlightBeam(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  targetX: number,
  targetY: number,
  spread: number,
  rgb: [number, number, number],
  intensity: number,
) {
  const dx = targetX - originX;
  const dy = targetY - originY;
  const len = Math.hypot(dx, dy) || 1;
  const nx = dx / len;
  const ny = dy / len;
  const px = -ny;
  const py = nx;
  const [r, g, b] = rgb;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(targetX + px * spread, targetY + py * spread);
  ctx.lineTo(targetX - px * spread, targetY - py * spread);
  ctx.closePath();
  ctx.clip();

  const grad = ctx.createRadialGradient(targetX, targetY, 0, targetX, targetY, spread * 1.15);
  grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${intensity})`);
  grad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${intensity * 0.55})`);
  grad.addColorStop(0.75, `rgba(${r}, ${g}, ${b}, ${intensity * 0.12})`);
  grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

  ctx.fillStyle = grad;
  ctx.fillRect(
    Math.min(originX, targetX) - spread,
    Math.min(originY, targetY) - spread,
    Math.abs(targetX - originX) + spread * 2,
    Math.abs(targetY - originY) + spread * 2,
  );
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const hot = ctx.createRadialGradient(targetX, targetY, 0, targetX, targetY, spread * 0.22);
  hot.addColorStop(0, `rgba(255, 255, 255, ${intensity * 0.85})`);
  hot.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${intensity * 0.45})`);
  hot.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = hot;
  ctx.beginPath();
  ctx.arc(targetX, targetY, spread * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function renderDiscoBase(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  time: number,
  energy: number,
) {
  const zoom = 1 + Math.sin(time * 0.7) * 0.035 * (0.4 + energy);
  const panX = Math.sin(time * 0.45) * width * 0.025;
  const panY = Math.cos(time * 0.38) * height * 0.018;

  ctx.filter = `saturate(${1.05 + energy * 0.35}) contrast(${1.08 + energy * 0.12}) brightness(0.72)`;
  drawCover(ctx, img, width, height, zoom, panX, panY);
  ctx.filter = 'none';

  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.15,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.75,
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, `rgba(0, 0, 0, ${0.55 - energy * 0.12})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

export function drawConcertSpotlights(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  energy: number,
  frequencyData?: Uint8Array<ArrayBuffer>,
) {
  const count = SPOTLIGHT_COLORS.length;
  const binStep = frequencyData
    ? Math.max(1, Math.floor(frequencyData.length / count))
    : 0;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  for (let i = 0; i < count; i++) {
    const phase = i * 1.047;
    const speed = 0.28 + i * 0.06;
    const rgb = SPOTLIGHT_COLORS[i];

    let bandLevel = 0.35;
    if (frequencyData && binStep > 0) {
      let sum = 0;
      const start = i * binStep;
      for (let j = 0; j < binStep; j++) sum += frequencyData[start + j] ?? 0;
      bandLevel = sum / binStep / 255;
    }

    const sweep = Math.sin(time * speed + phase);
    const sweep2 = Math.cos(time * speed * 0.65 + phase * 1.7);

    const originX = width * (0.12 + (i / (count - 1)) * 0.76 + sweep * 0.08);
    const originY = -height * 0.08;

    const targetX = width * (0.15 + (i / count) * 0.7 + sweep2 * 0.28);
    const targetY = height * (0.42 + Math.sin(time * 0.55 + phase * 2) * 0.18);

    const spread = width * (0.14 + bandLevel * 0.1 + energy * 0.06);
    const intensity =
      (0.22 + energy * 0.38 + bandLevel * 0.35) *
      (0.75 + Math.sin(time * 1.8 + phase) * 0.25);

    drawSpotlightBeam(ctx, originX, originY, targetX, targetY, spread, rgb, intensity);
  }

  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.06 + energy * 0.08;
  for (let i = 0; i < 18; i++) {
    const sx = (Math.sin(time * 0.9 + i * 2.1) * 0.5 + 0.5) * width;
    const sy = (Math.cos(time * 1.1 + i * 1.7) * 0.5 + 0.5) * height;
    const sparkle = ctx.createRadialGradient(sx, sy, 0, sx, sy, 3);
    sparkle.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    sparkle.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sparkle;
    ctx.fillRect(sx - 4, sy - 4, 8, 8);
  }
  ctx.restore();
}

export function drawDiscoAudioPulse(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  energy: number,
) {
  if (energy < 0.12) return;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const pulseH = height * 0.06 * energy;
  const grad = ctx.createLinearGradient(0, height - pulseH, 0, height);
  grad.addColorStop(0, 'rgba(255, 40, 120, 0)');
  grad.addColorStop(0.6, `rgba(0, 210, 255, ${energy * 0.18})`);
  grad.addColorStop(1, `rgba(255, 210, 0, ${energy * 0.28})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, height - pulseH, width, pulseH);
  ctx.restore();
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
