import { useRef, useEffect, useCallback } from 'react'
import { usePlayerStore } from '../playerStore'
import styles from './Visualizer.module.css'

export function Visualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const analyser = usePlayerStore(s => s.analyser)
  const isPlaying = usePlayerStore(s => s.isPlaying)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Resize canvas to container
    const rect = canvas.parentElement!.getBoundingClientRect()
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width
      canvas.height = rect.height
    }

    const W = canvas.width
    const H = canvas.height

    // Clear
    ctx.fillStyle = 'rgba(10, 10, 15, 0.85)'
    ctx.fillRect(0, 0, W, H)

    // Draw grid lines
    ctx.strokeStyle = 'rgba(42, 42, 74, 0.3)'
    ctx.lineWidth = 1
    for (let y = 0; y < H; y += 20) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
    }

    if (!analyser) {
      // Draw idle state
      ctx.fillStyle = 'rgba(85, 85, 119, 0.5)'
      ctx.font = '14px "Orbitron", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('SELECT A TRACK TO BEGIN', W / 2, H / 2)
      animRef.current = requestAnimationFrame(draw)
      return
    }

    // Frequency data
    const freqData = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(freqData)

    // Waveform data
    const waveData = new Uint8Array(analyser.fftSize)
    analyser.getByteTimeDomainData(waveData)

    // Draw spectrum bars
    const barCount = 128
    const barWidth = W / barCount
    const freqStep = Math.floor(freqData.length / barCount)

    for (let i = 0; i < barCount; i++) {
      const val = freqData[i * freqStep] / 255
      const barH = val * H * 0.8
      const x = i * barWidth

      // Gradient color based on frequency
      const hue = 180 + (i / barCount) * 120 // cyan -> magenta
      const sat = 80 + val * 20
      const light = 30 + val * 40

      // Bar
      ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, 0.7)`
      ctx.fillRect(x, H - barH, barWidth - 1, barH)

      // Glow top
      if (val > 0.3) {
        ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${val * 0.5})`
        ctx.fillRect(x, H - barH - 2, barWidth - 1, 3)
      }

      // Reflection
      ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, 0.1)`
      ctx.fillRect(x, H, barWidth - 1, -barH * 0.15)
    }

    // Draw waveform overlay
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)'
    ctx.lineWidth = 1.5
    const sliceWidth = W / waveData.length
    for (let i = 0; i < waveData.length; i++) {
      const v = waveData[i] / 128.0
      const y = (v * H) / 2
      if (i === 0) ctx.moveTo(0, y)
      else ctx.lineTo(i * sliceWidth, y)
    }
    ctx.stroke()

    // Second waveform pass with glow
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.2)'
    ctx.lineWidth = 3
    for (let i = 0; i < waveData.length; i++) {
      const v = waveData[i] / 128.0
      const y = (v * H) / 2
      if (i === 0) ctx.moveTo(0, y)
      else ctx.lineTo(i * sliceWidth, y)
    }
    ctx.stroke()

    animRef.current = requestAnimationFrame(draw)
  }, [analyser])

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw])

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  )
}
