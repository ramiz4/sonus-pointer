/**
 * Voice Relationship Engine
 *
 * Secondary voices are derived from the primary voice using
 * musical relationships that produce counterpoint, not just chords.
 *
 * Voice types:
 * - parallel: same direction, fixed interval
 * - contrary: opposite direction from anchor point
 * - intervalFollower: follows at a musical interval with constraints
 * - drone: stays on a stable pitch
 */

export type VoiceRelationType = 'parallel' | 'contrary' | 'intervalFollower' | 'drone'

export interface VoiceRelation {
  type: VoiceRelationType
  interval: number // semitones (positive = up)
  anchorNote?: number // reference point for contrary motion / drone
}

export const DEFAULT_RELATIONS: VoiceRelation[] = [
  { type: 'parallel', interval: 7 }, // perfect 5th above
  { type: 'contrary', interval: 0, anchorNote: 60 }, // contrary from middle C
  { type: 'drone', interval: 0, anchorNote: 60 }, // drone on root
]

/**
 * Computes a secondary voice note from the primary note and relation.
 *
 * @param primaryNote - Current MIDI note of the primary voice
 * @param previousPrimaryNote - Previous primary note (for motion-based relations)
 * @param relation - The voice relationship configuration
 * @returns The derived MIDI note, clamped to valid range
 */
export function deriveVoice(
  primaryNote: number,
  previousPrimaryNote: number | null,
  relation: VoiceRelation
): number {
  let result: number

  switch (relation.type) {
    case 'parallel':
      // Move in same direction at fixed interval
      result = primaryNote + relation.interval
      break

    case 'contrary': {
      // Move in opposite direction from anchor
      const anchor = relation.anchorNote ?? 60
      const offset = primaryNote - anchor
      result = anchor - offset + relation.interval
      break
    }

    case 'intervalFollower': {
      // Follow at interval, but constrained to move stepwise when primary leaps
      const baseNote = primaryNote + relation.interval
      if (previousPrimaryNote === null) {
        result = baseNote
      } else {
        const primaryMotion = primaryNote - previousPrimaryNote
        // Limit secondary motion to max 2 semitones per step for smooth counterpoint
        const clampedMotion = Math.max(-2, Math.min(2, primaryMotion))
        const previousDerived = previousPrimaryNote + relation.interval
        result = previousDerived + clampedMotion
      }
      break
    }

    case 'drone':
      // Stay on anchor note regardless of primary movement
      result = relation.anchorNote ?? 60
      break

    default:
      result = primaryNote
  }

  return Math.max(0, Math.min(127, result))
}

/**
 * Derive multiple secondary voices from a primary note.
 */
export function deriveAllVoices(
  primaryNote: number,
  previousPrimaryNote: number | null,
  relations: VoiceRelation[]
): number[] {
  return relations.map((rel) => deriveVoice(primaryNote, previousPrimaryNote, rel))
}

/**
 * Checks if the interval between two notes is consonant.
 * Consonant intervals: unison, minor/major 3rd, perfect 4th/5th, minor/major 6th, octave.
 */
export function isConsonant(note1: number, note2: number): boolean {
  const interval = Math.abs(note1 - note2) % 12
  return [0, 3, 4, 5, 7, 8, 9].indexOf(interval) !== -1
}
