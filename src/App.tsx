import { useState } from 'react'
import HelsinkiViewer from './components/HelsinkiViewer'
import { LoadingScreen } from './components/LoadingScreen'
import './App.css'

type AppPhase = 'loading' | 'map'

function App() {
  const [phase, setPhase] = useState<AppPhase>('loading')

  return (
    <div className="App">
      <div
        className={phase === 'map' ? 'map-visible' : 'map-hidden'}
        style={{
          pointerEvents: phase === 'map' ? 'auto' : 'none'
        }}
      >
        <HelsinkiViewer />
      </div>

      {phase === 'loading' && (
        <LoadingScreen onComplete={() => setPhase('map')} duration={3500} />
      )}
    </div>
  )
}

export default App
