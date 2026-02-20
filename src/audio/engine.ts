export interface Voice {
  id: string
  noteNumber: number
  oscillator: OscillatorNode
  gainNode: GainNode
  startTime: number
}

export interface SynthSettings {
  attack: number
  decay: number
  sustain: number
  release: number
  waveform: OscillatorType
}

const DEFAULT_SETTINGS: SynthSettings = {
  attack: 0.01,
  decay: 0.1,
  sustain: 0.8,
  release: 0.3,
  waveform: 'sine',
}

export class AudioEngine {
  private context: AudioContext
  private masterGain: GainNode
  private voices: Map<string, Voice> = new Map()
  private maxVoices: number
  private settings: SynthSettings

  constructor(maxVoices = 4, settings: Partial<SynthSettings> = {}) {
    this.context = new AudioContext()
    this.masterGain = this.context.createGain()
    this.masterGain.connect(this.context.destination)
    this.masterGain.gain.value = 0.7
    this.maxVoices = maxVoices
    this.settings = { ...DEFAULT_SETTINGS, ...settings }
  }

  setVolume(value: number): void {
    this.masterGain.gain.setTargetAtTime(value, this.context.currentTime, 0.01)
  }

  setMaxVoices(n: number): void {
    this.maxVoices = n
  }

  noteOn(id: string, noteNumber: number, velocity = 100): void {
    if (this.voices.has(id)) {
      this.noteOff(id)
    }
    // Voice stealing
    if (this.voices.size >= this.maxVoices) {
      const oldest = [...this.voices.entries()].sort(
        ([, a], [, b]) => a.startTime - b.startTime
      )[0]
      if (oldest) this.noteOff(oldest[0])
    }

    const freq = 440 * Math.pow(2, (noteNumber - 69) / 12)
    const osc = this.context.createOscillator()
    const gain = this.context.createGain()
    osc.type = this.settings.waveform
    osc.frequency.value = freq
    osc.connect(gain)
    gain.connect(this.masterGain)

    const now = this.context.currentTime
    const vel = velocity / 127
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(vel, now + this.settings.attack)
    gain.gain.linearRampToValueAtTime(
      vel * this.settings.sustain,
      now + this.settings.attack + this.settings.decay
    )
    osc.start(now)

    this.voices.set(id, {
      id,
      noteNumber,
      oscillator: osc,
      gainNode: gain,
      startTime: now,
    })
  }

  noteOff(id: string): void {
    const voice = this.voices.get(id)
    if (!voice) return
    const now = this.context.currentTime
    voice.gainNode.gain.cancelScheduledValues(now)
    voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now)
    voice.gainNode.gain.linearRampToValueAtTime(0, now + this.settings.release)
    voice.oscillator.stop(now + this.settings.release + 0.01)
    this.voices.delete(id)
  }

  noteOffAll(): void {
    for (const id of this.voices.keys()) {
      this.noteOff(id)
    }
  }

  getActiveVoiceCount(): number {
    return this.voices.size
  }

  resume(): Promise<void> {
    return this.context.resume()
  }

  close(): Promise<void> {
    return this.context.close()
  }
}
