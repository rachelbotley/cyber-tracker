import { useCallback, useRef, useState } from 'react'
import { usePlayerStore } from '../playerStore'
import { SpeakerIcon } from './Icons'
import styles from './Controls.module.css'

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function Controls() {
  const isPlaying = usePlayerStore(s => s.isPlaying)
  const currentTime = usePlayerStore(s => s.currentTime)
  const duration = usePlayerStore(s => s.duration)
  const volume = usePlayerStore(s => s.volume)
  const order = usePlayerStore(s => s.order)
  const pattern = usePlayerStore(s => s.pattern)
  const row = usePlayerStore(s => s.row)
  const play = usePlayerStore(s => s.play)
  const pause = usePlayerStore(s => s.pause)
  const stop = usePlayerStore(s => s.stop)
  const seek = usePlayerStore(s => s.seek)
  const setVolume = usePlayerStore(s => s.setVolume)
  const prevTrack = usePlayerStore(s => s.prevTrack)
  const nextTrack = usePlayerStore(s => s.nextTrack)

  const [isSeeking, setIsSeeking] = useState(false)
  const [seekTime, setSeekTime] = useState(0)
  const seekBarRef = useRef<HTMLDivElement>(null)

  const clampedTime = duration > 0 ? Math.min(currentTime, duration) : currentTime
  const displayTime = isSeeking ? seekTime : clampedTime
  const progress = duration > 0 ? Math.min((displayTime / duration) * 100, 100) : 0

  const timeFromPointer = useCallback((clientX: number) => {
    const bar = seekBarRef.current
    if (!bar || duration <= 0) return 0
    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return ratio * duration
  }, [duration])

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (duration <= 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const t = timeFromPointer(e.clientX)
    setIsSeeking(true)
    setSeekTime(t)
  }, [duration, timeFromPointer])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSeeking) return
    setSeekTime(timeFromPointer(e.clientX))
  }, [isSeeking, timeFromPointer])

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSeeking) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    const t = timeFromPointer(e.clientX)
    seek(t)
    // Keep showing local position briefly until worklet responds
    setTimeout(() => setIsSeeking(false), 150)
  }, [isSeeking, timeFromPointer, seek])

  return (
    <div className={styles.controls}>
      <div className={styles.transport}>
        <button className={styles.btn} onClick={prevTrack} title="Previous">⏮</button>
        <button className={styles.btn} onClick={stop} title="Stop">⏹</button>
        {isPlaying ? (
          <button className={`${styles.btn} ${styles.primary}`} onClick={pause} title="Pause">⏸</button>
        ) : (
          <button className={`${styles.btn} ${styles.primary}`} onClick={play} title="Play">▶</button>
        )}
        <button className={styles.btn} onClick={nextTrack} title="Next">⏭</button>
      </div>

      <div className={styles.seekArea}>
        <span className={styles.time}>{formatTime(displayTime)}</span>
        <div
          ref={seekBarRef}
          className={`${styles.seekBar}${isSeeking ? ` ${styles.seeking}` : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className={styles.seekTrack} />
          <div className={styles.seekFill} style={{ width: `${progress}%` }} />
          <div className={styles.seekThumb} style={{ left: `${progress}%` }} />
        </div>
        <span className={styles.time}>{formatTime(duration)}</span>
      </div>

      <div className={styles.posInfo}>
        <span className={styles.posLabel}>ORD</span>
        <span className={styles.posValue}>{String(order).padStart(3, '0')}</span>
        <span className={styles.posLabel}>PAT</span>
        <span className={styles.posValue}>{String(pattern).padStart(3, '0')}</span>
        <span className={styles.posLabel}>ROW</span>
        <span className={styles.posValue}>{String(row).padStart(3, '0')}</span>
      </div>

      <div className={styles.volume}>
        <SpeakerIcon className={styles.volIcon} />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={e => setVolume(parseFloat(e.target.value))}
          className={styles.volInput}
        />
      </div>
    </div>
  )
}
