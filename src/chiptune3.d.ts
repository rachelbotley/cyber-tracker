declare module 'chiptune3' {
  export class ChiptuneJsPlayer {
    constructor(config?: {
      repeatCount?: number
      stereoSeparation?: number
      interpolationFilter?: number
      context?: AudioContext
    })
    context: AudioContext
    gain: GainNode
    meta: any
    duration: number
    currentTime: number
    order: number
    pattern: number
    row: number
    processNode: AudioWorkletNode

    load(url: string): void
    play(buffer: ArrayBuffer): void
    stop(): void
    pause(): void
    unpause(): void
    togglePause(): void
    setRepeatCount(val: number): void
    setPitch(val: number): void
    setTempo(val: number): void
    setPos(val: number): void
    setOrderRow(o: number, r: number): void
    setVol(val: number): void
    selectSubsong(val: number): void
    seek(val: number): void
    getCurrentTime(): number

    onInitialized(handler: () => void): void
    onEnded(handler: () => void): void
    onError(handler: (err: any) => void): void
    onMetadata(handler: (meta: any) => void): void
    onProgress(handler: (data: any) => void): void
    addHandler(eventName: string, handler: (...args: any[]) => void): void
    fireEvent(eventName: string, response?: any): void
  }
}
