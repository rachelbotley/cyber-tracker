import { useRef, useEffect, useState } from 'react'
import { usePlayerStore } from '../playerStore'
import styles from './PatternView.module.css'

const NOTE_NAMES = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-']
const ROW_HEIGHT = 16

function formatNote(note: any): [string, boolean] {
  if (typeof note === 'string' && note.trim() && note !== '...') {
    return [note.padEnd(3), true]
  }
  if (typeof note === 'number' && note > 0) {
    const n = note - 1
    return [`${NOTE_NAMES[n % 12]}${Math.floor(n / 12)}`, true]
  }
  return ['...', false]
}

function formatInst(inst: any): [string, boolean] {
  if (typeof inst === 'string' && inst.trim() && inst !== '..') {
    return [inst.padStart(2), true]
  }
  if (typeof inst === 'number' && inst > 0) {
    return [inst.toString(16).toUpperCase().padStart(2, '0'), true]
  }
  return ['..', false]
}

function formatVol(vol: any): [string, boolean] {
  if (typeof vol === 'string' && vol.trim() && vol !== '..') {
    return [vol.padStart(2), true]
  }
  if (typeof vol === 'number' && vol > 0) {
    return [vol.toString(16).toUpperCase().padStart(2, '0'), true]
  }
  return ['..', false]
}

function formatFx(fx: any, fxParam: any): [string, boolean] {
  if ((typeof fx === 'string' && fx.trim() && fx !== '.') ||
      (typeof fx === 'number' && fx > 0)) {
    const fxStr = typeof fx === 'number' ? fx.toString(16).toUpperCase() : fx
    const paramStr = typeof fxParam === 'number'
      ? fxParam.toString(16).toUpperCase().padStart(2, '0')
      : (fxParam || '00')
    return [fxStr + paramStr, true]
  }
  return ['...', false]
}

export function PatternView() {
  const gridRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)
  const patternData = usePlayerStore(s => s.patternData)
  const currentPattern = usePlayerStore(s => s.pattern)
  const currentRow = usePlayerStore(s => s.row)

  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setHeight(e.contentRect.height))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pat = patternData?.patterns?.[currentPattern]
  const numCh = patternData ? Math.min(patternData.numChannels, 8) : 0

  const visibleRows = Math.floor(height / ROW_HEIGHT)
  const startRow = pat ? Math.max(0, currentRow - Math.floor(visibleRows / 2)) : 0
  const endRow = pat ? Math.min(pat.rows.length, startRow + visibleRows + 1) : 0

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <span className={styles.titleIcon}>▦</span> PATTERN {String(currentPattern).padStart(3, '0')}
      </div>
      <div ref={gridRef} className={styles.grid}>
        {!pat?.rows ? (
          <div className={styles.empty}>NO PATTERN DATA</div>
        ) : (
          Array.from({ length: endRow - startRow }, (_, i) => {
            const r = startRow + i
            const isCurrent = r === currentRow
            const rowData = pat.rows[r]

            return (
              <div key={r} className={`${styles.row} ${isCurrent ? styles.rowCurrent : ''}`}>
                <span className={
                  isCurrent ? styles.rowNumCurrent
                  : r % 16 === 0 ? styles.rowNumBeat
                  : styles.rowNum
                }>
                  {r.toString(16).toUpperCase().padStart(2, '0')}
                </span>
                {rowData && Array.from({ length: numCh }, (_, ch) => {
                  const d = rowData[ch]
                  if (!d) return (
                    <span key={ch} className={styles.ch}>
                      <span className={`${styles.fNote} ${styles.dim}`}>...</span>
                      <span className={`${styles.fInst} ${styles.dim}`}>..</span>
                      <span className={`${styles.fVol} ${styles.dim}`}>..</span>
                      <span className={`${styles.fFx} ${styles.dim}`}>...</span>
                    </span>
                  )

                  const [noteText, noteActive] = formatNote(d[0])
                  const [instText, instActive] = formatInst(d[1])
                  const [volText, volActive] = formatVol(d[4])
                  const [fxText, fxActive] = formatFx(d[3], d[5])

                  return (
                    <span key={ch} className={styles.ch}>
                      <span className={`${styles.fNote} ${noteActive ? (isCurrent ? styles.noteCur : styles.note) : styles.dim}`}>{noteText}</span>
                      <span className={`${styles.fInst} ${instActive ? (isCurrent ? styles.instCur : styles.inst) : styles.dim}`}>{instText}</span>
                      <span className={`${styles.fVol} ${volActive ? (isCurrent ? styles.volCur : styles.vol) : styles.dim}`}>{volText}</span>
                      <span className={`${styles.fFx} ${fxActive ? (isCurrent ? styles.fxCur : styles.fx) : styles.dim}`}>{fxText}</span>
                    </span>
                  )
                })}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
