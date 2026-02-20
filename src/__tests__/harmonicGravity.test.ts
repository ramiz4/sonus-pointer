import {
  gravityWeight,
  applyGravity,
  rankByGravity,
  createSeededRandom,
} from '../music-engine/harmonicGravity'

describe('Harmonic Gravity', () => {
  describe('gravityWeight', () => {
    it('root has highest weight (1.0)', () => {
      expect(gravityWeight(60, 60)).toBe(1.0)
    })

    it('perfect 5th has high weight', () => {
      expect(gravityWeight(67, 60)).toBe(0.8)
    })

    it('minor 2nd has lowest weight', () => {
      expect(gravityWeight(61, 60)).toBe(0.1)
    })

    it('works across octaves', () => {
      // C5 relative to C4 root → pitch class 0 → weight 1.0
      expect(gravityWeight(72, 60)).toBe(1.0)
    })

    it('handles root note not being C', () => {
      // A4=69, E5=76 → 76-69=7 semitones → perfect 5th
      expect(gravityWeight(76, 69)).toBe(0.8)
    })

    it('root is more attractive than any other pitch class', () => {
      const rootWeight = gravityWeight(60, 60)
      for (let i = 1; i < 12; i++) {
        expect(rootWeight).toBeGreaterThan(gravityWeight(60 + i, 60))
      }
    })
  })

  describe('applyGravity', () => {
    it('returns rootNote when candidates is empty', () => {
      expect(applyGravity([], { rootNote: 60, gravityStrength: 0.6 })).toBe(60)
    })

    it('returns the single candidate when only one', () => {
      expect(applyGravity([67], { rootNote: 60, gravityStrength: 0.6 })).toBe(67)
    })

    it('with max gravity and low random, selects root when available', () => {
      const candidates = [60, 61, 62, 63, 64, 65, 66, 67]
      // With gravity=1 and rand=0, should prefer root (weight 1.0)
      const result = applyGravity(candidates, { rootNote: 60, gravityStrength: 1 }, 0)
      expect(result).toBe(60)
    })

    it('with zero gravity, selection is more uniform', () => {
      const candidates = [60, 61, 62, 63]
      // With 0 gravity, all weights equal → behaves like uniform selection
      const result = applyGravity(candidates, { rootNote: 60, gravityStrength: 0 }, 0.75)
      // 0.75 * 4 = 3 → index 3
      expect(result).toBe(63)
    })

    it('gravity pulls selection toward tonic over many samples', () => {
      const candidates = [60, 61, 66, 67] // root, m2, tritone, P5
      const config = { rootNote: 60, gravityStrength: 0.8 }
      const rng = createSeededRandom(42)
      const counts: Record<number, number> = { 60: 0, 61: 0, 66: 0, 67: 0 }
      for (let i = 0; i < 1000; i++) {
        const note = applyGravity(candidates, config, rng())
        counts[note]++
      }
      // Root and P5 should appear more often than m2 and tritone
      expect(counts[60]).toBeGreaterThan(counts[61])
      expect(counts[67]).toBeGreaterThan(counts[66])
    })
  })

  describe('rankByGravity', () => {
    it('returns notes sorted by weight descending', () => {
      const ranked = rankByGravity([60, 61, 67], 60)
      expect(ranked[0].note).toBe(60) // root, weight 1.0
      expect(ranked[1].note).toBe(67) // P5, weight 0.8
      expect(ranked[2].note).toBe(61) // m2, weight 0.1
    })
  })

  describe('createSeededRandom', () => {
    it('produces deterministic sequence', () => {
      const rng1 = createSeededRandom(123)
      const rng2 = createSeededRandom(123)
      for (let i = 0; i < 10; i++) {
        expect(rng1()).toBe(rng2())
      }
    })

    it('different seeds produce different sequences', () => {
      const rng1 = createSeededRandom(1)
      const rng2 = createSeededRandom(2)
      const seq1 = Array.from({ length: 5 }, () => rng1())
      const seq2 = Array.from({ length: 5 }, () => rng2())
      expect(seq1).not.toEqual(seq2)
    })

    it('values are in [0, 1)', () => {
      const rng = createSeededRandom(42)
      for (let i = 0; i < 100; i++) {
        const v = rng()
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThan(1)
      }
    })
  })
})
