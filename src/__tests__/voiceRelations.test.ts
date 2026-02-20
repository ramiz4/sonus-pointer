import {
  deriveVoice,
  deriveAllVoices,
  isConsonant,
} from '../music-engine/voiceRelations'
import type { VoiceRelation } from '../music-engine/voiceRelations'

describe('Voice Relations', () => {
  describe('deriveVoice - parallel', () => {
    const relation: VoiceRelation = { type: 'parallel', interval: 7 }

    it('adds interval to primary note', () => {
      expect(deriveVoice(60, null, relation)).toBe(67)
    })

    it('follows primary movement', () => {
      expect(deriveVoice(62, 60, relation)).toBe(69)
    })

    it('clamps to MIDI range', () => {
      expect(deriveVoice(125, null, relation)).toBe(127)
    })
  })

  describe('deriveVoice - contrary', () => {
    const relation: VoiceRelation = { type: 'contrary', interval: 0, anchorNote: 60 }

    it('mirrors movement around anchor', () => {
      // Primary at 65 → offset +5 → contrary = 60-5 = 55
      expect(deriveVoice(65, null, relation)).toBe(55)
    })

    it('returns anchor when primary is at anchor', () => {
      expect(deriveVoice(60, null, relation)).toBe(60)
    })

    it('mirrors below anchor too', () => {
      // Primary at 55 → offset -5 → contrary = 60+5 = 65
      expect(deriveVoice(55, null, relation)).toBe(65)
    })
  })

  describe('deriveVoice - intervalFollower', () => {
    const relation: VoiceRelation = { type: 'intervalFollower', interval: 4 }

    it('starts at primary + interval', () => {
      expect(deriveVoice(60, null, relation)).toBe(64)
    })

    it('limits secondary motion to 2 semitones max', () => {
      // Primary jumps from 60 to 72 (+12), but secondary only moves +2
      const result = deriveVoice(72, 60, relation)
      // Previous derived was 60+4=64, clamped motion +2 → 66
      expect(result).toBe(66)
    })

    it('follows small movements faithfully', () => {
      // Primary moves 60→61 (+1), secondary should move +1 from 64→65
      expect(deriveVoice(61, 60, relation)).toBe(65)
    })
  })

  describe('deriveVoice - drone', () => {
    const relation: VoiceRelation = { type: 'drone', interval: 0, anchorNote: 48 }

    it('stays on anchor regardless of primary', () => {
      expect(deriveVoice(60, null, relation)).toBe(48)
      expect(deriveVoice(72, 60, relation)).toBe(48)
      expect(deriveVoice(36, 72, relation)).toBe(48)
    })
  })

  describe('deriveAllVoices', () => {
    it('derives multiple voices at once', () => {
      const relations: VoiceRelation[] = [
        { type: 'parallel', interval: 7 },
        { type: 'drone', interval: 0, anchorNote: 48 },
      ]
      const voices = deriveAllVoices(60, null, relations)
      expect(voices).toEqual([67, 48])
    })

    it('returns empty array for no relations', () => {
      expect(deriveAllVoices(60, null, [])).toEqual([])
    })
  })

  describe('isConsonant', () => {
    it('unison is consonant', () => {
      expect(isConsonant(60, 60)).toBe(true)
    })

    it('perfect 5th is consonant', () => {
      expect(isConsonant(60, 67)).toBe(true)
    })

    it('major 3rd is consonant', () => {
      expect(isConsonant(60, 64)).toBe(true)
    })

    it('minor 2nd is dissonant', () => {
      expect(isConsonant(60, 61)).toBe(false)
    })

    it('tritone is dissonant', () => {
      expect(isConsonant(60, 66)).toBe(false)
    })

    it('works across octaves', () => {
      expect(isConsonant(60, 79)).toBe(true) // 19 semitones = 7 mod 12 = P5
    })

    it('voice intervals remain consistent across register', () => {
      // Same interval type should be consonant/dissonant regardless of register
      for (let base = 36; base <= 96; base += 12) {
        expect(isConsonant(base, base + 7)).toBe(true) // P5 always consonant
        expect(isConsonant(base, base + 1)).toBe(false) // m2 always dissonant
      }
    })
  })
})
