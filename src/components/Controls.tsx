import React, { useCallback } from 'react'
import { useStore } from '../store'
import type { ScaleType } from '../utils/mapping'
import { MidiAdapter } from '../midi/adapter'

const midi = new MidiAdapter()

const Controls: React.FC = () => {
  const {
    scaleType,
    polyphony,
    holdEnabled,
    volume,
    mode,
    midiConnected,
    setScaleType,
    setPolyphony,
    toggleHold,
    setVolume,
    setMode,
    setMidiConnected,
  } = useStore()

  const handleMidiConnect = useCallback(async () => {
    const ok = await midi.connect()
    setMidiConnected(ok)
  }, [setMidiConnected])

  return (
    <div className="flex flex-wrap gap-4 items-center justify-center p-4 bg-gray-900 rounded-xl">
      {/* Scale selector */}
      <label className="flex flex-col gap-1 text-white text-sm">
        Scale
        <select
          value={scaleType}
          onChange={(e) => setScaleType(e.target.value as ScaleType)}
          className="bg-gray-700 text-white rounded px-2 py-1"
        >
          <option value="diatonic">Diatonic (Major)</option>
          <option value="chromatic">Chromatic</option>
        </select>
      </label>

      {/* Mode selector */}
      <label className="flex flex-col gap-1 text-white text-sm">
        Mode
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as 'line' | 'improv')}
          className="bg-gray-700 text-white rounded px-2 py-1"
        >
          <option value="line">Line</option>
          <option value="improv">Improv</option>
        </select>
      </label>

      {/* Polyphony */}
      <label className="flex flex-col gap-1 text-white text-sm">
        Polyphony
        <select
          value={polyphony}
          onChange={(e) => setPolyphony(Number(e.target.value))}
          className="bg-gray-700 text-white rounded px-2 py-1"
        >
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      {/* Hold toggle */}
      <button
        onClick={toggleHold}
        className={`px-4 py-2 rounded text-white text-sm font-medium ${
          holdEnabled ? 'bg-indigo-600' : 'bg-gray-700'
        }`}
        aria-pressed={holdEnabled}
      >
        Hold {holdEnabled ? 'ON' : 'OFF'}
      </button>

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
          className="accent-indigo-500"
        />
      </label>

      {/* MIDI */}
      <button
        onClick={handleMidiConnect}
        className={`px-4 py-2 rounded text-white text-sm font-medium ${
          midiConnected ? 'bg-green-600' : 'bg-gray-700'
        }`}
      >
        {midiConnected ? 'MIDI Connected' : 'Connect MIDI'}
      </button>
    </div>
  )
}

export default Controls
