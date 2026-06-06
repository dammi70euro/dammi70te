import { useRef, useState } from 'react';
import { driveMediaUrl } from '../config/drive';
import { useVisuatronImages, type VisuatronImage } from '../hooks/useVisuatronImages';
import { VISUATRON_EFFECTS, type VisuatronEffect } from '../visual/visuatronEffects';
import { VisuatronProjector } from './VisuatronProjector';

const HOME = import.meta.env.BASE_URL;

export function VisuatronApp() {
  const { images, driveLoading, driveError, refetchDrive, addLocalFiles, removeLocal } =
    useVisuatronImages();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [effect, setEffect] = useState<VisuatronEffect>('disco');
  const [speed, setSpeed] = useState(1);
  const [projecting, setProjecting] = useState(false);

  const selected = images.find((img) => img.id === selectedId) ?? images[0] ?? null;

  const handleSelect = (img: VisuatronImage) => {
    setSelectedId(img.id);
  };

  const handleUpload = (files: FileList | null) => {
    if (!files?.length) return;
    const added = addLocalFiles(files);
    if (added.length) setSelectedId(added[added.length - 1].id);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div className="visuatron">
      <div className="visuatron__overlay" aria-hidden="true" />
      <div className="visuatron__grid" aria-hidden="true" />

      <header className="visuatron__header">
        <a href={HOME} className="visuatron__back">
          ← Hub
        </a>
        <div>
          <span className="visuatron__badge">SOFTWARE ARENA</span>
          <h1 className="visuatron__title">VISUATRON</h1>
          <p className="visuatron__sub">Patrimonio_visivo + upload · proiezione floating</p>
        </div>
      </header>

      <main className="visuatron__arena">
        <section className="visuatron__panel visuatron__panel--library">
          <div className="visuatron__panel-head">
            <span className="visuatron__panel-tag">LIBRARY</span>
            <span className="visuatron__panel-id">PV-01</span>
          </div>

          {driveLoading && <p className="visuatron__status">Caricamento Patrimonio_visivo…</p>}
          {driveError && (
            <p className="visuatron__status visuatron__status--error">
              {driveError}{' '}
              <button type="button" className="visuatron__link-btn" onClick={() => void refetchDrive()}>
                Riprova
              </button>
            </p>
          )}

          <div
            className="visuatron__dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            <span>+ Carica immagini</span>
            <span className="visuatron__dropzone-hint">click o trascina</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => handleUpload(e.target.files)}
          />

          <div className="visuatron__gallery">
            {images.map((img) => (
              <button
                key={img.id}
                type="button"
                className={`visuatron__thumb${selected?.id === img.id ? ' visuatron__thumb--active' : ''}`}
                onClick={() => handleSelect(img)}
                title={img.name}
              >
                <VisuatronThumb image={img} />
                <span className="visuatron__thumb-label">{img.name}</span>
                {img.source === 'local' && (
                  <span
                    className="visuatron__thumb-remove"
                    role="button"
                    tabIndex={0}
                    title="Rimuovi"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLocal(img.id);
                      if (selectedId === img.id) setSelectedId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation();
                        removeLocal(img.id);
                        if (selectedId === img.id) setSelectedId(null);
                      }
                    }}
                  >
                    ✕
                  </span>
                )}
                {img.source === 'drive' && <span className="visuatron__thumb-src">DRIVE</span>}
              </button>
            ))}
            {!driveLoading && !images.length && (
              <p className="visuatron__status">Nessuna immagine — carica o controlla Drive.</p>
            )}
          </div>
        </section>

        <section className="visuatron__panel visuatron__panel--controls">
          <div className="visuatron__panel-head">
            <span className="visuatron__panel-tag">MIXER</span>
            <span className="visuatron__panel-id">FX-02</span>
          </div>

          <div className="visuatron__effects">
            {VISUATRON_EFFECTS.map((fx) => (
              <button
                key={fx.id}
                type="button"
                className={`visuatron__fx${effect === fx.id ? ' visuatron__fx--active' : ''}`}
                onClick={() => setEffect(fx.id)}
              >
                <span className="visuatron__fx-icon">{fx.icon}</span>
                {fx.label}
              </button>
            ))}
          </div>

          <label className="visuatron__slider">
            <span>Velocità</span>
            <input
              type="range"
              min={0.3}
              max={2.5}
              step={0.1}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
            <span className="visuatron__slider-val">{speed.toFixed(1)}×</span>
          </label>

          <button
            type="button"
            className={`visuatron__project${projecting ? ' visuatron__project--live' : ''}`}
            disabled={!selected}
            onClick={() => setProjecting((v) => !v)}
          >
            {projecting ? '● PROIEZIONE ATTIVA' : '▶ PROIETTA'}
          </button>

          {selected && (
            <p className="visuatron__now-playing">
              In coda: <strong>{selected.name}</strong>
            </p>
          )}
        </section>
      </main>

      {projecting && (
        <VisuatronProjector
          image={selected}
          effect={effect}
          speed={speed}
          onClose={() => setProjecting(false)}
        />
      )}
    </div>
  );
}

function VisuatronThumb({ image }: { image: VisuatronImage }) {
  const src =
    image.source === 'local' && image.url ? image.url : driveMediaUrl(image.id);

  return <img src={src} alt="" className="visuatron__thumb-img" loading="lazy" />;
}
