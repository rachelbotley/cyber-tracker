// @ts-ignore - chiptune3 has no types
import { ChiptuneJsPlayer } from 'chiptune3';
import type { ProgressData } from './types';

export type PlayerEventHandler = {
  onMetadata?: (meta: ModuleMeta) => void;
  onProgress?: (data: ProgressData) => void;
  onEnded?: () => void;
  onError?: (err: any) => void;
  onInitialized?: () => void;
};

let playerInstance: ChiptuneJsPlayer | null = null;
let analyserNode: AnalyserNode | null = null;

export function getPlayer(): ChiptuneJsPlayer | null {
  return playerInstance;
}

export function getAnalyser(): AnalyserNode | null {
  return analyserNode;
}

export function getAudioContext(): AudioContext | null {
  return playerInstance?.context ?? null;
}

export function initPlayer(handlers: PlayerEventHandler): ChiptuneJsPlayer {
  if (playerInstance) return playerInstance;

  const player = new ChiptuneJsPlayer({ repeatCount: 0 });

  // Create analyser after context is available
  const ctx = player.context as AudioContext;
  analyserNode = ctx.createAnalyser();
  analyserNode.fftSize = 2048;
  analyserNode.smoothingTimeConstant = 0.8;

  // Connect gain -> analyser -> destination
  // The player internally connects processNode -> gain
  // We need to intercept: gain -> analyser -> destination
  player.gain.disconnect();
  player.gain.connect(analyserNode);
  analyserNode.connect(ctx.destination);

  if (handlers.onMetadata) player.onMetadata(handlers.onMetadata);
  if (handlers.onProgress) player.onProgress(handlers.onProgress);
  if (handlers.onEnded) player.onEnded(handlers.onEnded);
  if (handlers.onError) player.onError(handlers.onError);
  if (handlers.onInitialized) player.onInitialized(handlers.onInitialized);

  playerInstance = player;
  return player;
}

export function loadTrack(url: string) {
  if (!playerInstance) return;
  // Resume context if suspended (autoplay policy)
  const ctx = playerInstance.context as AudioContext;
  if (ctx.state === 'suspended') ctx.resume();
  playerInstance.load(url);
}

export function play() {
  if (!playerInstance) return;
  const ctx = playerInstance.context as AudioContext;
  if (ctx.state === 'suspended') ctx.resume();
  playerInstance.unpause();
}

export function pause() {
  playerInstance?.pause();
}

export function stop() {
  playerInstance?.stop();
}

export function togglePause() {
  playerInstance?.togglePause();
}

export function setVolume(v: number) {
  playerInstance?.setVol(v);
}

export function seek(seconds: number) {
  playerInstance?.seek(seconds);
}
