import { useRef, useEffect, useCallback } from 'react';
import { getAnalyser } from '../player';
import type { PlayState } from '../types';

interface Props {
  playState: PlayState;
}

export default function Visualizer(_props: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = getAnalyser();
    if (!canvas || !analyser) {
      animRef.current = requestAnimationFrame(draw);
      return;
    }

    const ctx = canvas.getContext('2d')!;
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const dw = canvas.offsetWidth;
    const dh = canvas.offsetHeight;

    // Clear
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, dw, dh);

    const bufferLength = analyser.frequencyBinCount;

    // Draw FFT spectrum (top half)
    const freqData = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(freqData);

    const barCount = 64;
    const barWidth = dw / barCount;
    const halfH = dh / 2;

    for (let i = 0; i < barCount; i++) {
      // Sample from frequency data (log scale)
      const idx = Math.floor(Math.pow(i / barCount, 2) * bufferLength * 0.8);
      const val = freqData[idx] / 255;
      const barH = val * halfH * 0.9;

      // Gradient from purple to cyan
      const hue = 270 + (val * 90); // purple to cyan
      ctx.fillStyle = `hsla(${hue}, 100%, ${50 + val * 30}%, ${0.6 + val * 0.4})`;
      ctx.fillRect(i * barWidth + 1, halfH - barH, barWidth - 2, barH);

      // Reflection
      ctx.fillStyle = `hsla(${hue}, 100%, ${50 + val * 30}%, ${0.15})`;
      ctx.fillRect(i * barWidth + 1, halfH, barWidth - 2, barH * 0.3);
    }

    // Draw oscilloscope (bottom half)
    const timeData = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(timeData);

    ctx.beginPath();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 4;

    const sliceWidth = dw / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = timeData[i] / 128.0;
      const y = halfH + (v - 1) * halfH * 0.8;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center line
    ctx.strokeStyle = 'rgba(179, 71, 217, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, halfH);
    ctx.lineTo(dw, halfH);
    ctx.stroke();

    // Label
    ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.font = '9px monospace';
    ctx.fillText('FFT SPECTRUM', 4, 10);
    ctx.fillText('OSCILLOSCOPE', 4, halfH + 10);

    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <div className="h-full w-full relative">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
