import {
  tickDurationMs,
  quantize,
  nextGridTime,
  beatIndex,
  applySwing,
  MusicalClock,
} from '../music-engine/scheduler'

describe('Scheduler', () => {
  describe('tickDurationMs', () => {
    it('120 BPM quarter notes = 500ms', () => {
      expect(tickDurationMs(120, 1)).toBe(500)
    })

    it('120 BPM eighth notes = 250ms', () => {
      expect(tickDurationMs(120, 2)).toBe(250)
    })

    it('60 BPM quarter notes = 1000ms', () => {
      expect(tickDurationMs(60, 1)).toBe(1000)
    })
  })

  describe('quantize', () => {
    it('snaps to nearest grid position', () => {
      // 120 BPM, quarter notes (500ms ticks), start at 0
      expect(quantize(260, 120, 1)).toBe(500) // closer to 500 than 0
      expect(quantize(240, 120, 1)).toBe(0) // closer to 0 than 500
    })

    it('exact grid time stays unchanged', () => {
      expect(quantize(1000, 120, 1)).toBe(1000)
    })

    it('respects start time offset', () => {
      expect(quantize(1260, 120, 1, 1000)).toBe(1500) // 260ms after start → snap to 500
    })
  })

  describe('nextGridTime', () => {
    it('returns next grid time at or after input', () => {
      expect(nextGridTime(100, 120, 1)).toBe(500) // first beat after 100ms
    })

    it('returns same time if on grid', () => {
      expect(nextGridTime(500, 120, 1)).toBe(500)
    })

    it('handles sub-millisecond timing', () => {
      expect(nextGridTime(500.1, 120, 1)).toBe(1000)
    })
  })

  describe('beatIndex', () => {
    it('returns 0 for first beat', () => {
      expect(beatIndex(0, 120)).toBe(0)
    })

    it('returns correct beat for later times', () => {
      expect(beatIndex(1500, 120)).toBe(3) // 1500 / 500 = 3
    })
  })

  describe('applySwing', () => {
    it('does not modify on-beat times', () => {
      // Tick 0 (on-beat) at 120 BPM, eighth notes
      expect(applySwing(0, 120, 2, 0.3)).toBe(0)
    })

    it('shifts off-beat ticks forward', () => {
      // Tick 1 (off-beat) at 120 BPM, eighth notes (250ms tick)
      const result = applySwing(250, 120, 2, 0.3)
      expect(result).toBeGreaterThan(250)
      expect(result).toBe(250 + 250 * 0.3) // 325ms
    })

    it('zero swing has no effect', () => {
      expect(applySwing(250, 120, 2, 0)).toBe(250)
    })
  })

  describe('MusicalClock', () => {
    it('emits beat events when advanced', () => {
      const clock = new MusicalClock({ bpm: 120, subdivision: 1, lookaheadMs: 0, swingAmount: 0 })
      const events = clock.advance(600) // past first beat at 500ms
      expect(events.length).toBe(2) // beat at 0ms and 500ms
      expect(events[0].beatIndex).toBe(0)
      expect(events[1].beatIndex).toBe(1)
    })

    it('does not re-emit processed beats', () => {
      const clock = new MusicalClock({ bpm: 120, subdivision: 1, lookaheadMs: 0, swingAmount: 0 })
      clock.advance(600)
      const events2 = clock.advance(600) // same time, no new beats
      expect(events2).toHaveLength(0)
    })

    it('scheduler timing is stable across advances', () => {
      const clock = new MusicalClock({ bpm: 120, subdivision: 2, lookaheadMs: 0, swingAmount: 0 })
      const allEvents: Array<{ beatTime: number }> = []
      // Advance in 50ms increments
      for (let t = 0; t <= 1000; t += 50) {
        allEvents.push(...clock.advance(t))
      }
      // At 120BPM, subdivision 2 → 250ms ticks → should have 5 events (0,250,500,750,1000)
      expect(allEvents).toHaveLength(5)
      for (let i = 0; i < allEvents.length; i++) {
        expect(allEvents[i].beatTime).toBeCloseTo(i * 250)
      }
    })

    it('respects lookahead', () => {
      const clock = new MusicalClock({
        bpm: 120,
        subdivision: 1,
        lookaheadMs: 100,
        swingAmount: 0,
      })
      // At t=400 with 100ms lookahead, we look at 500ms → should see beat at 500
      const events = clock.advance(400)
      expect(events.length).toBe(2) // beat at 0 and 500
    })

    it('reset clears state', () => {
      const clock = new MusicalClock({ bpm: 120, subdivision: 1, lookaheadMs: 0, swingAmount: 0 })
      clock.advance(600)
      clock.reset(1000)
      const events = clock.advance(1600)
      expect(events[0].beatTime).toBe(1000)
    })

    it('setBpm changes tempo', () => {
      const clock = new MusicalClock({ bpm: 60, subdivision: 1, lookaheadMs: 0, swingAmount: 0 })
      clock.setBpm(120)
      expect(clock.getBpm()).toBe(120)
    })
  })
})
