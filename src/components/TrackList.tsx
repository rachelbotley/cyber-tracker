import { useState, useMemo, useRef, useEffect } from 'react'
import { usePlayerStore } from '../playerStore'
import type { Track } from '../tracks'
import { SearchIcon } from './Icons'
import { FolderPicker } from './FolderPicker'
import styles from './TrackList.module.css'

const FORMAT_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  MOD:  { color: 'hsl(30, 90%, 75%)',  bg: 'hsla(30, 60%, 50%, 0.12)',  border: 'hsla(30, 50%, 50%, 0.3)' },
  S3M:  { color: 'hsl(160, 90%, 75%)', bg: 'hsla(160, 60%, 50%, 0.12)', border: 'hsla(160, 50%, 50%, 0.3)' },
  XM:   { color: 'hsl(270, 90%, 75%)', bg: 'hsla(270, 60%, 50%, 0.12)', border: 'hsla(270, 50%, 50%, 0.3)' },
  IT:   { color: 'hsl(200, 90%, 75%)', bg: 'hsla(200, 60%, 50%, 0.12)', border: 'hsla(200, 50%, 50%, 0.3)' },
  MPTM: { color: 'hsl(330, 90%, 75%)', bg: 'hsla(330, 60%, 50%, 0.12)', border: 'hsla(330, 50%, 50%, 0.3)' },
  STM:  { color: 'hsl(50, 90%, 75%)',  bg: 'hsla(50, 60%, 50%, 0.12)',  border: 'hsla(50, 50%, 50%, 0.3)' },
  MED:  { color: 'hsl(120, 90%, 75%)', bg: 'hsla(120, 60%, 50%, 0.12)', border: 'hsla(120, 50%, 50%, 0.3)' },
}
const DEFAULT_FMT = { color: 'hsl(220, 90%, 75%)', bg: 'hsla(220, 60%, 50%, 0.12)', border: 'hsla(220, 50%, 50%, 0.3)' }

export function TrackList() {
  const tracks = usePlayerStore(s => s.tracks)
  const currentTrack = usePlayerStore(s => s.currentTrack)
  const isPlaying = usePlayerStore(s => s.isPlaying)
  const loadTrack = usePlayerStore(s => s.loadTrack)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus search on Ctrl+F / Cmd+F
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return tracks
    const terms = query.toLowerCase().split(/\s+/)
    return tracks.filter(t => {
      const hay = `${t.title} ${t.artist} ${t.format}`.toLowerCase()
      return terms.every(term => hay.includes(term))
    })
  }, [tracks, query])

  // Group by artist
  const byArtist = filtered.reduce<Record<string, Track[]>>((acc, t) => {
    ;(acc[t.artist] ||= []).push(t)
    return acc
  }, {})

  return (
    <div className={styles.container}>
      <FolderPicker />
      <div className={styles.searchWrap}>
        <SearchIcon className={styles.searchIcon} />
        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          placeholder="SEARCH..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          spellCheck={false}
        />
        {query && (
          <button className={styles.clearBtn} onClick={() => setQuery('')}>×</button>
        )}
      </div>
      <div className={styles.title}>
        <span className={styles.titleIcon}>♫</span> TRACKLIST
        <span className={styles.count}>
          {query ? `${filtered.length} / ${tracks.length}` : tracks.length}
        </span>
      </div>
      <div className={styles.list}>
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
                  <span
                    className={styles.format}
                    style={(() => {
                      const c = FORMAT_COLORS[track.format] ?? DEFAULT_FMT
                      return { color: c.color, background: c.bg, borderColor: c.border }
                    })()}
                  >{track.format}</span>
                </div>
              )
            })}
          </div>
        ))}
        {query && filtered.length === 0 && (
          <div className={styles.noResults}>NO MATCHES</div>
        )}
      </div>
    </div>
  )
}
