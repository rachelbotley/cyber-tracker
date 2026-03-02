import { useRef, useEffect, useMemo } from 'react';
import type { ModuleMeta, ProgressData } from '../types';

interface Props {
  meta: ModuleMeta | null;
  progress: ProgressData;
}

function formatCommand(note: number, inst: number, volEff: number, eff: number, vol: number, param: number): string {
  const n = note ? String.fromCharCode(note) : '.';
  const i = inst ? String.fromCharCode(inst) : '.';
  const ve = volEff ? String.fromCharCode(volEff) : '.';
  const e = eff ? String.fromCharCode(eff) : '.';
  const v = vol ? String.fromCharCode(vol) : '.';
  const p = param ? String.fromCharCode(param) : '.';
  // Format: Note Inst VolCmd Effect
  return `${n}${i} ${ve}${v} ${e}${p}`;
}

export default function PatternViewer({ meta, progress }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentRowRef = useRef<HTMLDivElement>(null);

  // Get current pattern data
  const patternData = useMemo(() => {
    if (!meta?.song?.patterns) return null;
    const pat = meta.song.patterns[progress.pattern];
    return pat ?? null;
  }, [meta, progress.pattern]);

  const numChannels = meta?.song?.channels?.length ?? 4;
  const displayChannels = Math.min(numChannels, 8); // Show max 8 channels for readability

  // Auto-scroll to current row
  useEffect(() => {
    if (currentRowRef.current) {
      currentRowRef.current.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
  }, [progress.row, progress.pattern]);

  if (!meta || !patternData) {
    return (
      <div className="h-full flex items-center justify-center text-gray-600">
        <div className="text-center">
          <div className="text-4xl mb-2 opacity-20">⟨⟩</div>
          <div className="text-xs tracking-widest">SELECT A MODULE TO VIEW PATTERN DATA</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Pattern header */}
      <div className="flex-shrink-0 px-3 py-1 border-b border-dark-border bg-dark-panel/50 flex items-center gap-4">
        <span className="text-[10px] text-neon-purple/60 tracking-widest">PATTERN {String(progress.pattern).padStart(3, '0')}</span>
        <span className="text-[10px] text-gray-600">{patternData.rows.length} rows × {numChannels} ch</span>
        {meta.title && <span className="text-[10px] text-neon-cyan/40 ml-auto">{meta.title}</span>}
      </div>

      {/* Channel headers */}
      <div className="flex-shrink-0 flex border-b border-dark-border bg-dark-panel/30">
        <div className="w-10 flex-shrink-0 text-[9px] text-gray-600 px-1 py-0.5 text-center border-r border-dark-border">
          ROW
        </div>
        {Array.from({ length: displayChannels }, (_, i) => (
          <div
            key={i}
            className="flex-1 min-w-0 text-[9px] text-neon-purple/40 px-1 py-0.5 text-center border-r border-dark-border/50 truncate"
          >
            CH{i + 1} {meta.song.channels[i] ? `(${meta.song.channels[i]})` : ''}
          </div>
        ))}
      </div>

      {/* Pattern rows */}
      <div ref={containerRef} className="flex-1 overflow-y-auto font-mono">
        {patternData.rows.map((row, rowIdx) => {
          const isCurrent = rowIdx === progress.row;
          return (
            <div
              key={rowIdx}
              ref={isCurrent ? currentRowRef : undefined}
              className={`flex text-[10px] leading-4 border-b border-dark-border/20
                ${isCurrent ? 'pattern-current-row bg-neon-cyan/8' : rowIdx % 4 === 0 ? 'bg-dark-panel/20' : ''}
                ${isCurrent ? 'text-white' : 'text-gray-500'}`}
            >
              {/* Row number */}
              <div className={`w-10 flex-shrink-0 text-right pr-1 border-r border-dark-border/30
                ${isCurrent ? 'text-neon-cyan font-bold' : rowIdx % 16 === 0 ? 'text-neon-purple/40' : 'text-gray-700'}`}>
                {String(rowIdx).padStart(3, '0')}
              </div>

              {/* Channel data */}
              {Array.from({ length: displayChannels }, (_, chIdx) => {
                const ch = row[chIdx] || [];
                const [note = 0, inst = 0, volEff = 0, eff = 0, vol = 0, param = 0] = ch;
                const hasData = note || inst || eff || vol || volEff || param;
                const cmdStr = formatCommand(note, inst, volEff, eff, vol, param);

                return (
                  <div
                    key={chIdx}
                    className={`flex-1 min-w-0 px-1 border-r border-dark-border/10 truncate whitespace-nowrap
                      ${isCurrent && hasData ? 'text-neon-green' : hasData ? 'text-gray-400' : ''}`}
                  >
                    {cmdStr}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
