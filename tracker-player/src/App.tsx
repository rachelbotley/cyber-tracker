import { useState, useCallback, useRef } from 'react';
import type { Track, ModuleMeta, ProgressData, PlayState } from './types';
import { tracks } from './tracks';
import { initPlayer, loadTrack, stop, togglePause, setVolume, seek } from './player';
import TrackList from './components/TrackList';
import NowPlaying from './components/NowPlaying';
import PatternViewer from './components/PatternViewer';
import Visualizer from './components/Visualizer';
import ChannelMeters from './components/ChannelMeters';

export default function App() {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playState, setPlayState] = useState<PlayState>('stopped');
  const [meta, setMeta] = useState<ModuleMeta | null>(null);
  const [progress, setProgress] = useState<ProgressData>({ pos: 0, order: 0, pattern: 0, row: 0 });
  const [volume, setVolumeState] = useState(0.7);
  const [initialized, setInitialized] = useState(false);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const ensurePlayer = useCallback(() => {
    if (initialized) return;
    initPlayer({
      onMetadata: (m) => setMeta(m),
      onProgress: (p) => setProgress(p),
      onEnded: () => {
        // Auto-advance to next track
        setPlayState('stopped');
        const idx = tracks.findIndex(t => t.id === currentTrackRef.current?.id);
        if (idx >= 0 && idx < tracks.length - 1) {
          handleSelect(tracks[idx + 1]);
        }
      },
      onError: (e) => console.error('Player error:', e),
      onInitialized: () => {},
    });
    setInitialized(true);
    setVolume(volume);
  }, [initialized, volume]);

  const currentTrackRef = useRef(currentTrack);
  currentTrackRef.current = currentTrack;

  const handleSelect = useCallback((track: Track) => {
    ensurePlayer();
    // Small delay to ensure player is initialized
    setTimeout(() => {
      setCurrentTrack(track);
      setMeta(null);
      setProgress({ pos: 0, order: 0, pattern: 0, row: 0 });
      loadTrack(track.url);
      setPlayState('playing');
    }, 100);
  }, [ensurePlayer]);

  const handlePlayPause = useCallback(() => {
    if (playState === 'stopped' && currentTrack) {
      loadTrack(currentTrack.url);
      setPlayState('playing');
    } else if (playState === 'playing') {
      togglePause();
      setPlayState('paused');
    } else if (playState === 'paused') {
      togglePause();
      setPlayState('playing');
    }
  }, [playState, currentTrack]);

  const handleStop = useCallback(() => {
    stop();
    setPlayState('stopped');
    setProgress({ pos: 0, order: 0, pattern: 0, row: 0 });
  }, []);

  const handleVolumeChange = useCallback((v: number) => {
    setVolumeState(v);
    setVolume(v);
  }, []);

  const handleSeek = useCallback((s: number) => {
    seek(s);
  }, []);

  return (
    <div className="scanlines h-full flex flex-col bg-dark-bg overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-dark-border px-4 py-2 flex items-center gap-4">
        <h1 className="glitch-text text-xl font-bold tracking-widest text-neon-cyan">
          ⟨ NEON TRACKER ⟩
        </h1>
        <span className="text-xs text-neon-purple/60 tracking-wide">
          DEMOSCENE MODULE PLAYER
        </span>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Track List */}
        <aside className="w-64 flex-shrink-0 border-r border-dark-border overflow-y-auto bg-dark-surface">
          <TrackList
            tracks={tracks}
            currentTrack={currentTrack}
            onSelect={handleSelect}
          />
        </aside>

        {/* Center - Pattern Viewer + Visualizations */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Visualizations row */}
          <div className="flex-shrink-0 h-40 flex border-b border-dark-border">
            <div className="flex-1 border-r border-dark-border">
              <Visualizer playState={playState} />
            </div>
            <div className="w-72 flex-shrink-0">
              <ChannelMeters meta={meta} progress={progress} playState={playState} />
            </div>
          </div>

          {/* Pattern Viewer */}
          <div className="flex-1 overflow-hidden">
            <PatternViewer meta={meta} progress={progress} />
          </div>
        </main>
      </div>

      {/* Now Playing Bar */}
      <NowPlaying
        track={currentTrack}
        meta={meta}
        progress={progress}
        playState={playState}
        volume={volume}
        onPlayPause={handlePlayPause}
        onStop={handleStop}
        onVolumeChange={handleVolumeChange}
        onSeek={handleSeek}
      />
    </div>
  );
}
