import { useCallback, useEffect, useRef, useState } from 'react';
import type { VisuatronImage } from '../hooks/useVisuatronImages';
import {
  loadVisuatronImage,
  renderVisuatronFrame,
  type VisuatronEffect,
} from '../visual/visuatronEffects';
import { drawStatusMessage } from '../visual/effects';

type VisuatronProjectorProps = {
  image: VisuatronImage | null;
  effect: VisuatronEffect;
  speed: number;
  onClose: () => void;
};

const MIN_W = 240;
const MIN_H = 160;
const DEFAULT_W = 480;
const DEFAULT_H = 320;

export function VisuatronProjector({ image, effect, speed, onClose }: VisuatronProjectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const loadingRef = useRef(false);

  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });
  const [pos, setPos] = useState(() => ({
    x: Math.max(24, (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2 - DEFAULT_W / 2),
    y: Math.max(24, (typeof window !== 'undefined' ? window.innerHeight : 800) / 2 - DEFAULT_H / 2),
  }));

  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);

  useEffect(() => {
    imageRef.current = null;
    if (!image) return;

    loadingRef.current = true;
    void loadVisuatronImage(image).then((img) => {
      imageRef.current = img;
      loadingRef.current = false;
    });
  }, [image]);

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

    const img = imageRef.current;
    if (!img) {
      drawStatusMessage(
        ctx,
        width,
        height,
        loadingRef.current ? 'Caricamento\nimmagine…' : 'Seleziona\nun\'immagine',
      );
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    const time = performance.now() * 0.003;
    renderVisuatronFrame(ctx, img, width, height, effect, time, speed);
    rafRef.current = requestAnimationFrame(draw);
  }, [effect, speed]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw, size, image]);

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

  const canvasH = size.h - 36;
  const headerTitle = image?.name ?? 'VISUATRON';

  return (
    <div
      className="audio-viz visuatron-projector"
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
    >
      <div
        className="audio-viz__header"
        onMouseDown={onDragStart}
        role="toolbar"
        aria-label="Controlli proiettore VISUATRON"
      >
        <span className="audio-viz__tag">PROIETTORE</span>
        <span className="audio-viz__title" title={headerTitle}>
          {headerTitle}
        </span>
        <div className="audio-viz__controls">
          <button type="button" className="audio-viz__btn" onClick={enlarge} title="Ingrandisci">
            +
          </button>
          <button
            type="button"
            className="audio-viz__btn"
            onClick={onClose}
            title="Chiudi proiettore"
            aria-label="Chiudi proiettore"
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
