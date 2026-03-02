import { Track } from './types';

export const tracks: Track[] = [
  // Necros
  { id: 'necros-1', title: 'Point of Departure', artist: 'Necros', filename: 'point_of_departure.s3m', url: '/modules/point_of_departure.s3m' },
  { id: 'necros-2', title: 'Mechanism Eight', artist: 'Necros', filename: 'mechanism_eight.s3m', url: '/modules/mechanism_eight.s3m' },
  // Purple Motion
  { id: 'pm-1', title: 'Starshine', artist: 'Purple Motion', filename: 'starshine.s3m', url: '/modules/starshine.s3m' },
  { id: 'pm-2', title: 'Second Reality', artist: 'Purple Motion', filename: 'second_reality.s3m', url: '/modules/second_reality.s3m' },
  { id: 'pm-3', title: 'Unreal Superhero', artist: 'Purple Motion', filename: 'unreal_superhero.s3m', url: '/modules/unreal_superhero.s3m' },
  // Nightbeat
  { id: 'nb-1', title: 'Fable', artist: 'Nightbeat', filename: 'nb_fable.s3m', url: '/modules/nb_fable.s3m' },
  { id: 'nb-2', title: 'Miriel', artist: 'Nightbeat', filename: 'nb_miriel.it', url: '/modules/nb_miriel.it' },
  // Lizard King
  { id: 'lk-1', title: "Lizard King's Theme", artist: 'Lizard King', filename: 'lizardkings_theme.mod', url: '/modules/lizardkings_theme.mod' },
  { id: 'lk-2', title: 'Trans Atlantic', artist: 'Lizard King', filename: 'trans_atlantic.s3m', url: '/modules/trans_atlantic.s3m' },
];

export function getTracksByArtist(): Map<string, Track[]> {
  const map = new Map<string, Track[]>();
  for (const t of tracks) {
    if (!map.has(t.artist)) map.set(t.artist, []);
    map.get(t.artist)!.push(t);
  }
  return map;
}
