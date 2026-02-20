import { MidiAdapter } from '../midi/adapter'

describe('MidiAdapter', () => {
  let adapter: MidiAdapter

  beforeEach(() => {
    adapter = new MidiAdapter()
  })

  it('is not available by default', () => {
    expect(adapter.isAvailable()).toBe(false)
  })

  it('returns empty outputs before connect', () => {
    expect(adapter.getOutputs()).toHaveLength(0)
  })

  it('does not throw when sending note without outputs', () => {
    expect(() => adapter.noteOn(0, 60, 100)).not.toThrow()
    expect(() => adapter.noteOff(0, 60)).not.toThrow()
  })

  it('falls back silently when MIDI API unavailable', async () => {
    // No navigator.requestMIDIAccess in jsdom
    const result = await adapter.connect()
    expect(result).toBe(false)
    expect(adapter.isAvailable()).toBe(false)
  })
})
