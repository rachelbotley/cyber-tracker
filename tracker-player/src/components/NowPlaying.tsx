import type { Track, ModuleMeta, ProgressData, PlayState } from '../types';

interface Props {
  track: Track | null;
  meta: ModuleMeta | null;
  progress: ProgressData;
  playState: PlayState;
  volume: number;
  onPlayPause: () => void;
  onStop: () => void;
  onVolumeChange: (v: number) => void;
  onSeek: (s: number) => void;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function NowPlaying({
  track, meta, progress, playState, volume,
  onPlayPause, onStop, onVolumeChange, onSeek,
}: Props) {
  const duration = meta?.dur ?? 0;
  const pct = duration > 0 ? (progress.pos / duration) * 100 : 0;

  return (
    <div className="flex-shrink-0 border-t border-dark-border bg-dark-surface px-4 py-2 flex items-center gap-4">
      {/* Transport controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPlayPause}
          className="w-8 h-8 flex items-center justify-center rounded bg-neon-purple/20 hover:bg-neon-purple/40 text-neon-cyan transition cursor-pointer"
          title={playState === 'playing' ? 'Pause' : 'Play'}
        >
          {playState === 'playing' ? '⏸' : '▶'}
        </button>
        <button
          onClick={onStop}
          className="w-8 h-8 flex items-center justify-center rounded bg-neon-purple/20 hover:bg-neon-purple/40 text-neon-pink transition cursor-pointer"
          title="Stop"
        >
          ⏹
        </button>
      </div>

      {/* Track info */}
      <div className="w-48 flex-shrink-0">
        {track ? (
          <>
            <div className="text-xs text-neon-cyan truncate font-bold">{meta?.title || track.title}</div>
            <div className="text-[10px] text-neon-purple/60">{track.artist}</div>
          </>
        ) : (
          <div className="text-xs text-gray-600">No track loaded</div>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex-1 flex items-center gap-2">
        <span className="text-[10px] text-gray-500 w-10 text-right">{formatTime(progress.pos)}</span>
        <div
          className="flex-1 h-1.5 bg-dark-border rounded cursor-pointer group relative"
          onClick={(e) => {
            if (!duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            onSeek(x * duration);
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-neon-purple to-neon-cyan rounded transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] text-gray-500 w-10">{formatTime(duration)}</span>
      </div>

      {/* Position info */}
      <div className="text-[10px] text-gray-500 w-32 text-center font-mono">
        Ord:{String(progress.order).padStart(3,'0')} Pat:{String(progress.pattern).padStart(3,'0')} Row:{String(progress.row).padStart(3,'0')}
      </div>

      {/* Volume */}
      <div className="flex items-center gap-1 w-28">
        <span className="text-[10px] text-neon-purple/50">🔊</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="flex-1 h-1 accent-neon-purple cursor-pointer"
        />
      </div>

      {/* Module type badge */}
      {meta?.type_long && (
        <div className="text-[9px] text-neon-green/50 border border-neon-green/20 px-1.5 py-0.5 rounded">
          {meta.type_long}
        </div>
      )}
    </div>
  );
}
