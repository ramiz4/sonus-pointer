// Tests for voice stealing logic (pure, no WebAudio dependency)

interface MockVoice {
  id: string
  noteNumber: number
  startTime: number
}

function stealOldestVoice(
  voices: Map<string, MockVoice>,
  maxVoices: number,
  newId: string,
  newNote: number
): Map<string, MockVoice> {
  if (voices.size >= maxVoices) {
    const oldest = [...voices.entries()].sort(([, a], [, b]) => a.startTime - b.startTime)[0]
    if (oldest) voices.delete(oldest[0])
  }
  voices.set(newId, { id: newId, noteNumber: newNote, startTime: Date.now() })
  return voices
}

describe('Voice stealing logic', () => {
  it('does not steal when under limit', () => {
    const voices = new Map<string, MockVoice>()
    voices.set('v1', { id: 'v1', noteNumber: 60, startTime: 1 })
    stealOldestVoice(voices, 4, 'v2', 62)
    expect(voices.size).toBe(2)
  })

  it('steals oldest voice when at limit', () => {
    const voices = new Map<string, MockVoice>()
    voices.set('v1', { id: 'v1', noteNumber: 60, startTime: 1 })
    voices.set('v2', { id: 'v2', noteNumber: 62, startTime: 2 })
    voices.set('v3', { id: 'v3', noteNumber: 64, startTime: 3 })
    voices.set('v4', { id: 'v4', noteNumber: 65, startTime: 4 })
    stealOldestVoice(voices, 4, 'v5', 67)
    expect(voices.size).toBe(4)
    expect(voices.has('v1')).toBe(false) // oldest stolen
    expect(voices.has('v5')).toBe(true)
  })

  it('allows single voice operation', () => {
    const voices = new Map<string, MockVoice>()
    voices.set('v1', { id: 'v1', noteNumber: 60, startTime: 1 })
    stealOldestVoice(voices, 1, 'v2', 62)
    expect(voices.size).toBe(1)
    expect(voices.has('v2')).toBe(true)
  })
})
