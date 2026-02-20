import '@testing-library/jest-dom'

// Mock ResizeObserver for jsdom
class MockResizeObserver {
  observe = jest.fn()
  unobserve = jest.fn()
  disconnect = jest.fn()
}
;(globalThis as unknown as Record<string, unknown>).ResizeObserver =
  MockResizeObserver as unknown as typeof ResizeObserver

// Mock AudioContext for all tests
class MockAudioContext {
  createGain() {
    return {
      connect: jest.fn(),
      gain: {
        value: 0,
        setTargetAtTime: jest.fn(),
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
        cancelScheduledValues: jest.fn(),
      },
    }
  }
  createOscillator() {
    return {
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      type: 'sine' as OscillatorType,
      frequency: { value: 0 },
    }
  }
  get currentTime() {
    return 0
  }
  get destination() {
    return {}
  }
  resume() {
    return Promise.resolve()
  }
  close() {
    return Promise.resolve()
  }
}

;(globalThis as unknown as Record<string, unknown>).AudioContext =
  MockAudioContext as unknown as typeof AudioContext
