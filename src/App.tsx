import { useState, useEffect, useRef } from 'react'
import { LoadingScreen } from './components/LoadingScreen'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
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

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

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
