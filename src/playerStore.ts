import { create } from 'zustand'
import { fetchTracks, getBundledTracks } from './tracks'
import type { Track } from './tracks'
import {
  hasFileSystemAccess,
  openLocalFolder as pickLocalFolder,
  getObjectUrl,
  buildTracksFromFileList,
  saveDirHandle,
  loadSavedDirHandle,
  buildTracksFromFiles,
  scanDirectory,
} from './fileSystem'

// We'll use chiptune3 dynamically
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let playerInstance: any = null

// rAF-based progress throttle (~60 updates/sec instead of ~375)
let latestProgress: { pos: number; order: number; pattern: number; row: number } | null = null
let progressRafId: number | null = null
// Guard against the chiptune3 worklet firing onEnded repeatedly
let isTransitioning = false

// File handle storage for local tracks (not in Zustand to avoid serialization issues)
const fileHandles = new Map<string, FileSystemFileHandle>()
// Blob storage for drag-drop fallback
const fileBlobs = new Map<string, File>()
// Track active object URLs for cleanup
const activeObjectUrls = new Set<string>()

function revokeAllObjectUrls() {
  for (const url of activeObjectUrls) {
    URL.revokeObjectURL(url)
  }
  activeObjectUrls.clear()
}

export interface PatternData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any
  patternData: PatternData | null
  analyser: AnalyserNode | null
  isInitialized: boolean
  /** Whether a local folder is currently loaded */
  hasLocalFolder: boolean
  /** Name of the loaded local folder */
  localFolderName: string | null
  /** True if the File System Access API is available */
  supportsFileSystemAccess: boolean
  /** True while scanning a folder */
  isScanning: boolean

  // Actions
  init: () => Promise<void>
  loadTrack: (track: Track) => void | Promise<void>
  play: () => void
  pause: () => void
  stop: () => void
  seek: (time: number) => void
  setVolume: (vol: number) => void
  nextTrack: () => void
  prevTrack: () => void
  openLocalFolder: () => Promise<void>
  loadDroppedFiles: (files: File[]) => void
  restoreSavedFolder: () => Promise<void>
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
  hasLocalFolder: false,
  localFolderName: null,
  supportsFileSystemAccess: hasFileSystemAccess(),
  isScanning: false,

  init: async () => {
    if (playerInstance) return

    // Try to load tracks from dev server API
    let tracks = await fetchTracks()

    // If no server tracks (production build), load bundled demo tracks
    if (tracks.length === 0) {
      tracks = getBundledTracks()
    }

    set({ tracks })

    const { ChiptuneJsPlayer } = await import('chiptune3')
    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.8

    playerInstance = new ChiptuneJsPlayer({ context: ctx, repeatCount: 0 })
    playerInstance.onInitialized(() => {
      playerInstance.gain.disconnect()
      playerInstance.gain.connect(analyser)
      analyser.connect(ctx.destination)
      set({ analyser, isInitialized: true })

      // Try restoring a saved folder after player is ready
      get().restoreSavedFolder()
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  loadTrack: async (track: Track) => {
    if (!playerInstance) return
    // Resume audio context if suspended
    if (playerInstance.context.state === 'suspended') {
      playerInstance.context.resume()
    }

    let url: string

    if (track.objectUrl) {
      // Already has an object URL (shouldn't happen often, but support it)
      url = track.objectUrl
    } else if (track.source === 'local' && fileHandles.has(track.id)) {
      // Local file via File System Access API — create object URL on demand
      const objectUrl = await getObjectUrl(fileHandles.get(track.id)!)
      activeObjectUrls.add(objectUrl)
      url = objectUrl
    } else if (track.source === 'local' && fileBlobs.has(track.id)) {
      // Local file via drag-drop fallback
      const objectUrl = URL.createObjectURL(fileBlobs.get(track.id)!)
      activeObjectUrls.add(objectUrl)
      url = objectUrl
    } else if (track.source === 'bundled') {
      // Bundled demo track — served from public/
      url = `/${track.file}`
    } else {
      // Dev server track
      url = `/music/${track.file}`
    }

    playerInstance.load(url)
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

  openLocalFolder: async () => {
    set({ isScanning: true })
    try {
      const result = await pickLocalFolder()
      if (!result) {
        set({ isScanning: false })
        return
      }

      const { dirHandle, tracks: localTracks, handles } = result

      // Save handle for reload persistence
      await saveDirHandle(dirHandle)

      // Clean up old object URLs
      revokeAllObjectUrls()
      fileHandles.clear()

      // Store handles
      for (const [id, handle] of handles) {
        fileHandles.set(id, handle)
      }

      // Mark tracks as local
      const taggedTracks = localTracks.map(t => ({ ...t, source: 'local' as const }))

      // Replace: keep only bundled tracks, swap out server + old local tracks
      // When local tracks are loaded, replace everything (including demo)
      set({
        tracks: taggedTracks,
        hasLocalFolder: taggedTracks.length > 0,
        localFolderName: taggedTracks.length > 0 ? dirHandle.name : null,
        isScanning: false,
      })
    } catch (err) {
      console.error('Failed to open folder:', err)
      set({ isScanning: false })
    }
  },

  loadDroppedFiles: (files: File[]) => {
    const startId = get().tracks.length
    const { tracks: localTracks, blobs } = buildTracksFromFileList(files, startId)
    if (localTracks.length === 0) return

    // Clean up old blobs
    fileBlobs.clear()
    revokeAllObjectUrls()

    for (const [id, blob] of blobs) {
      fileBlobs.set(id, blob)
    }

    const taggedTracks = localTracks.map(t => ({ ...t, source: 'local' as const }))
    // When local tracks are loaded, replace everything (including demo)
    set({
      tracks: taggedTracks,
      hasLocalFolder: true,
      localFolderName: 'Dropped files',
    })
  },

  restoreSavedFolder: async () => {
    if (!hasFileSystemAccess()) return

    const dirHandle = await loadSavedDirHandle()
    if (!dirHandle) return

    try {
      // Check if we still have permission
      const perm = await dirHandle.queryPermission({ mode: 'read' })
      if (perm !== 'granted') {
        // Don't auto-prompt — user needs to interact first.
        // We'll store the handle and prompt when they click "Restore"
        return
      }

      // Re-scan the directory
      set({ isScanning: true })
      const files = await scanDirectory(dirHandle)
      const { tracks: localTracks, handles } = buildTracksFromFiles(files)

      for (const [id, handle] of handles) {
        fileHandles.set(id, handle)
      }

      const taggedTracks = localTracks.map(t => ({ ...t, source: 'local' as const }))
      // When local tracks are loaded, replace everything (including demo)
      set({
        tracks: taggedTracks,
        hasLocalFolder: taggedTracks.length > 0,
        localFolderName: taggedTracks.length > 0 ? dirHandle.name : null,
        isScanning: false,
      })
    } catch (err) {
      console.error('Failed to restore saved folder:', err)
      set({ isScanning: false })
    }
  },
}))
