import { ConstraintEngine } from '../music-engine/constraintEngine'
import { createSeededRandom } from '../music-engine/harmonicGravity'

describe('Constraint Engine', () => {
  it('produces valid MIDI notes', () => {
    const engine = new ConstraintEngine({ enabled: true })
    const result = engine.process(0.5, 0.5, 100, 0.3)
    expect(result.primaryNote).toBeGreaterThanOrEqual(0)
    expect(result.primaryNote).toBeLessThanOrEqual(127)
  })

  it('returns candidates from tonal field', () => {
    const engine = new ConstraintEngine({ enabled: true })
    const result = engine.process(0.5, 0.5)
    expect(result.candidates.length).toBeGreaterThan(0)
  })

  it('nearby positions produce related primary notes', () => {
    const engine = new ConstraintEngine({
      enabled: true,
      gravity: { rootNote: 60, gravityStrength: 0.9 },
    })

    // Use separate identically-seeded RNGs so both loops get the same random sequence
    const rngA = createSeededRandom(42)
    const notesA = new Set<number>()
    for (let i = 0; i < 20; i++) {
      const a = engine.process(0.3, 0.5, 100, rngA())
      notesA.add(a.primaryNote % 12)
    }

    engine.reset()
    const rngB = createSeededRandom(42)
    const notesB = new Set<number>()
    for (let i = 0; i < 20; i++) {
      const b = engine.process(0.31, 0.5, 100, rngB())
      notesB.add(b.primaryNote % 12)
    }
    // Should share at least some pitch classes
    const shared = [...notesA].filter((pc) => notesB.has(pc))
    expect(shared.length).toBeGreaterThan(0)
  })

  it('derives secondary voices when relations configured', () => {
    const engine = new ConstraintEngine({
      enabled: true,
      voiceRelations: [
        { type: 'parallel', interval: 7 },
        { type: 'drone', interval: 0, anchorNote: 48 },
      ],
    })
    const result = engine.process(0.5, 0.5, 100, 0.3)
    expect(result.secondaryNotes).toHaveLength(2)
    // Drone should be at anchor
    expect(result.secondaryNotes[1]).toBe(48)
  })

  it('returns no secondary voices without relations', () => {
    const engine = new ConstraintEngine({ enabled: true, voiceRelations: [] })
    const result = engine.process(0.5, 0.5)
    expect(result.secondaryNotes).toHaveLength(0)
  })

  it('reset clears phrase memory and previous note', () => {
    const engine = new ConstraintEngine({ enabled: true })
    engine.process(0.5, 0.5)
    engine.process(0.6, 0.6)
    engine.reset()
    expect(engine.getPhraseMemory().getLength()).toBe(0)
  })

  it('updateConfig deep-merges nested objects', () => {
    const engine = new ConstraintEngine({ enabled: true })
    const originalOctaveRange = engine.getConfig().tonalField.octaveRange
    engine.updateConfig({ gravity: { rootNote: 48, gravityStrength: 1.0 } })
    const config = engine.getConfig()
    expect(config.gravity.rootNote).toBe(48)
    expect(config.gravity.gravityStrength).toBe(1.0)
    // tonalField should be preserved
    expect(config.tonalField.octaveRange).toBe(originalOctaveRange)
  })
})
