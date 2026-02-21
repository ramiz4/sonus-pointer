export type ScaleType =
  | 'diatonic'
  | 'chromatic'
  | 'pentatonic'
  | 'blues'
  | 'minor'
  | 'dorian'
  | 'phrygian'
  | 'lydian'
  | 'mixolydian'

export interface ScaleConfig {
  type: ScaleType
  rootNote: number // MIDI note number (0-127), e.g. 60 = C4
  octaves: number
}

const SCALE_INTERVALS: Record<ScaleType, number[]> = {
  diatonic: [0, 2, 4, 5, 7, 9, 11], // major scale
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  pentatonic: [0, 2, 4, 7, 9], // major pentatonic
  blues: [0, 3, 5, 6, 7, 10], // blues scale
  minor: [0, 2, 3, 5, 7, 8, 10], // natural minor
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
}

export const SCALE_LABELS: Record<ScaleType, string> = {
  diatonic: 'Major',
  pentatonic: 'Pentatonic',
  blues: 'Blues',
  minor: 'Natural Minor',
  dorian: 'Dorian',
  phrygian: 'Phrygian',
  lydian: 'Lydian',
  mixolydian: 'Mixolydian',
  chromatic: 'Chromatic',
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function midiNoteToName(note: number): string {
  const octave = Math.floor(note / 12) - 1
  return `${NOTE_NAMES[note % 12]}${octave}`
}

export function getScaleNotes(config: ScaleConfig): number[] {
  const intervals = SCALE_INTERVALS[config.type] ?? SCALE_INTERVALS.diatonic
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
