type ToolFrameProps = {
  title: string;
  src: string;
  onClose: () => void;
};

export function ToolFrame({ title, src, onClose }: ToolFrameProps) {
  return (
    <div className="tool-frame">
      <div className="tool-frame__header">
        <h3 className="tool-frame__title">{title}</h3>
        <button type="button" className="tool-frame__close" onClick={onClose} aria-label="Chiudi">
          ✕
        </button>
      </div>
      <iframe title={title} src={src} className="tool-frame__iframe" />
    </div>
  );
}
