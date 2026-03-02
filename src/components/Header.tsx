import { usePlayerStore } from '../playerStore'
import styles from './Header.module.css'

export function Header() {
  const track = usePlayerStore(s => s.currentTrack)
  const metadata = usePlayerStore(s => s.metadata)

  return (
    <div className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>▶</span>
        <span className={styles.logoText}>DEMOSCENE TRACKER</span>
      </div>
      {track && (
        <div className={styles.nowPlaying}>
          <span className={styles.label}>NOW PLAYING</span>
          <span className={styles.title}>{metadata?.title || track.title}</span>
          <span className={styles.artist}>by {track.artist}</span>
        </div>
      )}
      <div className={styles.info}>
        {metadata && (
          <span className={styles.libVersion}>libopenmpt {metadata.libopenmptVersion}</span>
        )}
      </div>
    </div>
  )
}
