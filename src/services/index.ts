import { AudioEngine } from '../audio/engine'
import { MidiAdapter } from '../midi/adapter'

export const engine = new AudioEngine(4)
export const midi = new MidiAdapter()
