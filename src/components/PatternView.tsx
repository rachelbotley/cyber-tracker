import { useRef, useEffect, useCallback } from 'react'
import { usePlayerStore } from '../playerStore'
import styles from './PatternView.module.css'

const NOTE_NAMES = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-']

function formatNote(noteStr: string): string {
  if (!noteStr || noteStr === '...') return '...'
  return noteStr
}

function formatCommand(cmd: string): string {
  if (!cmd || cmd === '.') return '.'
  return cmd
}

export function PatternView() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const patternData = usePlayerStore(s => s.patternData)
  const currentPattern = usePlayerStore(s => s.pattern)
  const currentRow = usePlayerStore(s => s.row)
  const isPlaying = usePlayerStore(s => s.isPlaying)

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

    // Clear
    ctx.fillStyle = '#0a0a0f'
    ctx.fillRect(0, 0, W, H)

    if (!patternData || !patternData.patterns.length) {
      ctx.fillStyle = '#555577'
      ctx.font = '12px "JetBrains Mono", monospace'
      ctx.textAlign = 'center'
      ctx.fillText('NO PATTERN DATA', W / 2, H / 2)
      animRef.current = requestAnimationFrame(draw)
      return
    }

    const pat = patternData.patterns[currentPattern]
    if (!pat || !pat.rows) {
      animRef.current = requestAnimationFrame(draw)
      return
    }

    const ROW_HEIGHT = 16
    const CHAR_WIDTH = 7.5
    const numCh = Math.min(patternData.numChannels, 8) // Show max 8 channels
    const CH_WIDTH = Math.max(80, (W - 40) / numCh)

    ctx.font = '11px "JetBrains Mono", monospace'
    ctx.textAlign = 'left'

    // Center on current row
    const visibleRows = Math.floor(H / ROW_HEIGHT)
    const startRow = Math.max(0, currentRow - Math.floor(visibleRows / 2))
    const endRow = Math.min(pat.rows.length, startRow + visibleRows)

    for (let r = startRow; r < endRow; r++) {
      const y = (r - startRow) * ROW_HEIGHT + ROW_HEIGHT
      const isCurrentRow = r === currentRow
      const rowData = pat.rows[r]

      // Current row highlight
      if (isCurrentRow) {
        ctx.fillStyle = 'rgba(0, 255, 255, 0.08)'
        ctx.fillRect(0, y - ROW_HEIGHT + 3, W, ROW_HEIGHT)
        // Left indicator
        ctx.fillStyle = '#00ffff'
        ctx.fillRect(0, y - ROW_HEIGHT + 3, 2, ROW_HEIGHT)
      }

      // Row number
      const rowAlpha = isCurrentRow ? 1 : 0.4
      ctx.fillStyle = isCurrentRow ? '#00ffff' : (r % 16 === 0 ? '#8888aa' : '#444466')
      ctx.fillText(r.toString(16).toUpperCase().padStart(2, '0'), 6, y)

      // Channel data
      if (!rowData) continue
      for (let ch = 0; ch < numCh; ch++) {
        const chData = rowData[ch]
        if (!chData) continue
        const x = 30 + ch * CH_WIDTH

        // Separator line
        ctx.strokeStyle = 'rgba(42, 42, 74, 0.3)'
        ctx.beginPath()
        ctx.moveTo(x - 4, y - ROW_HEIGHT + 3)
        ctx.lineTo(x - 4, y + 3)
        ctx.stroke()

        // Note (chData[0] is the note command string from openmpt)
        const note = chData[0] || ''
        const inst = chData[1] || ''
        const vol = chData[4] || ''
        const fx = chData[3] || ''
        const fxParam = chData[5] || ''

        // Format: NOTE INST VOL FX
        let noteColor = '#555577'
        let noteText = '...'

        if (typeof note === 'string' && note.trim() && note !== '...') {
          noteText = note.padEnd(3)
          noteColor = isCurrentRow ? '#00ffff' : '#e0e0ff'
        } else if (typeof note === 'number' && note > 0) {
          const n = note - 1
          const octave = Math.floor(n / 12)
          const noteName = NOTE_NAMES[n % 12]
          noteText = `${noteName}${octave}`
          noteColor = isCurrentRow ? '#00ffff' : '#e0e0ff'
        }

        ctx.fillStyle = noteColor
        ctx.fillText(noteText, x, y)

        // Instrument
        let instText = '..'
        let instColor = '#555577'
        if (typeof inst === 'string' && inst.trim() && inst !== '..') {
          instText = inst.padStart(2)
          instColor = isCurrentRow ? '#ffff44' : '#aaaa44'
        } else if (typeof inst === 'number' && inst > 0) {
          instText = inst.toString(16).toUpperCase().padStart(2, '0')
          instColor = isCurrentRow ? '#ffff44' : '#aaaa44'
        }
        ctx.fillStyle = instColor
        ctx.fillText(instText, x + CHAR_WIDTH * 4, y)

        // Volume
        let volText = '..'
        let volColor = '#555577'
        if (typeof vol === 'string' && vol.trim() && vol !== '..') {
          volText = vol.padStart(2)
          volColor = isCurrentRow ? '#44ff88' : '#228844'
        } else if (typeof vol === 'number' && vol > 0) {
          volText = vol.toString(16).toUpperCase().padStart(2, '0')
          volColor = isCurrentRow ? '#44ff88' : '#228844'
        }
        ctx.fillStyle = volColor
        ctx.fillText(volText, x + CHAR_WIDTH * 7, y)

        // Effect
        let fxText = '...'
        let fxColor = '#555577'
        if ((typeof fx === 'string' && fx.trim() && fx !== '.') ||
            (typeof fx === 'number' && fx > 0)) {
          const fxStr = typeof fx === 'number' ? fx.toString(16).toUpperCase() : fx
          const paramStr = typeof fxParam === 'number'
            ? fxParam.toString(16).toUpperCase().padStart(2, '0')
            : (fxParam || '00')
          fxText = fxStr + paramStr
          fxColor = isCurrentRow ? '#ff44aa' : '#884466'
        }
        ctx.fillStyle = fxColor
        ctx.fillText(fxText, x + CHAR_WIDTH * 9.5, y)
      }
    }

    animRef.current = requestAnimationFrame(draw)
  }, [patternData, currentPattern, currentRow])

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw])

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <span className={styles.titleIcon}>▦</span> PATTERN {String(currentPattern).padStart(3, '0')}
      </div>
      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
    </div>
  )
}
