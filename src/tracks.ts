export interface Track {
  id: string
  file: string
  title: string
  artist: string
  format: string
  /** Object URL for locally-loaded files (File System Access API or drag-drop) */
  objectUrl?: string
  /** Source: 'server' (dev mode API), 'bundled' (demo track), or 'local' (user folder) */
  source?: 'server' | 'bundled' | 'local'
}

/** Fetch tracks from the Vite dev server API (dev mode only) */
export async function fetchTracks(): Promise<Track[]> {
  try {
    const res = await fetch('/__api/tracks')
    if (!res.ok) return []
    const data: Track[] = await res.json()
    return data.map(t => ({ ...t, source: 'server' as const }))
  } catch {
    return []
  }
}

/** Bundled demo tracks available in the static build */
export function getBundledTracks(): Track[] {
  return [
    {
      id: 'demo-1',
      file: 'music/demo/lizardkings_theme.mod',
      title: "Lizard King's Theme",
      artist: 'Demo',
      format: 'MOD',
      source: 'bundled',
    },
  ]
}
