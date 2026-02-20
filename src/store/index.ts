import { create } from 'zustand'
import type { ScaleType } from '../utils/mapping'
import type { ConstraintEngineConfig } from '../music-engine'
import { DEFAULT_CONSTRAINT_CONFIG } from '../music-engine'

export interface SynthPreset {
  attack: number
  decay: number
  sustain: number
  release: number
  waveform: OscillatorType
}

export interface AppState {
  scaleType: ScaleType
  rootNote: number
  octaves: number
  polyphony: number
  holdEnabled: boolean
  volume: number
  mode: 'line' | 'improv'
  midiConnected: boolean
  currentOctaveShift: number
  synthPreset: SynthPreset
  tonalFieldEnabled: boolean
  constraintConfig: ConstraintEngineConfig
  bpm: number
  setScaleType: (t: ScaleType) => void
  setPolyphony: (n: number) => void
  toggleHold: () => void
  setVolume: (v: number) => void
  setMode: (m: 'line' | 'improv') => void
  setMidiConnected: (v: boolean) => void
  shiftOctave: (delta: number) => void
  setTonalFieldEnabled: (v: boolean) => void
  setBpm: (bpm: number) => void
}

export const useStore = create<AppState>((set) => ({
  scaleType: 'diatonic',
  rootNote: 60,
  octaves: 3,
  polyphony: 4,
  holdEnabled: false,
  volume: 0.7,
  mode: 'line',
  midiConnected: false,
  currentOctaveShift: 0,
  synthPreset: {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.8,
    release: 0.3,
    waveform: 'sine',
  },
  tonalFieldEnabled: false,
  constraintConfig: { ...DEFAULT_CONSTRAINT_CONFIG, enabled: false },
  bpm: 120,
  setScaleType: (scaleType) => set({ scaleType }),
  setPolyphony: (polyphony) => set({ polyphony }),
  toggleHold: () => set((s) => ({ holdEnabled: !s.holdEnabled })),
  setVolume: (volume) => set({ volume }),
  setMode: (mode) => set({ mode }),
  setMidiConnected: (midiConnected) => set({ midiConnected }),
  shiftOctave: (delta) =>
    set((s) => ({
      currentOctaveShift: Math.max(-2, Math.min(2, s.currentOctaveShift + delta)),
    })),
  setTonalFieldEnabled: (tonalFieldEnabled) =>
    set((s) => ({
      tonalFieldEnabled,
      constraintConfig: { ...s.constraintConfig, enabled: tonalFieldEnabled },
    })),
  setBpm: (bpm) => set({ bpm: Math.max(20, Math.min(300, bpm)) }),
}))
