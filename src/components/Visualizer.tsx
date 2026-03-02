import { useRef, useEffect, useMemo } from 'react'
import { usePlayerStore } from '../playerStore'
import styles from './Visualizer.module.css'

const BAR_COUNT = 128

export function Visualizer() {
  const barsRef = useRef<(HTMLDivElement | null)[]>([])
  const waveCanvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const freqBuf = useRef<Uint8Array | null>(null)
  const waveBuf = useRef<Uint8Array | null>(null)
  const analyser = usePlayerStore(s => s.analyser)

  // Pre-allocate typed arrays when analyser changes
  useEffect(() => {
    if (!analyser) {
      freqBuf.current = null
      waveBuf.current = null
      // Reset bars when analyser disconnects
      for (let i = 0; i < BAR_COUNT; i++) {
        const bar = barsRef.current[i]
        if (bar) {
          bar.style.transform = 'scaleY(0)'
          bar.style.opacity = '0'
        }
      }
      return
    }
    freqBuf.current = new Uint8Array(analyser.frequencyBinCount)
    waveBuf.current = new Uint8Array(analyser.fftSize)
  }, [analyser])

  // Animation loop: update bars + waveform canvas
  useEffect(() => {
    if (!analyser) return
    const freqStep = Math.floor(analyser.frequencyBinCount / BAR_COUNT)
    let lastTime = 0

    const update = (time: number) => {
      // Throttle to ~30fps
      if (time - lastTime < 33) {
        animRef.current = requestAnimationFrame(update)
        return
      }
      lastTime = time

      const freq = freqBuf.current
      const wave = waveBuf.current
      if (!freq || !wave) {
        animRef.current = requestAnimationFrame(update)
        return
      }

      analyser.getByteFrequencyData(freq)
      analyser.getByteTimeDomainData(wave)

      // Update bar transforms
      for (let i = 0; i < BAR_COUNT; i++) {
        const bar = barsRef.current[i]
        if (!bar) continue
        const val = freq[i * freqStep] / 255
        bar.style.transform = `scaleY(${val})`
        bar.style.opacity = `${0.5 + val * 0.5}`
      }

      // Draw waveform on canvas overlay
      const canvas = waveCanvasRef.current
      if (canvas) {
        const rect = canvas.parentElement!.getBoundingClientRect()
        const dpr = window.devicePixelRatio || 1
        const w = rect.width
        const h = rect.height
        if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
          canvas.width = w * dpr
          canvas.height = h * dpr
          canvas.style.width = `${w}px`
          canvas.style.height = `${h}px`
        }
        const ctx = canvas.getContext('2d')!
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, w, h)

        // Downsample waveform to ~128 points
        const step = Math.floor(wave.length / BAR_COUNT)

        // Magenta glow pass (wider, behind)
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.2)'
        ctx.lineWidth = 3
        for (let i = 0; i < BAR_COUNT; i++) {
          const x = (i / BAR_COUNT) * w
          const y = (wave[i * step] / 128.0) * h / 2
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()

        // Cyan pass (sharp)
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)'
        ctx.lineWidth = 1.5
        for (let i = 0; i < BAR_COUNT; i++) {
          const x = (i / BAR_COUNT) * w
          const y = (wave[i * step] / 128.0) * h / 2
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }

      animRef.current = requestAnimationFrame(update)
    }

    animRef.current = requestAnimationFrame(update)
    return () => cancelAnimationFrame(animRef.current)
  }, [analyser])

  // Precompute bar styles (static per mount)
  const barStyles = useMemo(() =>
    Array.from({ length: BAR_COUNT }, (_, i) => {
      const hue = 180 + (i / BAR_COUNT) * 120
      return {
        '--bar-hue': `${hue}`,
        '--bar-sat': `${80 + 20}%`,
        '--bar-light': `${30 + 40}%`,
      } as React.CSSProperties
    }),
  [])

  return (
    <div className={styles.container}>
      <div className={styles.grid} />
      <div className={styles.bars}>
        {barStyles.map((style, i) => (
          <div
            key={i}
            ref={el => { barsRef.current[i] = el }}
            className={styles.bar}
            style={style}
          />
        ))}
      </div>
      <canvas ref={waveCanvasRef} className={styles.waveCanvas} />
      {!analyser && (
        <div className={styles.idle}>SELECT A TRACK TO BEGIN</div>
      )}
    </div>
  )
}
