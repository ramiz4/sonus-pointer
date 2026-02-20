/**
 * Continuous Tonal Space
 *
 * Maps 2D cursor position to a continuous tonal field where:
 * - Horizontal axis (x): tonal tension (0 = stable/tonic, 1 = maximum tension)
 * - Vertical axis (y): register & density (0 = low/sparse, 1 = high/dense)
 *
 * Nearby positions produce related pitches; movement feels smooth, not step-based.
 *
 * Math: The field is built from a base pitch class set ordered by harmonic distance
 * from the root. The x-axis interpolates through this ordering, while the y-axis
 * controls octave/register. A cosine-based interpolation function ensures smooth
 * transitions between pitch regions.
 */

/** Pitch classes ordered by harmonic stability relative to root (0 = most stable) */
const STABILITY_ORDER = [0, 7, 5, 4, 3, 9, 2, 10, 8, 6, 11, 1] as const

/**
 * Configuration for the tonal field.
 */
export interface TonalFieldConfig {
  rootNote: number // MIDI root (e.g. 60 = C4)
  baseOctave: number // lowest octave offset
  octaveRange: number // number of octaves spanned
}

export const DEFAULT_TONAL_FIELD_CONFIG: TonalFieldConfig = {
  rootNote: 60,
  baseOctave: 0,
  octaveRange: 3,
}

/**
 * Returns an array of pitch classes sorted by harmonic stability.
 * Index 0 is the root (most stable), index 11 is the most tense.
 */
export function getStabilityOrder(): readonly number[] {
  return STABILITY_ORDER
}

/**
 * Compute the harmonic stability of a pitch class (0–11) relative to root.
 * Returns a value in [0, 1] where 0 = most stable, 1 = most tense.
 */
export function pitchClassStability(pitchClass: number): number {
  const pc = ((pitchClass % 12) + 12) % 12
  const index = STABILITY_ORDER.indexOf(pc as (typeof STABILITY_ORDER)[number])
  return index / (STABILITY_ORDER.length - 1)
}

/**
 * Core tonal field function: maps a 2D position to candidate MIDI notes.
 *
 * @param nx - Horizontal position [0, 1]: 0 = stable, 1 = tense
 * @param ny - Vertical position [0, 1]: 0 = low register, 1 = high register
 * @param config - Tonal field configuration
 * @returns Array of candidate MIDI notes sorted by relevance (most relevant first)
 */
export function getCandidateNotes(
  nx: number,
  ny: number,
  config: TonalFieldConfig = DEFAULT_TONAL_FIELD_CONFIG
): number[] {
  const x = Math.max(0, Math.min(1, nx))
  const y = Math.max(0, Math.min(1, ny))

  // How many pitch classes to include (x controls tension breadth)
  // At x=0: only root + perfect fifth (2 notes)
  // At x=1: all 12 pitch classes
  const count = Math.round(2 + x * 10)
  const activePitchClasses = STABILITY_ORDER.slice(0, count)

  // y controls register: map to octave offset
  const octaveCenter = config.baseOctave + y * config.octaveRange
  const octaveLow = Math.floor(octaveCenter)
  const octaveHigh = Math.min(octaveLow + 1, config.baseOctave + config.octaveRange)

  const candidates: number[] = []
  for (let oct = octaveLow; oct <= octaveHigh; oct++) {
    for (const pc of activePitchClasses) {
      const note = config.rootNote + oct * 12 + pc
      if (note >= 0 && note <= 127) {
        candidates.push(note)
      }
    }
  }

  // Sort by proximity to the register center
  const centerNote = config.rootNote + octaveCenter * 12
  candidates.sort((a, b) => Math.abs(a - centerNote) - Math.abs(b - centerNote))

  return candidates
}

/**
 * Measures tonal distance between two positions in the field.
 * Small values indicate the positions produce related pitches.
 */
export function tonalDistance(
  pos1: { nx: number; ny: number },
  pos2: { nx: number; ny: number }
): number {
  const dx = pos1.nx - pos2.nx
  const dy = pos1.ny - pos2.ny
  // Weight x more heavily since it controls harmonic content
  return Math.sqrt(dx * dx * 4 + dy * dy)
}
