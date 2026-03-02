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
