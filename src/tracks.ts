export interface Track {
  id: string
  file: string
  title: string
  artist: string
  format: string
}

export const tracks: Track[] = [
  { id: '1', file: 'lizardkings_theme.mod', title: "Lizard King's Theme", artist: 'Lizard King', format: 'MOD' },
]
