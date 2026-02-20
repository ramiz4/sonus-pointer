import React, { useRef, useCallback, useEffect, useState } from 'react'
import { useStore } from '../store'
import { engine, midi, constraintEngine } from '../services'
import {
  getScaleNotes,
  normalizeMousePosition,
  mapPositionToPitch,
  mapPositionToVelocity,
} from '../utils/mapping'
import { pitchClassStability } from '../music-engine'

interface ActiveNote {
  voiceId: string
  noteNumber: number
}

const SECONDARY_VOICE_VELOCITY_SCALE = 0.6

function drawTonalMap(canvas: HTMLCanvasElement, width: number, height: number): void {
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, width, height)

  const cols = 32
  const rows = 16
  const cellW = width / cols
  const cellH = height / rows

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const nx = col / cols
      const tensionPc = Math.floor(nx * 12)
      const stability = 1 - pitchClassStability(tensionPc)
      const alpha = stability * 0.15
      ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`
      ctx.fillRect(col * cellW, row * cellH, cellW, cellH)
    }
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('stable', width * 0.1, height - 4)
  ctx.fillText('tense', width * 0.9, height - 4)
}

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const isPointerDown = useRef(false)
  const activeNotes = useRef<Map<number, ActiveNote>>(new Map())
  const secondaryVoiceIds = useRef<string[]>([])
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 })
  const {
    scaleType,
    rootNote,
    octaves,
    polyphony,
    holdEnabled,
    volume,
    mode,
    currentOctaveShift,
    tonalFieldEnabled,
  } = useStore()

  // Apply volume and polyphony changes directly
  engine.setVolume(volume)
  engine.setMaxVoices(polyphony)

  // Update constraint engine config when root changes
  const effectiveRoot = rootNote + currentOctaveShift * 12
  useEffect(() => {
    constraintEngine.updateConfig({
      tonalField: { rootNote: effectiveRoot, baseOctave: 0, octaveRange: octaves },
      gravity: { rootNote: effectiveRoot, gravityStrength: 0.6 },
      enabled: tonalFieldEnabled,
    })
  }, [effectiveRoot, octaves, tonalFieldEnabled])

  // Clean up secondary voices when tonal field is disabled
  useEffect(() => {
    if (tonalFieldEnabled) return
    for (const svId of secondaryVoiceIds.current) {
      engine.noteOff(svId)
    }
    secondaryVoiceIds.current = []
  }, [tonalFieldEnabled])

  // Track canvas size via ResizeObserver for visualization redraws
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setCanvasSize({ w: width, h: height })
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Draw / clear tonal map visualization
  useEffect(() => {
    const canvas = overlayRef.current
    if (!canvas) return

    if (!tonalFieldEnabled || canvasSize.w === 0) {
      // Clear the canvas when tonal field is disabled
      canvas.width = canvasSize.w
      canvas.height = canvasSize.h
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
      return
    }

    drawTonalMap(canvas, canvasSize.w, canvasSize.h)
  }, [tonalFieldEnabled, canvasSize])

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

      let noteNumber: number
      let velocity: number
      let secondaryNotes: number[] = []

      if (tonalFieldEnabled) {
        // Use the constraint engine pipeline
        const result = constraintEngine.process(nx, ny, mapPositionToVelocity(ny))
        noteNumber = result.primaryNote
        velocity = result.primaryVelocity
        secondaryNotes = result.secondaryNotes
      } else {
        // Original direct mapping
        const scaleNotes = getScaleNotes({
          type: scaleType,
          rootNote: rootNote + currentOctaveShift * 12,
          octaves,
        })
        noteNumber = mapPositionToPitch(
          mode === 'improv' ? Math.min(1, Math.max(0, nx + (Math.random() - 0.5) * 0.05)) : nx,
          scaleNotes
        )
        velocity = mapPositionToVelocity(ny)
      }

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

      // Handle secondary voices from constraint engine
      if (tonalFieldEnabled) {
        // Stop previous secondary voices
        for (const svId of secondaryVoiceIds.current) {
          engine.noteOff(svId)
        }
        secondaryVoiceIds.current = []
        // Play new secondary voices
        for (let i = 0; i < secondaryNotes.length; i++) {
          const svId = `secondary-${i}`
          engine.noteOn(svId, secondaryNotes[i], Math.round(velocity * SECONDARY_VOICE_VELOCITY_SCALE))
          secondaryVoiceIds.current.push(svId)
        }
      }
    },
    [scaleType, rootNote, octaves, mode, currentOctaveShift, tonalFieldEnabled]
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
      // Stop secondary voices
      for (const svId of secondaryVoiceIds.current) {
        engine.noteOff(svId)
      }
      secondaryVoiceIds.current = []
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
      className="w-full h-52 sm:h-72 md:h-96 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl cursor-crosshair select-none relative overflow-hidden"
      style={{ touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={(e) => stopNote(e.pointerId)}
    >
      <canvas
        ref={overlayRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <p className="text-white/30 text-sm sm:text-lg select-none">
          {tonalFieldEnabled ? 'Explore the tonal field' : 'Touch or move to play'}
        </p>
      </div>
    </div>
  )
}

export default Canvas
