import { Track } from './types';

export const tracks: Track[] = [
  { id: 'lk-1', title: "Lizard King's Theme", artist: 'Lizard King', filename: 'lizardkings_theme.mod', url: '/modules/lizardkings_theme.mod' },
];

export function getTracksByArtist(): Map<string, Track[]> {
  const map = new Map<string, Track[]>();
  for (const t of tracks) {
    if (!map.has(t.artist)) map.set(t.artist, []);
    map.get(t.artist)!.push(t);
  }
  return map;
}
