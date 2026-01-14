import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { LoadingScreen } from './components/LoadingScreen'
import { LearnMore } from './components/learn-more'
import { TransitionOverlay } from './components/transition'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import './App.css'

// Wrapper component to handle navigation logic
function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const isInitialMount = useRef(true)

  // Transition state lifted to App level so it persists across route changes
  const [isTransitionActive, setIsTransitionActive] = useState(false)

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

  // Save scroll progress to sessionStorage whenever it changes
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
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
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
  }, [location.pathname])

  // Handle navigation from map to learn more page
  const handleLearnMoreClick = () => {
    sessionStorage.setItem('transitioningToLearnMore', 'true')

    // Navigate immediately - timing is now controlled by HelsinkiViewer's callback
    navigate('/home')
    // Keep the flag so learn more page knows it came from transition
    // It will be cleared after learn more page mounts
  }

  // Expose transition controls globally for HelsinkiViewer to use
  useEffect(() => {
    ;(window as any).navigateToLearnMore = handleLearnMoreClick
    ;(window as any).setTransitionActive = setIsTransitionActive

    return () => {
      delete (window as any).navigateToLearnMore
      delete (window as any).setTransitionActive
    }
  }, [navigate])

  return (
    <div className="App">
      <Routes location={location}>
        <Route path="/" element={<LoadingScreen
              onComplete={() => {}}
              duration={6000}
              scrollProgress={scrollProgress}
              onScrollProgressChange={setScrollProgress}
            />} />
        <Route path="/home" element={<LearnMore />} />
      </Routes>

      {/* Transition overlay persists across route changes */}
      <TransitionOverlay isActive={isTransitionActive} />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App

