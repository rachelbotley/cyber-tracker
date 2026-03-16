/**
 * File System Access API support for loading local tracker music folders.
 * Chrome/Edge 86+ only — graceful fallback for other browsers.
 */

import type { Track } from './tracks'

const TRACKER_EXTENSIONS = new Set(['.mod', '.s3m', '.xm', '.it', '.mptm', '.stm', '.med'])

/** Check if the File System Access API is available */
export function hasFileSystemAccess(): boolean {
  return typeof globalThis.window !== 'undefined' && typeof window.showDirectoryPicker === 'function'
}



interface ScannedFile {
  handle: FileSystemFileHandle
  /** Relative path segments from root, e.g. ['artist', 'track.mod'] or ['track.mod'] */
  pathSegments: string[]
}

/**
 * Recursively scan a directory handle for tracker music files.
 */
export async function scanDirectory(
  dirHandle: FileSystemDirectoryHandle,
  pathSegments: string[] = [],
): Promise<ScannedFile[]> {
  const results: ScannedFile[] = []

  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
      const ext = entry.name.lastIndexOf('.') >= 0
        ? entry.name.slice(entry.name.lastIndexOf('.')).toLowerCase()
        : ''
      if (TRACKER_EXTENSIONS.has(ext)) {
        results.push({
          handle: entry,
          pathSegments: [...pathSegments, entry.name],
        })
      }
    } else if (entry.kind === 'directory') {
      const subResults = await scanDirectory(entry, [...pathSegments, entry.name])
      results.push(...subResults)
    }
  }

  return results
}

function formatTitle(filename: string): string {
  const name = filename.replace(/\.[^.]+$/, '')
  return decodeURIComponent(name)
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase())
}

function formatArtist(dirname: string): string {
  return dirname
    .replace(/[_-]/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * Build Track objects from scanned files.
 * If files are in subdirectories (artist/track.mod), use the subdirectory name as artist.
 * Otherwise, use "Unknown Artist".
 */
export function buildTracksFromFiles(
  files: ScannedFile[],
  startId: number = 0,
): { tracks: Track[]; handles: Map<string, FileSystemFileHandle> } {
  const tracks: Track[] = []
  const handles = new Map<string, FileSystemFileHandle>()

  // Sort by path for consistent ordering
  files.sort((a, b) => a.pathSegments.join('/').localeCompare(b.pathSegments.join('/')))

  let id = startId
  for (const file of files) {
    id++
    const trackId = `local-${id}`
    const filename = file.pathSegments[file.pathSegments.length - 1]
    const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()

    // Artist from parent directory if nested, otherwise "Unknown Artist"
    const artist = file.pathSegments.length > 1
      ? formatArtist(file.pathSegments[file.pathSegments.length - 2])
      : 'Unknown Artist'

    tracks.push({
      id: trackId,
      file: file.pathSegments.join('/'),
      title: formatTitle(filename),
      artist,
      format: ext.slice(1).toUpperCase(),
    })
    handles.set(trackId, file.handle)
  }

  return { tracks, handles }
}

/**
 * Open a directory picker and scan for tracker files.
 */
export async function openLocalFolder(): Promise<{
  dirHandle: FileSystemDirectoryHandle
  tracks: Track[]
  handles: Map<string, FileSystemFileHandle>
} | null> {
  try {
    const dirHandle = await window.showDirectoryPicker({ mode: 'read' })
    const files = await scanDirectory(dirHandle)
    const { tracks, handles } = buildTracksFromFiles(files)
    return { dirHandle, tracks, handles }
  } catch (err) {
    // User cancelled the picker
    if (err instanceof DOMException && err.name === 'AbortError') {
      return null
    }
    throw err
  }
}

/**
 * Create an object URL from a file handle. Caller must revoke when done.
 */
export async function getObjectUrl(handle: FileSystemFileHandle): Promise<string> {
  const file = await handle.getFile()
  return URL.createObjectURL(file)
}

/**
 * Process files from a drag-and-drop or <input> file list (fallback for non-Chrome browsers).
 */
export function buildTracksFromFileList(
  files: File[],
  startId: number = 0,
): { tracks: Track[]; blobs: Map<string, File> } {
  const tracks: Track[] = []
  const blobs = new Map<string, File>()

  // Filter to tracker files only
  const trackerFiles = files.filter(f => {
    const ext = f.name.lastIndexOf('.') >= 0
      ? f.name.slice(f.name.lastIndexOf('.')).toLowerCase()
      : ''
    return TRACKER_EXTENSIONS.has(ext)
  })

  // Sort by webkitRelativePath or name
  trackerFiles.sort((a, b) => {
    const pa = a.webkitRelativePath || a.name
    const pb = b.webkitRelativePath || b.name
    return pa.localeCompare(pb)
  })

  let id = startId
  for (const file of trackerFiles) {
    id++
    const trackId = `local-${id}`
    const relativePath = file.webkitRelativePath || file.name
    const segments = relativePath.split('/')
    const filename = segments[segments.length - 1]
    const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()

    // For webkitdirectory, path is like "foldername/artist/track.mod"
    // Skip the root folder name, use intermediate dirs as artist
    let artist = 'Unknown Artist'
    if (segments.length >= 3) {
      // foldername/artist/track.mod
      artist = formatArtist(segments[segments.length - 2])
    } else if (segments.length === 2) {
      // Could be foldername/track.mod (no artist) or artist/track.mod
      // If from webkitdirectory, first segment is the root folder name
      artist = 'Unknown Artist'
    }

    tracks.push({
      id: trackId,
      file: relativePath,
      title: formatTitle(filename),
      artist,
      format: ext.slice(1).toUpperCase(),
    })
    blobs.set(trackId, file)
  }

  return { tracks, blobs }
}

// ---- IndexedDB persistence for directory handle ----

const DB_NAME = 'cyber-tracker'
const STORE_NAME = 'handles'
const DIR_HANDLE_KEY = 'lastDirHandle'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveDirHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(handle, DIR_HANDLE_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadSavedDirHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(DIR_HANDLE_KEY)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

export async function clearSavedDirHandle(): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(DIR_HANDLE_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // Ignore
  }
}
