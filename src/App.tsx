import { useEffect } from 'react'
import { usePlayerStore } from './playerStore'
import { TrackList } from './components/TrackList'
import { Controls } from './components/Controls'
import { Visualizer } from './components/Visualizer'
import { PatternView } from './components/PatternView'
import { ChannelView } from './components/ChannelView'
import { Header } from './components/Header'
import styles from './App.module.css'

export default function App() {
  const init = usePlayerStore(s => s.init)

  useEffect(() => {
    init()
  }, [init])

  // Global keyboard shortcuts (ignored when an input is focused)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const { isPlaying, play, pause, nextTrack, prevTrack } = usePlayerStore.getState()
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          isPlaying ? pause() : play()
          break
        case 'ArrowRight':
          e.preventDefault()
          nextTrack()
          break
        case 'ArrowLeft':
          e.preventDefault()
          prevTrack()
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className={styles.app}>
      <Header />
      <div className={styles.main}>
        <div className={styles.sidebar}>
          <TrackList />
        </div>
        <div className={styles.content}>
          <div className={styles.vizRow}>
            <Visualizer />
          </div>
          <div className={styles.dataRow}>
            <PatternView />
            <ChannelView />
          </div>
        </div>
      </div>
      <Controls />
    </div>
  )
}
