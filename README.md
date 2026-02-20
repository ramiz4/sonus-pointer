# sonus-pointer

A browser-based musical instrument that converts mouse movement into melodic music with harmonic logic.

## Features
- Mouse X → pitch (diatonic/chromatic scales)
- Mouse Y → velocity
- Up to 4 simultaneous voices with voice stealing
- WebAudio API polyphonic synth
- Web MIDI output (optional)
- Hold mode, Line/Improv modes
- Keyboard shortcuts: Space (hold), ↑↓ (octave)

## Quick Start

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173, move your mouse over the canvas to play.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm test` | Run unit tests |
| `pnpm lint` | Lint code |
| `pnpm preview` | Preview build |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Toggle Hold |
| ↑ | Octave up |
| ↓ | Octave down |

## From Instrument to Musical Space

sonus-pointer evolves from a direct instrument into an interactive musical exploration environment, inspired by Laurie Spiegel's philosophy of compositional systems.

### Architecture

The system follows a pipeline that separates position from note:

```
position → tonal context → candidate notes → rules → scheduled music
```

Instead of cursor directly triggering notes, the cursor moves through a **harmonic landscape** that *suggests* notes.

### Core Modules (`src/music-engine/`)

| Module | Purpose |
|--------|---------|
| `tonalField.ts` | Maps 2D cursor position to candidate pitches. X = tonal tension, Y = register. |
| `harmonicGravity.ts` | Weighted pitch selection biased toward stable tones (root > 5th > 3rd > tensions). |
| `voiceRelations.ts` | Derives secondary voices: parallel, contrary, interval-following, and drone. |
| `scheduler.ts` | BPM-based musical clock with quantization, lookahead, and swing. |
| `phraseMemory.ts` | Remembers gesture patterns and applies variation to avoid identical replay. |
| `constraintEngine.ts` | Combines all modules into a unified pipeline. |

### Tonal Field Math

The field is built from a **stability-ordered pitch class set**: `[0, 7, 5, 4, 3, 9, 2, 10, 8, 6, 11, 1]` where index 0 (root) is most stable and index 11 (minor 2nd) is most tense.

- **X-axis** controls how many pitch classes are active (x=0 → root+5th only; x=1 → all 12)
- **Y-axis** controls octave register (0=low, 1=high)
- **Harmonic gravity** uses weighted random selection: `weight = (1 - strength) + strength × gravityWeight(pc)`, where gravity weights range from 1.0 (root) to 0.1 (minor 2nd)
- **Phrase memory** detects repeating interval patterns and applies increasing variation with each replay

### Enabling

Click **"Tonal Field"** in the controls panel to switch from direct instrument mode to the tonal exploration mode. The canvas will show a visualization of harmonic stability zones.

## Roadmap

### MVP ✅
- Mouse → sound
- Diatonic and chromatic scales
- MIDI output
- Polyphonic synth with voice stealing
- Hold mode, Line/Improv modes

Acceptance criteria: App loads, mouse movement produces audio, MIDI sends notes.
Tests: mapping, voice stealing, MIDI adapter, render snapshot.

### Next
- More harmonic modes (pentatonic, blues, modes of major)
- Arpeggio engine
- Preset editor UI
- Visualizer (FFT waveform)

Acceptance criteria: User can select from 8+ scales, arpeggio patterns configurable.
Tests: all new scale mappings, arpeggio step logic.

### Future
- DAW sync via Web MIDI clock
- Multi-user collaboration (WebRTC)
- VST/AU plugin integration
- Ableton Link support

Acceptance criteria: DAW tempo sync within 1ms, multi-user latency < 100ms.
Tests: timing accuracy tests, connection resilience tests.

## License

MIT
