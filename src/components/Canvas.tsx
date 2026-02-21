import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react'
import { useStore } from '../store'
import { engine, midi, constraintEngine } from '../services'
import {
  getScaleNotes,
  normalizeMousePosition,
  mapPositionToPitch,
  mapPositionToVelocity,
  midiNoteToName,
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

function drawNoteGrid(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  scaleNotes: number[]
): void {
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, width, height)

  if (scaleNotes.length === 0) return

  const noteWidth = width / scaleNotes.length

  scaleNotes.forEach((note, i) => {
    const x = i * noteWidth
    // Alternate shading for visual separation
    const isEven = i % 2 === 0
    ctx.fillStyle = isEven ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)'
    ctx.fillRect(x, 0, noteWidth, height)

    // Divider line
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()

    // Note name at bottom
    const name = midiNoteToName(note)
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.font = `${Math.max(9, Math.min(12, noteWidth - 2))}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(name, x + noteWidth / 2, height - 6)
  })
}

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const activePointers = useRef<Set<number>>(new Set())
  const activeNotes = useRef<Map<number, ActiveNote>>(new Map())
  const secondaryVoiceIds = useRef<string[]>([])
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 })
  const [playingNotes, setPlayingNotes] = useState<Set<number>>(new Set())
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
    synthPreset,
  } = useStore()

  // Apply volume and polyphony changes directly
  engine.setVolume(volume)
  engine.setMaxVoices(polyphony)

  // Apply waveform change only when it actually changes
  useEffect(() => {
    engine.setWaveform(synthPreset.waveform)
  }, [synthPreset.waveform])

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

  // Draw tonal map or note grid visualization
  useEffect(() => {
    const canvas = overlayRef.current
    if (!canvas || canvasSize.w === 0) return

    if (tonalFieldEnabled) {
      drawTonalMap(canvas, canvasSize.w, canvasSize.h)
    } else {
      const scaleNotes = getScaleNotes({ type: scaleType, rootNote: effectiveRoot, octaves })
      drawNoteGrid(canvas, canvasSize.w, canvasSize.h, scaleNotes)
    }
  }, [tonalFieldEnabled, canvasSize, scaleType, effectiveRoot, octaves])

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
        setPlayingNotes((prev) => {
          const next = new Set(prev)
          next.delete(existing.noteNumber)
          return next
        })
      }

      if (!existing || existing.noteNumber !== noteNumber) {
        engine.noteOn(voiceId, noteNumber, velocity)
        midi.noteOn(0, noteNumber, velocity)
        activeNotes.current.set(e.pointerId, { voiceId, noteNumber })
        setPlayingNotes((prev) => new Set([...prev, noteNumber]))
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
        setPlayingNotes((prev) => {
          const next = new Set(prev)
          next.delete(note.noteNumber)
          return next
        })
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
      activePointers.current.add(e.pointerId)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      playNote(e)
    },
    [playNote]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!activePointers.current.has(e.pointerId)) return
      playNote(e)
    },
    [playNote]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      activePointers.current.delete(e.pointerId)
      stopNote(e.pointerId)
    },
    [stopNote]
  )

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      activePointers.current.delete(e.pointerId)
      stopNote(e.pointerId)
    },
    [stopNote]
  )

  const playingNoteNames = useMemo(
    () => [...playingNotes].sort((a, b) => a - b).map(midiNoteToName).join('  '),
    [playingNotes]
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
      onPointerLeave={handlePointerLeave}
    >
      <canvas
        ref={overlayRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-1">
        {playingNotes.size > 0 ? (
          <p className="text-white/80 text-2xl sm:text-4xl font-bold tracking-widest select-none drop-shadow-lg">
            {playingNoteNames}
          </p>
        ) : (
          <p className="text-white/30 text-sm sm:text-lg select-none">
            {tonalFieldEnabled ? 'Explore the tonal field' : 'Touch or slide to play'}
          </p>
        )}
      </div>
    </div>
  )
}

export default Canvas
