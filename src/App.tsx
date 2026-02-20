import React, { useEffect } from 'react'
import Canvas from './components/Canvas'
import Controls from './components/Controls'
import { useStore } from './store'

const App: React.FC = () => {
  const { toggleHold, shiftOctave } = useStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        toggleHold()
      } else if (e.code === 'ArrowUp') {
        e.preventDefault()
        shiftOctave(1)
      } else if (e.code === 'ArrowDown') {
        e.preventDefault()
        shiftOctave(-1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleHold, shiftOctave])

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4 sm:gap-6 p-3 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">sonus-pointer</h1>
      <p className="text-gray-400 text-xs sm:text-sm text-center px-2">
        Touch or move mouse · Space = Hold · ↑↓ = Octave
      </p>
      <div className="w-full max-w-3xl flex flex-col gap-3 sm:gap-4">
        <Canvas />
        <Controls />
      </div>
    </div>
  )
}

export default App
