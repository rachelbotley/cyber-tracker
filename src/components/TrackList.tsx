import { usePlayerStore } from '../playerStore'
import { tracks, Track } from '../tracks'
import styles from './TrackList.module.css'

export function TrackList() {
  const currentTrack = usePlayerStore(s => s.currentTrack)
  const isPlaying = usePlayerStore(s => s.isPlaying)
  const loadTrack = usePlayerStore(s => s.loadTrack)

  // Group by artist
  const byArtist = tracks.reduce<Record<string, Track[]>>((acc, t) => {
    ;(acc[t.artist] ||= []).push(t)
    return acc
  }, {})

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <span className={styles.titleIcon}>♫</span> TRACKLIST
      </div>
      {Object.entries(byArtist).map(([artist, artistTracks]) => (
        <div key={artist} className={styles.group}>
          <div className={styles.artist}>{artist}</div>
          {artistTracks.map(track => {
            const active = currentTrack?.id === track.id
            return (
              <div
                key={track.id}
                className={`${styles.track} ${active ? styles.active : ''}`}
                onClick={() => loadTrack(track)}
              >
                <span className={styles.indicator}>
                  {active && isPlaying ? '▶' : active ? '■' : '·'}
                </span>
                <span className={styles.trackTitle}>{track.title}</span>
                <span className={styles.format}>{track.format}</span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
