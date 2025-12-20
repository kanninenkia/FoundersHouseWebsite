import { useState, useEffect, useRef } from 'react'
import { LoadingScreen } from './components/LoadingScreen'
import './App.css'

function App() {
  const isInitialMount = useRef(true)

  // Persist scroll progress across tab switches, but NOT on page reload
  const [scrollProgress, setScrollProgress] = useState(() => {
    // Only restore from sessionStorage if this is NOT a page reload
    if (performance.navigation.type !== 1) { // 1 = TYPE_RELOAD
      const saved = sessionStorage.getItem('scrollProgress')
      return saved ? parseFloat(saved) : 0
    }
    // Clear sessionStorage on reload
    sessionStorage.removeItem('scrollProgress')
    sessionStorage.removeItem('animationStage')
    return 0
  })

  // Save scroll progress to sessionStorage whenever it changes (but not on initial mount if it's a reload)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    sessionStorage.setItem('scrollProgress', scrollProgress.toString())
  }, [scrollProgress])

  return (
    <div className="App">
      <LoadingScreen
        onComplete={() => {}}
        duration={6000}
        scrollProgress={scrollProgress}
        onScrollProgressChange={setScrollProgress}
      />
    </div>
  )
}

export default App
