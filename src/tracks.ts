export interface Track {
  id: string
  file: string
  title: string
  artist: string
  format: string
}

export async function fetchTracks(): Promise<Track[]> {
  const res = await fetch('/__api/tracks')
  if (!res.ok) return []
  return res.json()
}
