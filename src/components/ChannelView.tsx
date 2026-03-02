import { useRef, useEffect, useMemo } from 'react'
import { usePlayerStore } from '../playerStore'
import styles from './ChannelView.module.css'

export function ChannelView() {
  const barsRef = useRef<(HTMLDivElement | null)[]>([])
  const animRef = useRef<number>(0)
  const analyser = usePlayerStore(s => s.analyser)
  const patternData = usePlayerStore(s => s.patternData)
  const currentPattern = usePlayerStore(s => s.pattern)
  const currentRow = usePlayerStore(s => s.row)

  const numCh = patternData?.numChannels || 0

  const activity = useMemo(() => {
    if (!patternData?.patterns?.length) return []
    const pat = patternData.patterns[currentPattern]
    if (!pat?.rows?.[currentRow]) return []
    return pat.rows[currentRow].map((chData: any[]) => {
      const note = chData[0]
      const inst = chData[1]
      const vol = chData[4]
      const hasNote = (typeof note === 'string' && note.trim() && note !== '...')
        || (typeof note === 'number' && note > 0)
      const hasInst = (typeof inst === 'string' && inst.trim() && inst !== '..')
        || (typeof inst === 'number' && inst > 0)
      const hasVol = (typeof vol === 'number' && vol > 0)
        || (typeof vol === 'string' && vol.trim() && vol !== '..')
      return { hasNote, hasInst, hasVol }
    })
  }, [patternData, currentPattern, currentRow])

  // Animate bars with frequency data via direct DOM updates
  useEffect(() => {
    if (!analyser || numCh === 0) return
    const freqData = new Uint8Array(analyser.frequencyBinCount)

    const update = () => {
      analyser.getByteFrequencyData(freqData)
      for (let ch = 0; ch < numCh; ch++) {
        const bar = barsRef.current[ch]
        if (!bar) continue
        const freqIdx = Math.floor((ch / numCh) * freqData.length * 0.5)
        let level = freqData[freqIdx] / 255
        if (activity[ch]?.hasNote) level = Math.max(level, 0.7)
        bar.style.width = `${level * 100}%`
        bar.style.opacity = `${0.4 + level * 0.5}`
      }
      animRef.current = requestAnimationFrame(update)
    }
    animRef.current = requestAnimationFrame(update)
    return () => cancelAnimationFrame(animRef.current)
  }, [analyser, numCh, activity])

  // When no analyser, set bars from pattern activity only
  useEffect(() => {
    if (analyser) return
    for (let ch = 0; ch < numCh; ch++) {
      const bar = barsRef.current[ch]
      if (!bar) continue
      const hasNote = activity[ch]?.hasNote
      bar.style.width = hasNote ? '70%' : '0%'
      bar.style.opacity = hasNote ? '0.75' : '0.4'
    }
  }, [analyser, numCh, activity])

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <span className={styles.titleIcon}>≡</span><span className={styles.titleText}> CHANNELS</span>
        {patternData && <span className={styles.count}>{numCh}ch</span>}
      </div>
      <div className={styles.channels}>
        {numCh === 0 ? (
          <div className={styles.empty}>NO CHANNELS</div>
        ) : (
          Array.from({ length: numCh }, (_, ch) => {
            const hasNote = activity[ch]?.hasNote
            const hue = 180 + (ch / numCh) * 120
            return (
              <div key={ch} className={styles.channel}>
                <span className={`${styles.label} ${hasNote ? styles.labelActive : ''}`}>
                  {String(ch + 1).padStart(2, '0')}
                </span>
                <div className={styles.barBg}>
                  <div
                    ref={el => { barsRef.current[ch] = el }}
                    className={styles.bar}
                    style={{
                      '--bar-hue': hue,
                    } as React.CSSProperties}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
