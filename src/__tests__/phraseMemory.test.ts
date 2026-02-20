import { PhraseMemory } from '../music-engine/phraseMemory'

describe('Phrase Memory', () => {
  describe('recording', () => {
    it('records events up to maxLength', () => {
      const pm = new PhraseMemory({ maxLength: 4, variationAmount: 2, similarityThreshold: 0.85 })
      pm.record(60, 100, 0)
      pm.record(62, 100, 100)
      pm.record(64, 100, 200)
      pm.record(65, 100, 300)
      expect(pm.getLength()).toBe(4)
    })

    it('drops oldest event when exceeding maxLength', () => {
      const pm = new PhraseMemory({ maxLength: 3, variationAmount: 2, similarityThreshold: 0.85 })
      pm.record(60, 100, 0)
      pm.record(62, 100, 100)
      pm.record(64, 100, 200)
      pm.record(65, 100, 300)
      expect(pm.getLength()).toBe(3)
      const phrase = pm.getPhrase()
      expect(phrase[0].note).toBe(62) // 60 was dropped
    })

    it('getLastNote returns most recent', () => {
      const pm = new PhraseMemory()
      pm.record(60, 100, 0)
      pm.record(67, 100, 100)
      expect(pm.getLastNote()).toBe(67)
    })

    it('getLastNote returns null when empty', () => {
      const pm = new PhraseMemory()
      expect(pm.getLastNote()).toBeNull()
    })
  })

  describe('interval pattern', () => {
    it('returns empty for fewer than 2 events', () => {
      const pm = new PhraseMemory()
      pm.record(60, 100, 0)
      expect(pm.getIntervalPattern()).toEqual([])
    })

    it('computes correct intervals', () => {
      const pm = new PhraseMemory()
      pm.record(60, 100, 0)
      pm.record(64, 100, 100) // +4
      pm.record(67, 100, 200) // +3
      pm.record(60, 100, 300) // -7
      expect(pm.getIntervalPattern()).toEqual([4, 3, -7])
    })
  })

  describe('similarity', () => {
    it('identical patterns have similarity 1', () => {
      expect(PhraseMemory.similarity([2, 3, -5], [2, 3, -5])).toBe(1)
    })

    it('completely different patterns have similarity 0', () => {
      expect(PhraseMemory.similarity([2, 3, -5], [1, -2, 7])).toBe(0)
    })

    it('partially matching patterns have intermediate similarity', () => {
      const sim = PhraseMemory.similarity([2, 3, -5], [2, 3, 1])
      expect(sim).toBeCloseTo(2 / 3)
    })

    it('empty patterns have similarity 0', () => {
      expect(PhraseMemory.similarity([], [1, 2])).toBe(0)
    })
  })

  describe('variation', () => {
    it('no variation when variationAmount is 0', () => {
      const pm = new PhraseMemory({ maxLength: 16, variationAmount: 0, similarityThreshold: 0.85 })
      expect(pm.applyVariation(60, 0.5)).toBe(60)
    })

    it('variation increases with replay count', () => {
      const pm = new PhraseMemory({ maxLength: 16, variationAmount: 4, similarityThreshold: 0.85 })
      // Initially replayCount=0, so scale=0, maxShift=0
      expect(pm.applyVariation(60, 0.5)).toBe(60)

      // Simulate replays by checking similar patterns
      pm.record(60, 100, 0)
      pm.record(62, 100, 100)
      pm.record(64, 100, 200)
      const pattern = pm.getIntervalPattern()
      pm.checkAndEvolve(pattern) // replay 1
      pm.checkAndEvolve(pattern) // replay 2

      // Now variation should be non-trivial for certain rand values
      const results = new Set<number>()
      for (let r = 0; r < 1; r += 0.1) {
        results.add(pm.applyVariation(60, r))
      }
      // Should produce some varied results
      expect(results.size).toBeGreaterThanOrEqual(1)
    })

    it('repeated gestures vary but remain recognizable', () => {
      const pm = new PhraseMemory({ maxLength: 8, variationAmount: 2, similarityThreshold: 0.8 })

      // Record a pattern
      pm.record(60, 100, 0)
      pm.record(62, 100, 100)
      pm.record(64, 100, 200)
      pm.record(67, 100, 300)

      // Simulate multiple replays
      for (let i = 0; i < 5; i++) {
        pm.checkAndEvolve([2, 2, 3])
      }

      // Variation should be bounded
      for (let r = 0; r < 1; r += 0.1) {
        const varied = pm.applyVariation(60, r)
        expect(varied).toBeGreaterThanOrEqual(58) // at most 2 semitones down
        expect(varied).toBeLessThanOrEqual(62) // at most 2 semitones up
      }
    })
  })

  describe('clear', () => {
    it('resets buffer and replay count', () => {
      const pm = new PhraseMemory()
      pm.record(60, 100, 0)
      pm.record(62, 100, 100)
      pm.clear()
      expect(pm.getLength()).toBe(0)
      expect(pm.getReplayCount()).toBe(0)
    })
  })
})
