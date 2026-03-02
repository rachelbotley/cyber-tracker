import { usePlayerStore } from '../playerStore'
import styles from './Controls.module.css'

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function Controls() {
  const isPlaying = usePlayerStore(s => s.isPlaying)
  const isPaused = usePlayerStore(s => s.isPaused)
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

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

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
        <span className={styles.time}>{formatTime(currentTime)}</span>
        <div className={styles.seekBar}>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={currentTime}
            onChange={e => seek(parseFloat(e.target.value))}
            className={styles.seekInput}
          />
          <div className={styles.seekFill} style={{ width: `${progress}%` }} />
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
        <span className={styles.volIcon}>🔊</span>
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
