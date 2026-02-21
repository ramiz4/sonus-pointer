import {
  getScaleNotes,
  normalizeMousePosition,
  mapPositionToPitch,
  mapPositionToVelocity,
  midiNoteToFrequency,
  midiNoteToName,
} from '../utils/mapping'

describe('normalizeMousePosition', () => {
  it('normalizes center position', () => {
    const { nx, ny } = normalizeMousePosition(50, 50, 100, 100)
    expect(nx).toBe(0.5)
    expect(ny).toBe(0.5)
  })

  it('clamps values to [0, 1]', () => {
    const { nx, ny } = normalizeMousePosition(-10, 200, 100, 100)
    expect(nx).toBe(0)
    expect(ny).toBe(1)
  })

  it('returns 0 at origin', () => {
    const { nx, ny } = normalizeMousePosition(0, 0, 100, 100)
    expect(nx).toBe(0)
    expect(ny).toBe(0)
  })
})

describe('getScaleNotes', () => {
  it('returns 7 notes per octave for diatonic', () => {
    const notes = getScaleNotes({ type: 'diatonic', rootNote: 60, octaves: 1 })
    expect(notes).toHaveLength(7)
  })

  it('returns 12 notes per octave for chromatic', () => {
    const notes = getScaleNotes({ type: 'chromatic', rootNote: 60, octaves: 1 })
    expect(notes).toHaveLength(12)
  })

  it('returns 5 notes per octave for pentatonic', () => {
    const notes = getScaleNotes({ type: 'pentatonic', rootNote: 60, octaves: 1 })
    expect(notes).toHaveLength(5)
    expect(notes[0]).toBe(60)
  })

  it('returns 6 notes per octave for blues', () => {
    const notes = getScaleNotes({ type: 'blues', rootNote: 60, octaves: 1 })
    expect(notes).toHaveLength(6)
    expect(notes[0]).toBe(60)
  })

  it('returns 7 notes per octave for natural minor', () => {
    const notes = getScaleNotes({ type: 'minor', rootNote: 60, octaves: 1 })
    expect(notes).toHaveLength(7)
    expect(notes[0]).toBe(60)
  })

  it('returns 7 notes per octave for dorian', () => {
    const notes = getScaleNotes({ type: 'dorian', rootNote: 60, octaves: 1 })
    expect(notes).toHaveLength(7)
  })

  it('returns 7 notes per octave for phrygian', () => {
    const notes = getScaleNotes({ type: 'phrygian', rootNote: 60, octaves: 1 })
    expect(notes).toHaveLength(7)
  })

  it('returns 7 notes per octave for lydian', () => {
    const notes = getScaleNotes({ type: 'lydian', rootNote: 60, octaves: 1 })
    expect(notes).toHaveLength(7)
  })

  it('returns 7 notes per octave for mixolydian', () => {
    const notes = getScaleNotes({ type: 'mixolydian', rootNote: 60, octaves: 1 })
    expect(notes).toHaveLength(7)
  })

  it('starts at rootNote', () => {
    const notes = getScaleNotes({ type: 'diatonic', rootNote: 60, octaves: 1 })
    expect(notes[0]).toBe(60)
  })

  it('spans multiple octaves', () => {
    const notes = getScaleNotes({ type: 'diatonic', rootNote: 60, octaves: 2 })
    expect(notes).toHaveLength(14)
  })

  it('pentatonic spans multiple octaves correctly', () => {
    const notes = getScaleNotes({ type: 'pentatonic', rootNote: 60, octaves: 2 })
    expect(notes).toHaveLength(10)
  })

  it('does not exceed MIDI note 127', () => {
    const notes = getScaleNotes({ type: 'chromatic', rootNote: 120, octaves: 3 })
    expect(notes.every((n) => n <= 127)).toBe(true)
  })
})

describe('mapPositionToPitch', () => {
  const notes = [60, 62, 64, 65, 67, 69, 71]

  it('maps nx=0 to first note', () => {
    expect(mapPositionToPitch(0, notes)).toBe(60)
  })

  it('maps nx=1 to last note', () => {
    expect(mapPositionToPitch(1, notes)).toBe(71)
  })

  it('maps nx=0.5 to middle note', () => {
    const result = mapPositionToPitch(0.5, notes)
    expect(notes).toContain(result)
  })
})

describe('mapPositionToVelocity', () => {
  it('returns 127 at top (ny=0)', () => {
    expect(mapPositionToVelocity(0)).toBe(127)
  })

  it('returns 0 at bottom (ny=1)', () => {
    expect(mapPositionToVelocity(1)).toBe(0)
  })

  it('returns mid velocity at ny=0.5', () => {
    const v = mapPositionToVelocity(0.5)
    expect(v).toBeGreaterThan(60)
    expect(v).toBeLessThan(70)
  })
})

describe('midiNoteToFrequency', () => {
  it('A4 (69) = 440 Hz', () => {
    expect(midiNoteToFrequency(69)).toBeCloseTo(440)
  })

  it('A5 (81) = 880 Hz', () => {
    expect(midiNoteToFrequency(81)).toBeCloseTo(880)
  })
})

describe('midiNoteToName', () => {
  it('C4 (60) = C4', () => {
    expect(midiNoteToName(60)).toBe('C4')
  })

  it('A4 (69) = A4', () => {
    expect(midiNoteToName(69)).toBe('A4')
  })

  it('C#4 (61) = C#4', () => {
    expect(midiNoteToName(61)).toBe('C#4')
  })

  it('C5 (72) = C5', () => {
    expect(midiNoteToName(72)).toBe('C5')
  })
})
