type SongSearchProps = {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
  totalCount: number;
};

export function SongSearch({ value, onChange, resultCount, totalCount }: SongSearchProps) {
  return (
    <div className="song-search">
      <label className="song-search__label" htmlFor="song-search-input">
        Cerca canzoni
      </label>
      <div className="song-search__row">
        <span className="song-search__icon" aria-hidden="true">
          ⌕
        </span>
        <input
          id="song-search-input"
          type="search"
          className="song-search__input"
          placeholder="Titolo, artista, parola chiave..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        {value && (
          <button
            type="button"
            className="song-search__clear"
            onClick={() => onChange('')}
            aria-label="Cancella ricerca"
          >
            ✕
          </button>
        )}
      </div>
      <p className="song-search__meta">
        {value
          ? `${resultCount} di ${totalCount} tracce`
          : `${totalCount} tracce disponibili`}
      </p>
    </div>
  );
}
