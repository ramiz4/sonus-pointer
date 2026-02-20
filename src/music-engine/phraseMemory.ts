/**
 * Phrase Memory
 *
 * Cursor motion creates evolving patterns:
 * - Short loop memory captures recent note sequences
 * - Variation on repetition: replayed phrases are subtly altered
 * - Identical replays are avoided
 *
 * Movement becomes material — the system remembers and transforms gestures.
 */

export interface PhraseEvent {
  note: number
  velocity: number
  timestamp: number
}

export interface PhraseMemoryConfig {
  maxLength: number // maximum events to remember
  variationAmount: number // 0 = exact replay, 1 = maximum variation (in semitones)
  similarityThreshold: number // 0–1: how similar is "too similar" (triggers variation)
}

export const DEFAULT_PHRASE_CONFIG: PhraseMemoryConfig = {
  maxLength: 16,
  variationAmount: 2,
  similarityThreshold: 0.85,
}

export class PhraseMemory {
  private buffer: PhraseEvent[] = []
  private config: PhraseMemoryConfig
  private replayCount: number = 0

  constructor(config: PhraseMemoryConfig = DEFAULT_PHRASE_CONFIG) {
    this.config = { ...config }
  }

  /**
   * Record a new note event into the phrase buffer.
   */
  record(note: number, velocity: number, timestamp: number): void {
    this.buffer.push({ note, velocity, timestamp })
    if (this.buffer.length > this.config.maxLength) {
      this.buffer.shift()
    }
  }

  /**
   * Get the current phrase buffer (copy).
   */
  getPhrase(): PhraseEvent[] {
    return [...this.buffer]
  }

  /**
   * Get the most recent note in the buffer.
   */
  getLastNote(): number | null {
    return this.buffer.length > 0 ? this.buffer[this.buffer.length - 1].note : null
  }

  /**
   * Get the interval pattern of the current phrase (differences between successive notes).
   */
  getIntervalPattern(): number[] {
    if (this.buffer.length < 2) return []
    const intervals: number[] = []
    for (let i = 1; i < this.buffer.length; i++) {
      intervals.push(this.buffer[i].note - this.buffer[i - 1].note)
    }
    return intervals
  }

  /**
   * Compute similarity between two interval patterns (0 = different, 1 = identical).
   */
  static similarity(pattern1: number[], pattern2: number[]): number {
    if (pattern1.length === 0 || pattern2.length === 0) return 0
    const len = Math.min(pattern1.length, pattern2.length)
    let matches = 0
    for (let i = 0; i < len; i++) {
      if (pattern1[i] === pattern2[i]) matches++
    }
    return matches / len
  }

  /**
   * Apply variation to a note based on the replay count.
   * More replays = more variation, ensuring phrases evolve.
   *
   * @param note - Original note
   * @param rand - Random value [0, 1) for deterministic variation
   * @returns Varied note
   */
  applyVariation(note: number, rand: number = Math.random()): number {
    if (this.config.variationAmount <= 0) return note

    // Increase variation with each replay
    const scale = Math.min(this.replayCount, 4) / 4
    const maxShift = Math.ceil(this.config.variationAmount * scale)
    if (maxShift === 0) return note

    const shift = Math.floor(rand * (maxShift * 2 + 1)) - maxShift
    return Math.max(0, Math.min(127, note + shift))
  }

  /**
   * Check if the given interval pattern is too similar to the stored phrase.
   * If so, increment replay count (which increases future variation).
   */
  checkAndEvolve(newPattern: number[]): boolean {
    const currentPattern = this.getIntervalPattern()
    const sim = PhraseMemory.similarity(currentPattern, newPattern)
    if (sim >= this.config.similarityThreshold) {
      this.replayCount++
      return true // too similar, variation should be applied
    }
    this.replayCount = Math.max(0, this.replayCount - 1)
    return false
  }

  /**
   * Returns the current replay count (how many times similar patterns were detected).
   */
  getReplayCount(): number {
    return this.replayCount
  }

  /**
   * Clear the phrase buffer and reset replay tracking.
   */
  clear(): void {
    this.buffer = []
    this.replayCount = 0
  }

  /**
   * Get the buffer length.
   */
  getLength(): number {
    return this.buffer.length
  }
}
