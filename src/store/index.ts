import { create } from 'zustand'
import type { ScaleType } from '../utils/mapping'

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
  setScaleType: (t: ScaleType) => void
  setRootNote: (n: number) => void
  setPolyphony: (n: number) => void
  toggleHold: () => void
  setVolume: (v: number) => void
  setMode: (m: 'line' | 'improv') => void
  setMidiConnected: (v: boolean) => void
  shiftOctave: (delta: number) => void
  setTonalFieldEnabled: (v: boolean) => void
  setWaveform: (w: OscillatorType) => void
}

export const useStore = create<AppState>((set) => ({
  scaleType: 'pentatonic',
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
  setScaleType: (scaleType) => set({ scaleType }),
  setRootNote: (rootNote) => set({ rootNote }),
  setPolyphony: (polyphony) => set({ polyphony }),
  toggleHold: () => set((s) => ({ holdEnabled: !s.holdEnabled })),
  setVolume: (volume) => set({ volume }),
  setMode: (mode) => set({ mode }),
  setMidiConnected: (midiConnected) => set({ midiConnected }),
  shiftOctave: (delta) =>
    set((s) => ({
      currentOctaveShift: Math.max(-2, Math.min(2, s.currentOctaveShift + delta)),
    })),
  setTonalFieldEnabled: (tonalFieldEnabled) => set({ tonalFieldEnabled }),
  setWaveform: (waveform) => set((s) => ({ synthPreset: { ...s.synthPreset, waveform } })),
}))
