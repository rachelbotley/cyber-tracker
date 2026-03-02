import { useRef, useEffect, useCallback } from 'react';
import type { ModuleMeta, ProgressData, PlayState } from '../types';
import { getAnalyser } from '../player';

interface Props {
  meta: ModuleMeta | null;
  progress: ProgressData;
  playState: PlayState;
}

export default function ChannelMeters({ meta }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const peaksRef = useRef<number[]>([]);
  const decayRef = useRef<number[]>([]);

  const numChannels = meta?.song?.channels?.length ?? 0;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = getAnalyser();
    if (!canvas) {
      animRef.current = requestAnimationFrame(draw);
      return;
    }

    const ctx = canvas.getContext('2d')!;
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const dw = canvas.offsetWidth;
    const dh = canvas.offsetHeight;

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, dw, dh);

    if (!numChannels || !analyser) {
      ctx.fillStyle = 'rgba(179, 71, 217, 0.3)';
      ctx.font = '9px monospace';
      ctx.fillText('CHANNEL METERS', 4, 10);
      ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
      ctx.fillText('No module loaded', 4, 25);
      animRef.current = requestAnimationFrame(draw);
      return;
    }

    // Since chiptune3 doesn't expose per-channel VU in the progress messages,
    // we simulate channel activity from FFT data spread across channels
    const freqData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freqData);

    const displayCh = Math.min(numChannels, 16);
    const barH = Math.max(4, (dh - 20) / displayCh - 2);
    const maxBarW = dw - 40;

    // Init peaks/decay arrays
    while (peaksRef.current.length < displayCh) {
      peaksRef.current.push(0);
      decayRef.current.push(0);
    }

    ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.font = '9px monospace';
    ctx.fillText('CHANNEL METERS', 4, 10);

    for (let i = 0; i < displayCh; i++) {
      const y = 16 + i * (barH + 2);

      // Sample a slice of frequency data for this channel
      const startBin = Math.floor((i / displayCh) * freqData.length * 0.5);
      const endBin = Math.floor(((i + 1) / displayCh) * freqData.length * 0.5);
      let sum = 0;
      for (let b = startBin; b < endBin; b++) sum += freqData[b];
      const avg = sum / Math.max(1, endBin - startBin) / 255;

      // Smooth with decay
      decayRef.current[i] = Math.max(avg, decayRef.current[i] * 0.92);
      const level = decayRef.current[i];

      // Update peak
      if (level > peaksRef.current[i]) peaksRef.current[i] = level;
      else peaksRef.current[i] *= 0.995;

      // Channel label
      ctx.fillStyle = 'rgba(179, 71, 217, 0.5)';
      ctx.font = '8px monospace';
      ctx.fillText(`${(i + 1).toString().padStart(2, '0')}`, 2, y + barH - 1);

      // Background
      ctx.fillStyle = 'rgba(42, 42, 62, 0.5)';
      ctx.fillRect(18, y, maxBarW, barH);

      // Level bar with gradient
      if (level > 0) {
        const grad = ctx.createLinearGradient(18, 0, 18 + maxBarW, 0);
        grad.addColorStop(0, '#39ff14');
        grad.addColorStop(0.6, '#00f0ff');
        grad.addColorStop(0.85, '#b347d9');
        grad.addColorStop(1, '#ff2d95');
        ctx.fillStyle = grad;
        ctx.fillRect(18, y, level * maxBarW, barH);
      }

      // Peak indicator
      const peakX = 18 + peaksRef.current[i] * maxBarW;
      ctx.fillStyle = '#ff2d95';
      ctx.fillRect(peakX - 1, y, 2, barH);
    }

    animRef.current = requestAnimationFrame(draw);
  }, [numChannels]);

  useEffect(() => {
    peaksRef.current = [];
    decayRef.current = [];
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <div className="h-full w-full">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
