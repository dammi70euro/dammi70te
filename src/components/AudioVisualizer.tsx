import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

type AudioVisualizerProps = {
  analyserRef: RefObject<AnalyserNode | null>;
  isPlaying: boolean;
  trackName?: string;
};

const MIN_W = 200;
const MIN_H = 140;
const DEFAULT_W = 300;
const DEFAULT_H = 200;

export function AudioVisualizer({ analyserRef, isPlaying, trackName }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const [dismissed, setDismissed] = useState(false);
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });
  const [pos, setPos] = useState(() => ({
    x: 24,
    y: Math.max(24, (typeof window !== 'undefined' ? window.innerHeight : 800) - DEFAULT_H - 90),
  }));
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);

  useEffect(() => {
    if (isPlaying) setDismissed(false);
  }, [isPlaying]);

  const visible = !dismissed && isPlaying;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) {
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
      dataRef.current = new Uint8Array(analyser.frequencyBinCount);
    }
    const data = dataRef.current;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    analyser.getByteFrequencyData(data);

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const time = performance.now() * 0.003;
    const rawEnergy = data.reduce((a, b) => a + b, 0) / (data.length * 255);
    const energy = rawEnergy > 0.02 ? rawEnergy : 0.25 + Math.sin(time * 2) * 0.12;

    const barCount = 48;
    const step = Math.max(1, Math.floor(data.length / barCount));
    const gap = 2;
    const barW = (width - gap * (barCount - 1)) / barCount;

    for (let i = 0; i < barCount; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) {
        sum += data[i * step + j];
      }
      const avg = sum / step / 255;
      const wave = (Math.sin(time * 3 + i * 0.35) + 1) * 0.5;
      const level = Math.max(avg, rawEnergy > 0.02 ? 0 : energy * wave * 0.55);
      const barH = Math.max(6, level * height * 0.9);

      const x = i * (barW + gap);
      const y = height - barH;

      const grad = ctx.createLinearGradient(0, height, 0, y);
      grad.addColorStop(0, 'rgba(0, 229, 255, 0.95)');
      grad.addColorStop(0.55, 'rgba(245, 166, 35, 0.9)');
      grad.addColorStop(1, 'rgba(255, 213, 79, 1)');

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barW, barH);

      if (level > 0.35) {
        ctx.shadowBlur = 14;
        ctx.shadowColor = 'rgba(0, 229, 255, 0.65)';
        ctx.fillRect(x, y, barW, 3);
        ctx.shadowBlur = 0;
      }
    }

    const cx = width / 2;
    const cy = height * 0.38;
    const baseR = Math.min(width, height) * 0.14;
    const pulse = Math.max(
      data.slice(0, 12).reduce((a, b) => a + b, 0) / (12 * 255),
      rawEnergy > 0.02 ? 0 : energy,
    );
    const r = baseR + pulse * baseR * 2;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 229, 255, ${0.3 + pulse * 0.55})`;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.5 + Math.sin(time * 4) * 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(245, 166, 35, ${0.2 + pulse * 0.4})`;
    ctx.fill();

    rafRef.current = requestAnimationFrame(draw);
  }, [analyserRef]);

  useEffect(() => {
    if (!visible) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [visible, draw, size]);

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

  if (!visible) return null;

  const canvasH = size.h - 36;

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
        <span className="audio-viz__title" title={trackName}>
          {trackName ?? 'Audio'}
        </span>
        <div className="audio-viz__controls">
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
