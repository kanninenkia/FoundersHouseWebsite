import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { LoadingScreen } from './components/LoadingScreen'
import { TransitionOverlay } from './components/transition'
import PageTransition from './components/PageTransition'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import './App.css'
import NoiseLayer from './components/NoiseLayer'
import { AnimatePresence } from 'framer-motion'

// Lazy load route components
const Home = lazy(() => import('./components/home').then(module => ({ default: module.Home })))
const AboutPage = lazy(() => import('./about/page'))
const JoinPage = lazy(() => import('./join/page'))
const EventsPage = lazy(() => import('./events/page'))

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
      <NoiseLayer />
      <Suspense fallback={<div style={{ background: '#590D0F', width: '100vw', height: '100vh' }} />}>
        <AnimatePresence mode="sync">
          <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LoadingScreen
                onComplete={() => {
                  sessionStorage.setItem('hasVisitedMap', 'true')
                }}
                duration={6000}
                scrollProgress={scrollProgress}
                onScrollProgressChange={setScrollProgress}
                isReturnVisit={isReturnVisit}
              />} />
            <Route path="/home" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
            <Route path="/join" element={<PageTransition><JoinPage /></PageTransition>} />
            <Route path="/events" element={<PageTransition><EventsPage /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </Suspense>

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
