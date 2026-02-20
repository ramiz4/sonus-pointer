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
