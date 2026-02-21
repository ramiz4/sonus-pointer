import React, { useCallback } from 'react'
import { useStore } from '../store'
import type { ScaleType } from '../utils/mapping'
import { SCALE_LABELS } from '../utils/mapping'
import { midi } from '../services'

const ROOT_NOTES = [
  { label: 'C', value: 60 },
  { label: 'C#', value: 61 },
  { label: 'D', value: 62 },
  { label: 'D#', value: 63 },
  { label: 'E', value: 64 },
  { label: 'F', value: 65 },
  { label: 'F#', value: 66 },
  { label: 'G', value: 67 },
  { label: 'G#', value: 68 },
  { label: 'A', value: 69 },
  { label: 'A#', value: 70 },
  { label: 'B', value: 71 },
]

const Controls: React.FC = () => {
  const {
    scaleType,
    rootNote,
    polyphony,
    holdEnabled,
    volume,
    mode,
    midiConnected,
    tonalFieldEnabled,
    synthPreset,
    setScaleType,
    setRootNote,
    setPolyphony,
    toggleHold,
    setVolume,
    setMode,
    setMidiConnected,
    setTonalFieldEnabled,
    setWaveform,
  } = useStore()

  const handleMidiConnect = useCallback(async () => {
    const ok = await midi.connect()
    setMidiConnected(ok)
  }, [setMidiConnected])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 sm:p-4 bg-gray-900 rounded-xl">
      {/* Key / Root note */}
      <label className="flex flex-col gap-1 text-white text-sm">
        Key
        <select
          value={rootNote}
          onChange={(e) => setRootNote(Number(e.target.value))}
          className="bg-gray-700 text-white rounded px-2 py-2 min-h-[44px] text-sm"
        >
          {ROOT_NOTES.map(({ label, value }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {/* Scale selector */}
      <label className="flex flex-col gap-1 text-white text-sm">
        Scale
        <select
          value={scaleType}
          onChange={(e) => setScaleType(e.target.value as ScaleType)}
          className="bg-gray-700 text-white rounded px-2 py-2 min-h-[44px] text-sm"
        >
          {(Object.keys(SCALE_LABELS) as ScaleType[]).map((key) => (
            <option key={key} value={key}>
              {SCALE_LABELS[key]}
            </option>
          ))}
        </select>
      </label>

      {/* Waveform */}
      <label className="flex flex-col gap-1 text-white text-sm">
        Sound
        <select
          value={synthPreset.waveform}
          onChange={(e) => setWaveform(e.target.value as OscillatorType)}
          className="bg-gray-700 text-white rounded px-2 py-2 min-h-[44px] text-sm"
        >
          <option value="sine">Sine (smooth)</option>
          <option value="triangle">Triangle (soft)</option>
          <option value="square">Square (hollow)</option>
          <option value="sawtooth">Sawtooth (bright)</option>
        </select>
      </label>

      {/* Mode selector */}
      <label className="flex flex-col gap-1 text-white text-sm">
        Mode
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as 'line' | 'improv')}
          className="bg-gray-700 text-white rounded px-2 py-2 min-h-[44px] text-sm"
        >
          <option value="line">Line</option>
          <option value="improv">Improv</option>
        </select>
      </label>

      {/* Polyphony */}
      <label className="flex flex-col gap-1 text-white text-sm">
        Voices
        <select
          value={polyphony}
          onChange={(e) => setPolyphony(Number(e.target.value))}
          className="bg-gray-700 text-white rounded px-2 py-2 min-h-[44px] text-sm"
        >
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      {/* Volume */}
      <label className="flex flex-col gap-1 text-white text-sm">
        Volume
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="accent-indigo-500 w-full h-[44px]"
        />
      </label>

      {/* Hold toggle */}
      <button
        onClick={toggleHold}
        className={`min-h-[44px] rounded text-white text-sm font-medium ${
          holdEnabled ? 'bg-indigo-600' : 'bg-gray-700'
        }`}
        aria-pressed={holdEnabled}
      >
        Hold {holdEnabled ? 'ON' : 'OFF'}
      </button>

      {/* Tonal Field toggle */}
      <button
        onClick={() => setTonalFieldEnabled(!tonalFieldEnabled)}
        className={`min-h-[44px] rounded text-white text-sm font-medium ${
          tonalFieldEnabled ? 'bg-purple-600' : 'bg-gray-700'
        }`}
        aria-pressed={tonalFieldEnabled}
      >
        Tonal Field {tonalFieldEnabled ? 'ON' : 'OFF'}
      </button>

      {/* MIDI */}
      <button
        onClick={handleMidiConnect}
        className={`min-h-[44px] rounded text-white text-sm font-medium ${
          midiConnected ? 'bg-green-600' : 'bg-gray-700'
        }`}
      >
        {midiConnected ? 'MIDI Connected' : 'Connect MIDI'}
      </button>
    </div>
  )
}

export default Controls
