import { create } from 'zustand'
import { fetchTracks } from './tracks'
import type { Track } from './tracks'

// We'll use chiptune3 dynamically
let playerInstance: any = null

// rAF-based progress throttle (~60 updates/sec instead of ~375)
let latestProgress: { pos: number; order: number; pattern: number; row: number } | null = null
let progressRafId: number | null = null
// Guard against the chiptune3 worklet firing onEnded repeatedly
// (process() returns true after end, so it keeps firing every ~3ms)
let isTransitioning = false

export interface PatternData {
  patterns: any[]
  channels: string[]
  numChannels: number
}

export interface PlayerState {
  // State
  tracks: Track[]
  currentTrack: Track | null
  isPlaying: boolean
  isPaused: boolean
  currentTime: number
  duration: number
  volume: number
  order: number
  pattern: number
  row: number
  metadata: any
  patternData: PatternData | null
  analyser: AnalyserNode | null
  isInitialized: boolean

  // Actions
  init: () => Promise<void>
  loadTrack: (track: Track) => void
  play: () => void
  pause: () => void
  stop: () => void
  seek: (time: number) => void
  setVolume: (vol: number) => void
  nextTrack: () => void
  prevTrack: () => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  tracks: [],
  currentTrack: null,
  isPlaying: false,
  isPaused: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  order: 0,
  pattern: 0,
  row: 0,
  metadata: null,
  patternData: null,
  analyser: null,
  isInitialized: false,

  init: async () => {
    if (playerInstance) return

    // Load track list from server
    const tracks = await fetchTracks()
    set({ tracks })

    const { ChiptuneJsPlayer } = await import('chiptune3')
    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.8

    playerInstance = new ChiptuneJsPlayer({ context: ctx, repeatCount: 0 })
    // Connect player gain -> analyser -> destination
    // We need to wait for initialization
    playerInstance.onInitialized(() => {
      playerInstance.gain.disconnect()
      playerInstance.gain.connect(analyser)
      analyser.connect(ctx.destination)
      set({ analyser, isInitialized: true })
    })

    playerInstance.onMetadata((meta: any) => {
      const patternData: PatternData | null = meta?.song ? {
        patterns: meta.song.patterns,
        channels: meta.song.channels,
        numChannels: meta.song.channels.length,
      } : null
      set({
        duration: meta?.dur || 0,
        metadata: meta,
        patternData,
      })
    })

    playerInstance.onProgress((data: any) => {
      isTransitioning = false
      latestProgress = { pos: data.pos, order: data.order, pattern: data.pattern, row: data.row }
      if (progressRafId === null) {
        progressRafId = requestAnimationFrame(() => {
          progressRafId = null
          if (latestProgress) {
            set({
              currentTime: latestProgress.pos,
              order: latestProgress.order,
              pattern: latestProgress.pattern,
              row: latestProgress.row,
            })
          }
        })
      }
    })

    playerInstance.onEnded(() => {
      if (isTransitioning) return
      isTransitioning = true
      get().nextTrack()
    })

    playerInstance.setVol(get().volume)
  },

  loadTrack: (track: Track) => {
    if (!playerInstance) return
    // Resume audio context if suspended
    if (playerInstance.context.state === 'suspended') {
      playerInstance.context.resume()
    }
    playerInstance.load(`/music/${track.file}`)
    set({
      currentTrack: track,
      isPlaying: true,
      isPaused: false,
      currentTime: 0,
    })
  },

  play: () => {
    if (!playerInstance) return
    const state = get()
    if (state.isPaused) {
      playerInstance.unpause()
      if (playerInstance.context.state === 'suspended') {
        playerInstance.context.resume()
      }
      set({ isPaused: false, isPlaying: true })
    } else if (state.currentTrack) {
      get().loadTrack(state.currentTrack)
    }
  },

  pause: () => {
    if (!playerInstance) return
    playerInstance.pause()
    set({ isPaused: true, isPlaying: false })
  },

  stop: () => {
    if (!playerInstance) return
    playerInstance.stop()
    if (progressRafId !== null) {
      cancelAnimationFrame(progressRafId)
      progressRafId = null
    }
    latestProgress = null
    set({ isPlaying: false, isPaused: false, currentTime: 0 })
  },

  seek: (time: number) => {
    if (!playerInstance) return
    playerInstance.seek(time)
  },

  setVolume: (vol: number) => {
    if (playerInstance) playerInstance.setVol(vol)
    set({ volume: vol })
  },

  nextTrack: () => {
    const { tracks, currentTrack } = get()
    if (!tracks.length) return
    const idx = tracks.findIndex(t => t.id === currentTrack?.id)
    const next = tracks[(idx + 1) % tracks.length]
    get().loadTrack(next)
  },

  prevTrack: () => {
    const { tracks, currentTrack } = get()
    if (!tracks.length) return
    const idx = tracks.findIndex(t => t.id === currentTrack?.id)
    const prev = tracks[(idx - 1 + tracks.length) % tracks.length]
    get().loadTrack(prev)
  },
}))
