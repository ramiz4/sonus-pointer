export interface MidiOutput {
  id: string
  name: string
  send: (data: number[]) => void
}

export class MidiAdapter {
  private outputs: MidiOutput[] = []
  private active: MidiOutput | null = null
  private available = false

  async connect(): Promise<boolean> {
    if (!navigator.requestMIDIAccess) return false
    try {
      const access = await navigator.requestMIDIAccess()
      this.available = true
      this.outputs = []
      access.outputs.forEach((output) => {
        this.outputs.push({
          id: output.id,
          name: output.name ?? output.id,
          send: (data) => output.send(data),
        })
      })
      if (this.outputs.length > 0) {
        this.active = this.outputs[0]
      }
      return true
    } catch {
      return false
    }
  }

  getOutputs(): MidiOutput[] {
    return this.outputs
  }

  selectOutput(id: string): void {
    this.active = this.outputs.find((o) => o.id === id) ?? null
  }

  noteOn(channel: number, note: number, velocity: number): void {
    if (!this.active) return
    this.active.send([0x90 | (channel & 0x0f), note & 0x7f, velocity & 0x7f])
  }

  noteOff(channel: number, note: number): void {
    if (!this.active) return
    this.active.send([0x80 | (channel & 0x0f), note & 0x7f, 0])
  }

  isAvailable(): boolean {
    return this.available
  }
}
