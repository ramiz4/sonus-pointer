import {
  getCandidateNotes,
  tonalDistance,
  pitchClassStability,
  getStabilityOrder,
} from '../music-engine/tonalField'

describe('Tonal Field', () => {
  describe('getStabilityOrder', () => {
    it('returns 12 pitch classes', () => {
      expect(getStabilityOrder()).toHaveLength(12)
    })

    it('starts with root (0) as most stable', () => {
      expect(getStabilityOrder()[0]).toBe(0)
    })

    it('has perfect 5th (7) as second most stable', () => {
      expect(getStabilityOrder()[1]).toBe(7)
    })
  })

  describe('pitchClassStability', () => {
    it('root (0) has stability 0 (most stable)', () => {
      expect(pitchClassStability(0)).toBe(0)
    })

    it('minor 2nd (1) has stability 1 (most tense)', () => {
      expect(pitchClassStability(1)).toBeCloseTo(1)
    })

    it('perfect 5th (7) is more stable than tritone (6)', () => {
      expect(pitchClassStability(7)).toBeLessThan(pitchClassStability(6))
    })

    it('handles values > 12 via modulo', () => {
      expect(pitchClassStability(12)).toBe(pitchClassStability(0))
      expect(pitchClassStability(19)).toBe(pitchClassStability(7))
    })
  })

  describe('getCandidateNotes', () => {
    it('returns notes within MIDI range [0, 127]', () => {
      const notes = getCandidateNotes(0.5, 0.5)
      expect(notes.every((n) => n >= 0 && n <= 127)).toBe(true)
    })

    it('nearby positions produce related pitches', () => {
      const notesA = getCandidateNotes(0.3, 0.5)
      const notesB = getCandidateNotes(0.31, 0.5)
      // Should share most candidates
      const shared = notesA.filter((n) => notesB.indexOf(n) !== -1)
      expect(shared.length).toBeGreaterThan(0)
    })

    it('x=0 produces fewer candidates (more stable)', () => {
      const stable = getCandidateNotes(0, 0.5)
      const tense = getCandidateNotes(1, 0.5)
      expect(stable.length).toBeLessThanOrEqual(tense.length)
    })

    it('different y positions shift register', () => {
      const low = getCandidateNotes(0.5, 0)
      const high = getCandidateNotes(0.5, 1)
      const avgLow = low.reduce((s, n) => s + n, 0) / low.length
      const avgHigh = high.reduce((s, n) => s + n, 0) / high.length
      expect(avgHigh).toBeGreaterThan(avgLow)
    })

    it('respects custom config rootNote', () => {
      const notes = getCandidateNotes(0, 0, { rootNote: 48, baseOctave: 0, octaveRange: 2 })
      // At x=0, y=0 (lowest register), root pitch class should appear
      expect(notes).toContain(48)
    })

    it('clamps input positions to [0, 1]', () => {
      const notesA = getCandidateNotes(-1, -1)
      const notesB = getCandidateNotes(0, 0)
      expect(notesA).toEqual(notesB)
    })
  })

  describe('tonalDistance', () => {
    it('returns 0 for same position', () => {
      expect(tonalDistance({ nx: 0.5, ny: 0.5 }, { nx: 0.5, ny: 0.5 })).toBe(0)
    })

    it('x movement is weighted more than y', () => {
      const dx = tonalDistance({ nx: 0, ny: 0.5 }, { nx: 0.1, ny: 0.5 })
      const dy = tonalDistance({ nx: 0.5, ny: 0 }, { nx: 0.5, ny: 0.1 })
      expect(dx).toBeGreaterThan(dy)
    })

    it('greater distance for further positions', () => {
      const close = tonalDistance({ nx: 0.5, ny: 0.5 }, { nx: 0.51, ny: 0.51 })
      const far = tonalDistance({ nx: 0, ny: 0 }, { nx: 1, ny: 1 })
      expect(far).toBeGreaterThan(close)
    })
  })
})
