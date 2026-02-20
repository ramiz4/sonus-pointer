/**
 * Harmonic Gravity
 *
 * Notes are attracted to musically stable tones:
 * - Root has strongest attraction
 * - Chord tones (3rd, 5th) have medium attraction
 * - Tensions (2nd, 4th, 6th, 7th) weakest
 *
 * Cursor proximity biases probability, not absolute selection.
 * Uses deterministic randomness (seeded) for reproducibility.
 */

/** Gravity weights for each pitch class relative to root. */
const GRAVITY_WEIGHTS: Record<number, number> = {
  0: 1.0, // root - strongest
  7: 0.8, // perfect 5th
  5: 0.6, // perfect 4th
  4: 0.55, // major 3rd
  3: 0.5, // minor 3rd
  9: 0.4, // major 6th
  2: 0.35, // major 2nd
  10: 0.3, // minor 7th
  8: 0.25, // minor 6th
  11: 0.2, // major 7th
  6: 0.15, // tritone
  1: 0.1, // minor 2nd - weakest
}

/**
 * Returns the gravity weight for a MIDI note relative to a root.
 * Higher weight = stronger attraction toward stability.
 */
export function gravityWeight(midiNote: number, rootNote: number): number {
  const pc = ((midiNote - rootNote) % 12 + 12) % 12
  return GRAVITY_WEIGHTS[pc] ?? 0.1
}

/**
 * Simple deterministic pseudo-random number generator (mulberry32).
 * Returns a function that produces values in [0, 1).
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed | 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface GravityConfig {
  rootNote: number
  gravityStrength: number // 0 = no gravity, 1 = maximum pull toward stable tones
}

export const DEFAULT_GRAVITY_CONFIG: GravityConfig = {
  rootNote: 60,
  gravityStrength: 0.6,
}

/**
 * Applies harmonic gravity to candidate notes: selects one note
 * using weighted probability. More stable notes are more likely to
 * be selected. Gravity strength controls how biased the selection is.
 *
 * @param candidates - Array of MIDI notes to choose from
 * @param config - Gravity configuration
 * @param rand - Random value in [0, 1) for deterministic selection
 * @returns The selected MIDI note
 */
export function applyGravity(
  candidates: number[],
  config: GravityConfig = DEFAULT_GRAVITY_CONFIG,
  rand: number = Math.random()
): number {
  if (candidates.length === 0) return config.rootNote
  if (candidates.length === 1) return candidates[0]

  const { rootNote, gravityStrength } = config
  const strength = Math.max(0, Math.min(1, gravityStrength))

  // Compute weights: blend between uniform and gravity-biased
  const weights = candidates.map((note) => {
    const gw = gravityWeight(note, rootNote)
    // Interpolate between uniform (1) and gravity weight
    return 1 - strength + strength * gw
  })

  // Normalize to probabilities
  const total = weights.reduce((sum, w) => sum + w, 0)
  const probabilities = weights.map((w) => w / total)

  // Weighted selection using the provided random value
  let cumulative = 0
  const r = Math.max(0, Math.min(1 - Number.EPSILON, rand))
  for (let i = 0; i < probabilities.length; i++) {
    cumulative += probabilities[i]
    if (r < cumulative) return candidates[i]
  }
  return candidates[candidates.length - 1]
}

/**
 * Returns all candidates with their gravity weights, sorted by weight descending.
 * Useful for visualization and debugging.
 */
export function rankByGravity(
  candidates: number[],
  rootNote: number
): Array<{ note: number; weight: number }> {
  return candidates
    .map((note) => ({ note, weight: gravityWeight(note, rootNote) }))
    .sort((a, b) => b.weight - a.weight)
}
