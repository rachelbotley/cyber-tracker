import type { Track } from '../types';
import { getTracksByArtist } from '../tracks';

interface Props {
  tracks: Track[];
  currentTrack: Track | null;
  onSelect: (track: Track) => void;
}

export default function TrackList({ currentTrack, onSelect }: Props) {
  const byArtist = getTracksByArtist();

  return (
    <div className="p-3">
      <h2 className="text-xs font-bold text-neon-purple/70 tracking-widest mb-3 uppercase">
        ▸ Modules
      </h2>
      {Array.from(byArtist.entries()).map(([artist, artistTracks]) => (
        <div key={artist} className="mb-4">
          <div className="text-[10px] font-bold text-neon-cyan/50 tracking-widest uppercase mb-1 pl-1">
            {artist}
          </div>
          {artistTracks.map(track => {
            const active = currentTrack?.id === track.id;
            return (
              <button
                key={track.id}
                onClick={() => onSelect(track)}
                className={`w-full text-left px-2 py-1.5 rounded text-xs transition-all cursor-pointer block
                  ${active
                    ? 'bg-neon-purple/20 text-neon-cyan border-l-2 border-neon-cyan'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                  }`}
              >
                <div className="truncate">
                  {active && <span className="text-neon-green mr-1">▶</span>}
                  {track.title}
                </div>
                <div className="text-[9px] text-gray-600 truncate">{track.filename}</div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
