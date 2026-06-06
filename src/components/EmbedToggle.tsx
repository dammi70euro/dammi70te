type EmbedToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function EmbedToggle({ checked, onChange }: EmbedToggleProps) {
  return (
    <div className="embed-toggle">
      <span className="embed-toggle__label">Modalità embed</span>
      <label className="embed-toggle__switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="embed-toggle__slider" />
      </label>
    </div>
  );
}
