import { AudioEngine } from '../audio/engine'
import { MidiAdapter } from '../midi/adapter'
import { ConstraintEngine } from '../music-engine'

export const engine = new AudioEngine(4)
export const midi = new MidiAdapter()
export const constraintEngine = new ConstraintEngine()
