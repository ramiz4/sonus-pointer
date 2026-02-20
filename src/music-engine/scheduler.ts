/**
 * Musical Clock & Anticipation Scheduler
 *
 * Provides a BPM-based grid that quantizes note placement.
 * Notes are chosen slightly before playback for a predictive feel.
 *
 * Architecture:
 * - Tick-based scheduler driven by requestAnimationFrame or setInterval
 * - Lookahead window: notes are scheduled ahead of the beat
 * - Quantization snaps events to the nearest grid division
 */

export interface SchedulerConfig {
  bpm: number // beats per minute
  subdivision: number // grid divisions per beat (1 = quarter, 2 = eighth, 4 = sixteenth)
  lookaheadMs: number // how far ahead to schedule notes (milliseconds)
  swingAmount: number // 0 = straight, 0.5 = full shuffle (affects off-beats)
}

export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  bpm: 120,
  subdivision: 2,
  lookaheadMs: 100,
  swingAmount: 0,
}

export type SchedulerCallback = (beatTime: number, beatIndex: number) => void

/**
 * Calculates the duration of one grid tick in milliseconds.
 */
export function tickDurationMs(bpm: number, subdivision: number): number {
  return (60000 / bpm) / subdivision
}

/**
 * Quantizes a timestamp to the nearest grid position.
 *
 * @param timeMs - Raw timestamp in milliseconds
 * @param bpm - Beats per minute
 * @param subdivision - Grid subdivisions per beat
 * @param startTimeMs - When the scheduler started (reference point)
 * @returns The quantized timestamp snapped to the grid
 */
export function quantize(
  timeMs: number,
  bpm: number,
  subdivision: number,
  startTimeMs: number = 0
): number {
  const tick = tickDurationMs(bpm, subdivision)
  const elapsed = timeMs - startTimeMs
  const tickIndex = Math.round(elapsed / tick)
  return startTimeMs + tickIndex * tick
}

/**
 * Returns the next grid time at or after the given timestamp.
 */
export function nextGridTime(
  timeMs: number,
  bpm: number,
  subdivision: number,
  startTimeMs: number = 0
): number {
  const tick = tickDurationMs(bpm, subdivision)
  const elapsed = timeMs - startTimeMs
  const tickIndex = Math.ceil(elapsed / tick)
  return startTimeMs + tickIndex * tick
}

/**
 * Returns the beat index (0-based) for a given time.
 */
export function beatIndex(timeMs: number, bpm: number, startTimeMs: number = 0): number {
  const beatDuration = 60000 / bpm
  return Math.floor((timeMs - startTimeMs) / beatDuration)
}

/**
 * Applies swing to a grid time. Off-beat ticks are shifted forward.
 *
 * @param gridTimeMs - Quantized grid time
 * @param bpm - BPM
 * @param subdivision - Grid subdivision
 * @param swingAmount - Swing [0, 0.5]: 0 = straight, 0.5 = max swing
 * @param startTimeMs - Scheduler start time
 */
export function applySwing(
  gridTimeMs: number,
  bpm: number,
  subdivision: number,
  swingAmount: number,
  startTimeMs: number = 0
): number {
  if (swingAmount <= 0 || subdivision < 2) return gridTimeMs

  const tick = tickDurationMs(bpm, subdivision)
  const elapsed = gridTimeMs - startTimeMs
  const tickIdx = Math.round(elapsed / tick)

  // Only swing odd (off-beat) ticks
  if (tickIdx % 2 === 1) {
    const swing = Math.max(0, Math.min(0.5, swingAmount))
    return gridTimeMs + tick * swing
  }
  return gridTimeMs
}

/**
 * Simple scheduler that tracks beats. Does not use timers directly —
 * call `advance()` with the current time to drive it.
 */
export class MusicalClock {
  private config: SchedulerConfig
  private startTimeMs: number
  private lastProcessedTick: number

  constructor(config: SchedulerConfig = DEFAULT_SCHEDULER_CONFIG, startTimeMs: number = 0) {
    this.config = { ...config }
    this.startTimeMs = startTimeMs
    this.lastProcessedTick = -1
  }

  /**
   * Advance the clock to the given time. Returns any new beat events
   * that should be triggered (with their scheduled times).
   */
  advance(currentTimeMs: number): Array<{ beatTime: number; beatIndex: number }> {
    const tick = tickDurationMs(this.config.bpm, this.config.subdivision)
    const lookaheadTime = currentTimeMs + this.config.lookaheadMs
    const currentTick = Math.floor((lookaheadTime - this.startTimeMs) / tick)

    const events: Array<{ beatTime: number; beatIndex: number }> = []
    for (let t = this.lastProcessedTick + 1; t <= currentTick; t++) {
      let beatTime = this.startTimeMs + t * tick
      beatTime = applySwing(beatTime, this.config.bpm, this.config.subdivision, this.config.swingAmount, this.startTimeMs)
      events.push({ beatTime, beatIndex: t })
    }

    this.lastProcessedTick = currentTick
    return events
  }

  setBpm(bpm: number): void {
    this.config.bpm = Math.max(20, Math.min(300, bpm))
  }

  getBpm(): number {
    return this.config.bpm
  }

  setSubdivision(subdivision: number): void {
    this.config.subdivision = Math.max(1, Math.min(8, subdivision))
  }

  reset(startTimeMs: number = 0): void {
    this.startTimeMs = startTimeMs
    this.lastProcessedTick = -1
  }
}
