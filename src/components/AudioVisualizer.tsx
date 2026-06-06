import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useDriveVisualImages, type DriveVisualImage } from '../hooks/useDriveVisualImages';
import {
  drawAudioOverlay,
  drawStatusMessage,
  IMAGE_CHANGE_MS,
  loadDriveImage,
  pickRandomEffect,
  pickRandomImage,
  renderVisualEffect,
  type VisualEffect,
} from '../visual/effects';

type AudioVisualizerProps = {
  analyserRef: RefObject<AnalyserNode | null>;
  isPlaying: boolean;
  trackName?: string;
};

const MIN_W = 200;
const MIN_H = 140;
const DEFAULT_W = 320;
const DEFAULT_H = 220;

export function AudioVisualizer({ analyserRef, isPlaying, trackName }: AudioVisualizerProps) {
  const { images, loading, error } = useDriveVisualImages();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fadeRef = useRef(1);

  const [dismissed, setDismissed] = useState(false);
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });
  const [pos, setPos] = useState(() => ({
    x: 24,
    y: Math.max(24, (typeof window !== 'undefined' ? window.innerHeight : 800) - DEFAULT_H - 90),
  }));
  const [currentImage, setCurrentImage] = useState<DriveVisualImage | null>(null);
  const [effect, setEffect] = useState<VisualEffect>('duotone');
  const currentImageRef = useRef<DriveVisualImage | null>(null);
  const effectRef = useRef<VisualEffect>('duotone');

  useEffect(() => {
    currentImageRef.current = currentImage;
  }, [currentImage]);

  useEffect(() => {
    effectRef.current = effect;
  }, [effect]);

  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);

  useEffect(() => {
    if (isPlaying) setDismissed(false);
  }, [isPlaying]);

  const visible = !dismissed && isPlaying;

  const rotateVisual = useCallback(
    (excludeId?: string, excludeEffect?: VisualEffect) => {
      if (!images.length) return;
      const next = pickRandomImage(images, excludeId);
      setCurrentImage(next);
      setEffect(pickRandomEffect(excludeEffect));
      fadeRef.current = 0;
      void loadDriveImage(next.id).then((img) => {
        if (img) imageRef.current = img;
      });
    },
    [images],
  );

  useEffect(() => {
    if (!visible || !images.length) return;
    rotateVisual();
    const intervalId = window.setInterval(() => {
      rotateVisual(currentImageRef.current?.id, effectRef.current);
    }, IMAGE_CHANGE_MS);
    return () => window.clearInterval(intervalId);
  }, [visible, images, rotateVisual]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    if (loading) {
      drawStatusMessage(ctx, width, height, 'Caricamento\nPatrimonio_visivo…');
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    if (error || !images.length) {
      drawStatusMessage(
        ctx,
        width,
        height,
        error ?? 'Nessuna immagine\ndisponibile',
      );
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    const img = imageRef.current;
    if (!img) {
      drawStatusMessage(ctx, width, height, 'Preparazione\nimmagine…');
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    fadeRef.current = Math.min(1, fadeRef.current + 0.04);
    ctx.globalAlpha = fadeRef.current;

    const analyser = analyserRef.current;
    let energy = 0.35;
    if (analyser) {
      if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
        dataRef.current = new Uint8Array(analyser.frequencyBinCount);
      }
      const data = dataRef.current;
      analyser.getByteFrequencyData(data);
      energy = Math.max(0.15, data.reduce((a, b) => a + b, 0) / (data.length * 255));
      renderVisualEffect(ctx, effect, img, width, height, performance.now() * 0.003, energy);
      ctx.globalAlpha = 1;
      drawAudioOverlay(ctx, width, height, data, energy);
    } else {
      const time = performance.now() * 0.003;
      energy = 0.25 + Math.sin(time * 2) * 0.12;
      renderVisualEffect(ctx, effect, img, width, height, time, energy);
      ctx.globalAlpha = 1;
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [analyserRef, effect, error, images.length, loading]);

  useEffect(() => {
    if (!visible) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [visible, draw, size, currentImage]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragRef.current) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setPos({
          x: Math.max(0, dragRef.current.origX + dx),
          y: Math.max(0, dragRef.current.origY + dy),
        });
      }
      if (resizeRef.current) {
        const dx = e.clientX - resizeRef.current.startX;
        const dy = e.clientY - resizeRef.current.startY;
        const maxW = window.innerWidth - pos.x - 16;
        const maxH = window.innerHeight - pos.y - 16;
        setSize({
          w: Math.min(maxW, Math.max(MIN_W, resizeRef.current.origW + dx)),
          h: Math.min(maxH, Math.max(MIN_H, resizeRef.current.origH + dy)),
        });
      }
    };

    const onUp = () => {
      dragRef.current = null;
      resizeRef.current = null;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [pos.x, pos.y]);

  const onDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };
  };

  const onResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origW: size.w,
      origH: size.h,
    };
  };

  const enlarge = () => {
    setSize((s) => ({
      w: Math.min(window.innerWidth - pos.x - 16, Math.round(s.w * 1.35)),
      h: Math.min(window.innerHeight - pos.y - 16, Math.round(s.h * 1.35)),
    }));
  };

  const skipVisual = () => {
    rotateVisual(currentImage?.id, effect);
  };

  if (!visible) return null;

  const canvasH = size.h - 36;
  const headerTitle = currentImage?.name ?? trackName ?? 'Patrimonio_visivo';

  return (
    <div
      className="audio-viz"
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
    >
      <div
        className="audio-viz__header"
        onMouseDown={onDragStart}
        role="toolbar"
        aria-label="Controlli visualizer"
      >
        <span className="audio-viz__tag">VISUAL</span>
        <span className="audio-viz__title" title={headerTitle}>
          {headerTitle}
        </span>
        <div className="audio-viz__controls">
          <button type="button" className="audio-viz__btn" onClick={skipVisual} title="Prossima immagine">
            ↻
          </button>
          <button type="button" className="audio-viz__btn" onClick={enlarge} title="Ingrandisci">
            +
          </button>
          <button
            type="button"
            className="audio-viz__btn"
            onClick={() => setDismissed(true)}
            title="Chiudi"
            aria-label="Chiudi visualizer"
          >
            ✕
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} className="audio-viz__canvas" width={size.w} height={canvasH} />
      <div className="audio-viz__resize" onMouseDown={onResizeStart} aria-hidden="true" />
    </div>
  );
}
