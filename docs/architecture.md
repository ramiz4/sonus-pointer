# Architecture

## Overview

sonus-pointer converts mouse movement into real-time musical output via the Web Audio API with optional Web MIDI routing.

## Mouse → Pitch Math

1. Raw pointer coordinates `(x, y)` are captured inside a canvas div
2. `normalizeMousePosition(x, y, width, height)` maps them to `[0, 1]`
3. The X axis value `nx` is passed to `mapPositionToPitch(nx, scaleNotes)` which indexes into the scale array: `index = floor(nx * length)`
4. The Y axis value `ny` is used for velocity via `mapPositionToVelocity(ny)` = `round((1 - ny) * 127)`

## Scale System

Scales are defined as interval arrays relative to the root note:
- Diatonic (major): `[0, 2, 4, 5, 7, 9, 11]`
- Chromatic: `[0..11]`

`getScaleNotes({ type, rootNote, octaves })` expands across N octaves and returns an array of MIDI note numbers.

## Audio Scheduling

The `AudioEngine` class wraps the Web Audio API:
- Each voice is an `OscillatorNode` → `GainNode` → `MasterGainNode` → `destination`
- ADSR envelope is applied to the gain
- Voice stealing removes the oldest active voice when polyphony limit is exceeded
- `noteOff` applies a release ramp before stopping the oscillator

## MIDI Routing

`MidiAdapter` wraps `navigator.requestMIDIAccess()`:
- On connect, enumerates available outputs
- `noteOn` / `noteOff` send standard MIDI byte arrays
- Falls back silently if the API is unavailable
