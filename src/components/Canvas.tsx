import React, { useRef, useCallback } from 'react'
import { useStore } from '../store'
import { AudioEngine } from '../audio/engine'
import { MidiAdapter } from '../midi/adapter'
import {
  getScaleNotes,
  normalizeMousePosition,
  mapPositionToPitch,
  mapPositionToVelocity,
} from '../utils/mapping'

const engine = new AudioEngine(4)
const midi = new MidiAdapter()

interface ActiveNote {
  voiceId: string
  noteNumber: number
}

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const isPointerDown = useRef(false)
  const activeNotes = useRef<Map<number, ActiveNote>>(new Map())
  const { scaleType, rootNote, octaves, polyphony, holdEnabled, volume, mode, currentOctaveShift } =
    useStore()

  // Apply volume and polyphony changes directly
  engine.setVolume(volume)
  engine.setMaxVoices(polyphony)

  const playNote = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const { nx, ny } = normalizeMousePosition(
        e.clientX - rect.left,
        e.clientY - rect.top,
        rect.width,
        rect.height
      )
      const scaleNotes = getScaleNotes({
        type: scaleType,
        rootNote: rootNote + currentOctaveShift * 12,
        octaves,
      })
      const noteNumber = mapPositionToPitch(
        mode === 'improv' ? Math.min(1, Math.max(0, nx + (Math.random() - 0.5) * 0.05)) : nx,
        scaleNotes
      )
      const velocity = mapPositionToVelocity(ny)
      const voiceId = `pointer-${e.pointerId}`

      // Stop previous note for this pointer if different
      const existing = activeNotes.current.get(e.pointerId)
      if (existing && existing.noteNumber !== noteNumber) {
        engine.noteOff(voiceId)
        midi.noteOff(0, existing.noteNumber)
      }

      if (!existing || existing.noteNumber !== noteNumber) {
        engine.noteOn(voiceId, noteNumber, velocity)
        midi.noteOn(0, noteNumber, velocity)
        activeNotes.current.set(e.pointerId, { voiceId, noteNumber })
      }
    },
    [scaleType, rootNote, octaves, mode, currentOctaveShift]
  )

  const stopNote = useCallback(
    (pointerId: number) => {
      if (holdEnabled) return
      const note = activeNotes.current.get(pointerId)
      if (note) {
        engine.noteOff(note.voiceId)
        midi.noteOff(0, note.noteNumber)
        activeNotes.current.delete(pointerId)
      }
    },
    [holdEnabled]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      engine.resume()
      isPointerDown.current = true
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      playNote(e)
    },
    [playNote]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isPointerDown.current) return
      playNote(e)
    },
    [playNote]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      isPointerDown.current = false
      stopNote(e.pointerId)
    },
    [stopNote]
  )

  return (
    <div
      ref={canvasRef}
      data-testid="canvas"
      className="w-full h-96 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl cursor-crosshair select-none relative overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={(e) => stopNote(e.pointerId)}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <p className="text-white/30 text-lg select-none">Move mouse to play</p>
      </div>
    </div>
  )
}

export default Canvas
