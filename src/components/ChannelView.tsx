import { useRef, useEffect, useCallback } from 'react'
import { usePlayerStore } from '../playerStore'
import styles from './ChannelView.module.css'

export function ChannelView() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const analyser = usePlayerStore(s => s.analyser)
  const patternData = usePlayerStore(s => s.patternData)
  const currentPattern = usePlayerStore(s => s.pattern)
  const currentRow = usePlayerStore(s => s.row)
  const metadata = usePlayerStore(s => s.metadata)

  // Track channel activity from pattern data
  const getChannelActivity = useCallback(() => {
    if (!patternData?.patterns?.length) return []
    const pat = patternData.patterns[currentPattern]
    if (!pat?.rows?.[currentRow]) return []
    const rowData = pat.rows[currentRow]
    return rowData.map((chData: any[]) => {
      // Check if channel has any activity
      const note = chData[0]
      const inst = chData[1]
      const vol = chData[4]
      const hasNote = (typeof note === 'string' && note.trim() && note !== '...')
        || (typeof note === 'number' && note > 0)
      const hasInst = (typeof inst === 'string' && inst.trim() && inst !== '..')
        || (typeof inst === 'number' && inst > 0)
      const hasVol = (typeof vol === 'number' && vol > 0)
        || (typeof vol === 'string' && vol.trim() && vol !== '..')
      return { hasNote, hasInst, hasVol, note, inst, vol }
    })
  }, [patternData, currentPattern, currentRow])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.parentElement!.getBoundingClientRect()
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width
      canvas.height = rect.height
    }

    const W = canvas.width
    const H = canvas.height

    ctx.fillStyle = '#0a0a0f'
    ctx.fillRect(0, 0, W, H)

    const numCh = patternData?.numChannels || 0
    if (numCh === 0) {
      ctx.fillStyle = '#555577'
      ctx.font = '12px "JetBrains Mono", monospace'
      ctx.textAlign = 'center'
      ctx.fillText('NO CHANNELS', W / 2, H / 2)
      animRef.current = requestAnimationFrame(draw)
      return
    }

    const activity = getChannelActivity()
    const barHeight = Math.max(12, Math.min(24, (H - 20) / numCh - 2))
    const totalHeight = numCh * (barHeight + 2)
    const offsetY = Math.max(10, (H - totalHeight) / 2)

    // Get frequency data for extra visualization
    let freqData: Uint8Array | null = null
    if (analyser) {
      freqData = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(freqData)
    }

    for (let ch = 0; ch < numCh; ch++) {
      const y = offsetY + ch * (barHeight + 2)
      const chActivity = activity[ch]
      const hasNote = chActivity?.hasNote

      // Channel label
      ctx.fillStyle = hasNote ? '#00ffff' : '#444466'
      ctx.font = '9px "JetBrains Mono", monospace'
      ctx.textAlign = 'right'
      ctx.fillText(String(ch + 1).padStart(2, '0'), 18, y + barHeight * 0.75)

      // Background bar
      ctx.fillStyle = 'rgba(26, 26, 46, 0.5)'
      ctx.fillRect(24, y, W - 30, barHeight)

      // Activity bar
      if (hasNote || (freqData && ch < freqData.length)) {
        // Use frequency data mapped to channels for width
        let level = 0
        if (freqData) {
          const freqIdx = Math.floor((ch / numCh) * freqData.length * 0.5)
          level = freqData[freqIdx] / 255
        }
        if (hasNote) level = Math.max(level, 0.7)

        const barW = (W - 30) * level
        const hue = 180 + (ch / numCh) * 120
        ctx.fillStyle = `hsla(${hue}, 80%, ${40 + level * 30}%, ${0.4 + level * 0.5})`
        ctx.fillRect(24, y, barW, barHeight)

        // Bright edge
        if (level > 0.3) {
          ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${level * 0.6})`
          ctx.fillRect(24 + barW - 2, y, 2, barHeight)
        }
      }

      // Border
      ctx.strokeStyle = 'rgba(42, 42, 74, 0.4)'
      ctx.strokeRect(24, y, W - 30, barHeight)
    }

    animRef.current = requestAnimationFrame(draw)
  }, [analyser, patternData, currentPattern, currentRow, getChannelActivity])

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw])

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <span className={styles.titleIcon}>≡</span> CHANNELS
        {patternData && <span className={styles.count}>{patternData.numChannels}ch</span>}
      </div>
      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
    </div>
  )
}
