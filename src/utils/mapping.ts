export type ScaleType = 'diatonic' | 'chromatic'

export interface ScaleConfig {
  type: ScaleType
  rootNote: number // MIDI note number (0-127), e.g. 60 = C4
  octaves: number
}

const DIATONIC_INTERVALS = [0, 2, 4, 5, 7, 9, 11] // major scale
const CHROMATIC_INTERVALS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

export function getScaleNotes(config: ScaleConfig): number[] {
  const intervals = config.type === 'diatonic' ? DIATONIC_INTERVALS : CHROMATIC_INTERVALS
  const notes: number[] = []
  for (let oct = 0; oct < config.octaves; oct++) {
    for (const interval of intervals) {
      const note = config.rootNote + oct * 12 + interval
      if (note <= 127) notes.push(note)
    }
  }
  return notes
}

export function normalizeMousePosition(
  x: number,
  y: number,
  width: number,
  height: number
): { nx: number; ny: number } {
  return {
    nx: Math.max(0, Math.min(1, x / width)),
    ny: Math.max(0, Math.min(1, y / height)),
  }
}

export function midiNoteToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12)
}

export function mapPositionToPitch(nx: number, scaleNotes: number[]): number {
  const index = Math.floor(nx * scaleNotes.length)
  const clamped = Math.max(0, Math.min(scaleNotes.length - 1, index))
  return scaleNotes[clamped]
}

export function mapPositionToVelocity(ny: number): number {
  // y=0 is top (high velocity), y=1 is bottom (low velocity)
  return Math.round((1 - ny) * 127)
}
