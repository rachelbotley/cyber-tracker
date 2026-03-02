import { create } from 'zustand'
import { Track, tracks } from './tracks'

// We'll use chiptune3 dynamically
let playerInstance: any = null

export interface PatternData {
  patterns: any[]
  channels: string[]
  numChannels: number
}

export interface PlayerState {
  // State
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
    const { ChiptuneJsPlayer } = await import('chiptune3')
    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.8

    playerInstance = new ChiptuneJsPlayer({ context: ctx })
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
      set({
        currentTime: data.pos,
        order: data.order,
        pattern: data.pattern,
        row: data.row,
      })
    })

    playerInstance.onEnded(() => {
      get().nextTrack()
    })

    playerInstance.setVol(get().volume)
  },

  loadTrack: (track: Track) => {
    const state = get()
    if (!playerInstance) return
    // Resume audio context if suspended
    if (playerInstance.context.state === 'suspended') {
      playerInstance.context.resume()
    }
    playerInstance.load(`/modules/${track.file}`)
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
    const state = get()
    const idx = tracks.findIndex(t => t.id === state.currentTrack?.id)
    const next = tracks[(idx + 1) % tracks.length]
    get().loadTrack(next)
  },

  prevTrack: () => {
    const state = get()
    const idx = tracks.findIndex(t => t.id === state.currentTrack?.id)
    const prev = tracks[(idx - 1 + tracks.length) % tracks.length]
    get().loadTrack(prev)
  },
}))
