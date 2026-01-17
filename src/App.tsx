import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { LoadingScreen } from './components/LoadingScreen'
import { Home } from './components/home'
import { TransitionOverlay } from './components/transition'
import AboutPage from './about/page'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import './App.css'

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const isInitialMount = useRef(true)
  const [isTransitionActive, setIsTransitionActive] = useState(false)
  const [isReturnVisit, setIsReturnVisit] = useState(false)

  const [scrollProgress, setScrollProgress] = useState(() => {
    if (performance.navigation.type !== 1) {
      const saved = sessionStorage.getItem('scrollProgress');
      return saved ? parseFloat(saved) : 0;
    }
    sessionStorage.removeItem('scrollProgress');
    sessionStorage.removeItem('animationStage');
    return 0;
  });

  // Check if this is a return visit whenever we navigate to '/'
  useEffect(() => {
    if (location.pathname === '/') {
      const hasVisited = sessionStorage.getItem('hasVisitedMap') === 'true'
      setIsReturnVisit(hasVisited)
    }
  }, [location.pathname])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    sessionStorage.setItem('scrollProgress', scrollProgress.toString());
  }, [scrollProgress]);

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

  const handleLearnMoreClick = () => {
    sessionStorage.setItem('transitioningToLearnMore', 'true')
    sessionStorage.setItem('skipIntro', 'true')
    sessionStorage.setItem('hasVisitedMap', 'true')
    navigate('/home')
  }

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
              onComplete={() => {
                sessionStorage.setItem('hasVisitedMap', 'true')
              }}
              duration={6000}
              scrollProgress={scrollProgress}
              onScrollProgressChange={setScrollProgress}
              isReturnVisit={isReturnVisit}
            />} />
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>

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
