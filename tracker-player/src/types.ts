export interface Track {
  id: string;
  title: string;
  artist: string;
  filename: string;
  url: string;
}

export interface PatternRow {
  // Each channel: [note, instrument, volumeeffect, effect, volume, parameter]
  channels: number[][];
}

export interface PatternData {
  name: string;
  rows: number[][][]; // [row][channel][command]
}

export interface SongData {
  channels: string[];
  instruments: string[];
  samples: string[];
  orders: { name: string; pat: number }[];
  patterns: PatternData[];
  numSubsongs: number;
}

export interface ModuleMeta {
  dur: number;
  title?: string;
  artist?: string;
  tracker?: string;
  type?: string;
  type_long?: string;
  song: SongData;
  totalOrders: number;
  totalPatterns: number;
}

export interface ProgressData {
  pos: number;
  order: number;
  pattern: number;
  row: number;
}

export type PlayState = 'stopped' | 'playing' | 'paused';
