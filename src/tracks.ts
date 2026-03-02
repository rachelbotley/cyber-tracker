export interface Track {
  id: string
  file: string
  title: string
  artist: string
  format: string
}

export const tracks: Track[] = [
  { id: '1', file: 'point_of_departure.s3m', title: 'Point of Departure', artist: 'Necros', format: 'S3M' },
  { id: '2', file: 'mechanism_eight.s3m', title: 'Mechanism Eight', artist: 'Necros', format: 'S3M' },
  { id: '3', file: 'starshine.s3m', title: 'Starshine', artist: 'Purple Motion', format: 'S3M' },
  { id: '4', file: 'second_reality.s3m', title: 'Second Reality', artist: 'Purple Motion', format: 'S3M' },
  { id: '5', file: 'unreal_superhero.s3m', title: 'Unreal Superhero', artist: 'Purple Motion', format: 'S3M' },
  { id: '6', file: 'nb_fable.s3m', title: 'Fable', artist: 'Nightbeat', format: 'S3M' },
  { id: '7', file: 'nb_miriel.it', title: 'Miriel', artist: 'Nightbeat', format: 'IT' },
  { id: '8', file: 'lizardkings_theme.mod', title: "Lizard King's Theme", artist: 'Lizard King', format: 'MOD' },
  { id: '9', file: 'trans_atlantic.s3m', title: 'Trans Atlantic', artist: 'Lizard King', format: 'S3M' },
]
