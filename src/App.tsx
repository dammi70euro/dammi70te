import { useMemo, useState } from 'react';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useDriveTracks } from './hooks/useDriveTracks';
import { CategoryTabs } from './components/CategoryTabs';
import { EmbedToggle } from './components/EmbedToggle';
import { Header } from './components/Header';
import { SongSearch } from './components/SongSearch';
import { ToolFrame } from './components/ToolFrame';
import { ToolGrid } from './components/ToolGrid';
import { AudioVisualizer } from './components/AudioVisualizer';
import { TrackList } from './components/TrackList';
import type { CategoryId } from './data/tools';

export default function App() {
  const { tracks, loading, error } = useDriveTracks();
  const { audioRef, analyserRef, playingId, isPlaying, needsClickId, playTrack, shareTrack } =
    useAudioPlayer(tracks);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryId>('gaming');
  const [embedMode, setEmbedMode] = useState(() => {
    const saved = localStorage.getItem('embedMode');
    return saved !== null ? saved === 'true' : true;
  });
  const [embeddedTool, setEmbeddedTool] = useState<{ title: string; src: string } | null>(null);

  const filteredTracks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter((track) => track.name.toLowerCase().includes(q));
  }, [tracks, searchQuery]);

  const handleEmbedModeChange = (value: boolean) => {
    setEmbedMode(value);
    localStorage.setItem('embedMode', String(value));
    if (!value) setEmbeddedTool(null);
  };

  const openTool = (title: string, src: string) => {
    if (embedMode) {
      setEmbeddedTool({ title, src });
    } else {
      window.location.href = src;
    }
  };

  return (
    <div className="app">
      <div className="app__overlay" aria-hidden="true" />
      <div className="app__grid" aria-hidden="true" />

      <Header />

      <main className="app__main">
        <section className="panel panel--music">
          <div className="panel__header">
            <span className="panel__tag">AUDIO UNIT</span>
            <span className="panel__id">DM70-AU-01</span>
          </div>

          <SongSearch
            value={searchQuery}
            onChange={setSearchQuery}
            resultCount={filteredTracks.length}
            totalCount={tracks.length}
          />

          <div className="player-shell">
            <audio ref={audioRef} controls preload="none" className="player">
              Il tuo browser non supporta l&apos;elemento audio.
            </audio>
            <p className="player-hint">Spazio = play / pause</p>
          </div>

          <TrackList
            tracks={filteredTracks}
            loading={loading}
            error={error}
            searchQuery={searchQuery}
            playingId={playingId}
            needsClickId={needsClickId}
            onPlay={playTrack}
            onShare={shareTrack}
          />
        </section>

        <section className="panel panel--tools">
          <div className="panel__header">
            <span className="panel__tag">TOOL DECK</span>
            <span className="panel__id">DM70-TD-02</span>
          </div>

          <CategoryTabs active={activeCategory} onChange={setActiveCategory} />

          <ToolGrid
            categoryId={activeCategory}
            embedMode={embedMode}
            onOpenTool={openTool}
          />

          {embeddedTool && (
            <ToolFrame
              title={embeddedTool.title}
              src={embeddedTool.src}
              onClose={() => setEmbeddedTool(null)}
            />
          )}
        </section>
      </main>

      <EmbedToggle checked={embedMode} onChange={handleEmbedModeChange} />

      <AudioVisualizer
        analyserRef={analyserRef}
        isPlaying={isPlaying}
        trackName={tracks.find((t) => t.id === playingId)?.name}
      />
    </div>
  );
}
