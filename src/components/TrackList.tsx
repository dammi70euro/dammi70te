import type { DriveTrack } from '../hooks/useDriveTracks';

type TrackListProps = {
  tracks: DriveTrack[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  playingId: string | null;
  needsClickId: string | null;
  onPlay: (track: DriveTrack) => void;
  onShare: (track: DriveTrack) => void;
};

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.trim().toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <mark className="track-list__mark">{text.slice(index, index + query.trim().length)}</mark>
      {text.slice(index + query.trim().length)}
    </>
  );
}

export function TrackList({
  tracks,
  loading,
  error,
  searchQuery,
  playingId,
  needsClickId,
  onPlay,
  onShare,
}: TrackListProps) {
  if (loading) {
    return <p className="track-list__status">Caricamento tracce da Drive...</p>;
  }

  if (error) {
    return <p className="track-list__status track-list__status--error">{error}</p>;
  }

  if (tracks.length === 0) {
    return (
      <p className="track-list__status">
        {searchQuery ? 'Nessuna canzone corrisponde alla ricerca.' : 'Nessuna traccia trovata.'}
      </p>
    );
  }

  return (
    <ul className="track-list">
      {tracks.map((track) => {
        const isPlaying = playingId === track.id;
        const needsClick = needsClickId === track.id;

        return (
          <li
            key={track.id}
            className={`track-list__item${isPlaying ? ' track-list__item--playing' : ''}`}
            data-id={track.id}
          >
            <span className={`track-list__title${isPlaying ? ' track-list__title--active' : ''}`}>
              {highlightMatch(track.name, searchQuery)}
            </span>
            <div className="track-list__actions">
              <button
                type="button"
                className={`btn btn--play${needsClick ? ' btn--need-click' : ''}`}
                onClick={() => onPlay(track)}
              >
                {isPlaying ? '▶ ON' : 'Play'}
              </button>
              <button type="button" className="btn btn--share" onClick={() => onShare(track)}>
                Condividi
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
