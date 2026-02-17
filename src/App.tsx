import { useState, useEffect, useRef, lazy } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { LoadingScreen, TransitionOverlay } from './components/transitions'
import { TransitionProvider, useTransition } from './components/transitions/TransitionContext'
import PageContent from './components/transitions/PageContent'
import CookieBanner from './components/ui/CookieBanner'
import { initializeCookieManager } from './helpers/cookieManager'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import './App.css'
import { applyPageMeta, type PageMetaConfig } from './helpers/pageMeta'

// Lazy load route components
const Home = lazy(() => import('./home').then(module => ({ default: module.Home })))
const AboutPage = lazy(() => import('./about/page'))
const JoinPage = lazy(() => import('./join/page'))
const EventsPage = lazy(() => import('./events/page'))
const PrivacyPolicyPage = lazy(() => import('./privacy-policy/page'))
const CookiesPage = lazy(() => import('./cookies/page'))
const NotFoundPage = lazy(() => import('./not-found/page'))

/** Derives overlay isActive/mode from the transition phase */
function AppLevelOverlay() {
  const { phase, revealMaxDelayMs } = useTransition()

  const isActive = phase === 'covering' || phase === 'covered' || phase === 'revealing'
  const mode = phase === 'revealing' ? 'in' as const : 'out' as const
  // Pass home-specific longer stagger only during the reveal phase
  const maxDelayMs = mode === 'in' && revealMaxDelayMs !== undefined ? revealMaxDelayMs : undefined

  return <TransitionOverlay isActive={isActive} mode={mode} maxDelayMs={maxDelayMs} />
}

function AppContent() {
  const location = useLocation()
  const { navigateWithTransition } = useTransition()
  const isInitialMount = useRef(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audio2Ref = useRef<HTMLAudioElement | null>(null) // Second audio track
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const audio2SourceRef = useRef<MediaElementAudioSourceNode | null>(null) // Second audio source
  const lowPassFilterRef = useRef<BiquadFilterNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const gain2NodeRef = useRef<GainNode | null>(null) // Separate gain for second track
  const previousPathnameRef = useRef<string>(location.pathname)
  // Restore user's audio preference from localStorage
  const getInitialMutedState = () => {
    try {
      const saved = localStorage.getItem('fh_audio_muted')
      return saved === 'true'
    } catch {
      return false
    }
  }
  const isUserMutedRef = useRef(getInitialMutedState())
  const [isReturnVisit, setIsReturnVisit] = useState(() => {
    return sessionStorage.getItem('hasVisitedMap') === 'true'
  })
  const [hasMounted, setHasMounted] = useState(false)
  const [audioReady, setAudioReady] = useState(false)
  const pageMetaRef = useRef<Record<string, PageMetaConfig>>({
    '/': {
      title: 'Founders House — Helsinki',
      description: 'Built for the obsessed. Built for the exceptional. A premium community space in Helsinki for ambitious founders.',
      path: '/'
    },
    '/home': {
      title: 'Home — Founders House',
      description: 'Founders House in Helsinki — built for the obsessed, built for the exceptional.',
      path: '/home'
    },
    '/about': {
      title: 'About — Founders House',
      description: 'Meet the mission, team, and vision behind Founders House in Helsinki.',
      path: '/about'
    },
    '/join': {
      title: 'Join — Founders House',
      description: 'Apply to become part of Founders House — a premium community space for ambitious founders in Helsinki.',
      path: '/join'
    },
    '/events': {
      title: 'Events — Founders House',
      description: 'Curated founder events in Helsinki. Learn what is next and how to join.',
      path: '/events'
    },    '/privacy-policy': {
      title: 'Privacy Policy — Founders House',
      description: 'Our commitment to protecting your personal data and privacy.',
      path: '/privacy-policy'
    },
    '/cookies': {
      title: 'Cookie Settings — Founders House',
      description: 'Manage your cookie preferences and learn about how we use cookies.',
      path: '/cookies'
    },    '*': {
      title: '404 — Founders House',
      description: 'We could not find that page.',
      path: '*',
      robots: 'noindex,follow'
    }
  })

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
    const baseMeta = pageMetaRef.current[location.pathname] ?? pageMetaRef.current['*']
    const meta = baseMeta.path === '*' ? { ...baseMeta, path: location.pathname } : baseMeta
    applyPageMeta(meta)
  }, [location.pathname])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    sessionStorage.setItem('scrollProgress', scrollProgress.toString());
  }, [scrollProgress]);

  useEffect(() => {
    setHasMounted(true)

    // Initialize cookie manager
    initializeCookieManager()

    // Set up audio context after component mounts
    if (audioRef.current && audio2Ref.current) {
      setAudioReady(true)
    }
  }, [])

  // Setup audio filter chain when audio is initialized
  useEffect(() => {
    console.log('🔍 Audio setup check:', {
      hasAudioElement: !!audioRef.current,
      hasAudioContext: !!audioContextRef.current,
      audioReady
    })

    if (audioReady && audioRef.current && audio2Ref.current && !audioContextRef.current) {
      try {
        console.log('🎵 Setting up audio filter chain...')

        // Create audio context
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()

        // === TRACK 1: Main music with low-pass filter ===
        audioSourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current)

        // Create low pass filter for music
        lowPassFilterRef.current = audioContextRef.current.createBiquadFilter()
        lowPassFilterRef.current.type = 'lowpass'
        lowPassFilterRef.current.frequency.value = 22000 // Start with no filtering (above human hearing)
        lowPassFilterRef.current.Q.value = 1

        // Create gain node for music
        gainNodeRef.current = audioContextRef.current.createGain()
        // Initialize gain based on user's saved preference
        // If not muted, set to target volumes; if muted, start at 0
        const initialMusicGain = isUserMutedRef.current ? 0 : 0.5
        gainNodeRef.current.gain.value = initialMusicGain

        // Connect: source -> filter -> gain -> destination
        audioSourceRef.current.connect(lowPassFilterRef.current)
        lowPassFilterRef.current.connect(gainNodeRef.current)
        gainNodeRef.current.connect(audioContextRef.current.destination)

        // === TRACK 2: Ambience with volume control only ===
        audio2SourceRef.current = audioContextRef.current.createMediaElementSource(audio2Ref.current)

        // Create gain node for ambience (no filter)
        gain2NodeRef.current = audioContextRef.current.createGain()
        // Initialize gain based on user's saved preference and current page
        const isMapPage = location.pathname === '/'
        const initialAmbienceGain = isUserMutedRef.current ? 0 : (isMapPage ? 0.5 : 0)
        gain2NodeRef.current.gain.value = initialAmbienceGain

        // Connect: source -> gain -> destination (no filter)
        audio2SourceRef.current.connect(gain2NodeRef.current)
        gain2NodeRef.current.connect(audioContextRef.current.destination)

        console.log('✅ Audio filter chain initialized successfully', {
          contextState: audioContextRef.current.state,
          sampleRate: audioContextRef.current.sampleRate
        })

        // Expose gain nodes and mute state to window for NavBar access
        ;(window as any).__gainNodeRef = gainNodeRef
        ;(window as any).__gain2NodeRef = gain2NodeRef
        ;(window as any).__isUserMutedRef = isUserMutedRef
        ;(window as any).__audioContext = audioContextRef.current

        // Resume audio context if it's suspended (required in some browsers)
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().then(() => {
            console.log('✅ AudioContext resumed')
          })
        }

        // Store reference globally for LoadingScreen to access
        (window as any).__audioContext = audioContextRef.current
      } catch (err) {
        console.error('❌ Failed to setup audio context:', err)
      }
    }
  }, [audioReady])

  // Control low pass filter and ambience volume based on route
  useEffect(() => {
    const isMapPage = location.pathname === '/' // Only map page has no filter
    const wasMapPage = previousPathnameRef.current === '/'
    const goingToMap = isMapPage && !wasMapPage // Navigating TO map page

    // Use longer transition time when going TO map page for smoother effect
    const timeConstant = goingToMap ? 2.5 : 1.5

    // === TRACK 1: Low-pass filter for music ===
    if (lowPassFilterRef.current && audioContextRef.current) {
      const targetFrequency = isMapPage ? 22000 : 200 // No filter on map, 200Hz on other pages

      lowPassFilterRef.current.frequency.setTargetAtTime(
        targetFrequency,
        audioContextRef.current.currentTime,
        timeConstant
      )
      console.log(`🎵 Music filter ${isMapPage ? 'disabled' : 'enabled (200Hz)'} for ${location.pathname} (transition: ${timeConstant}s)`)
    }

    // === TRACK 2: Volume control for ambience (no pause/play, just volume fade) ===
    // Only adjust ambience if user hasn't manually muted
    if (gain2NodeRef.current && audioContextRef.current && audio2Ref.current && !isUserMutedRef.current) {
      const targetVolume = isMapPage ? 0.5 : 0 // 0.5 on map page, 0 on other pages

      gain2NodeRef.current.gain.setTargetAtTime(
        targetVolume,
        audioContextRef.current.currentTime,
        timeConstant
      )

      console.log(`🌊 Ambience ${isMapPage ? 'enabled (0.5)' : 'muted (0)'} for ${location.pathname} (transition: ${timeConstant}s)`)
    }

    // Update previous pathname
    previousPathnameRef.current = location.pathname
  }, [location.pathname])


  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 0.9,
      syncTouch: true,
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
    navigateWithTransition('/home')
  }

  useEffect(() => {
    ;(window as any).navigateToLearnMore = handleLearnMoreClick

    return () => {
      delete (window as any).navigateToLearnMore
    }
  }, [navigateWithTransition])

  return (
    <div className="App">
      {/* Audio elements - Ambient Soundscape */}
      <audio ref={audioRef} loop preload="auto">
        <source src="/assets/audio/background-music.mp3" type="audio/mpeg" />
      </audio>

      {/* Second audio track - Ambient City Soundscape */}
      <audio ref={audio2Ref} loop preload="auto">
        <source src="/assets/audio/background-sounds.mp3" type="audio/mpeg" />
      </audio>

      <Routes>
        <Route
          path="/"
          element={
            <PageContent skipFadeIn>
              <LoadingScreen
                onComplete={() => {
                  sessionStorage.setItem('hasVisitedMap', 'true')
                }}
                duration={6000}
                scrollProgress={scrollProgress}
                onScrollProgressChange={setScrollProgress}
                isReturnVisit={isReturnVisit}
                audioRef={audioRef}
                audio2Ref={audio2Ref}
              />
            </PageContent>
          }
        />
        <Route path="/home" element={<PageContent><Home audioRef={audioRef} audio2Ref={audio2Ref} /></PageContent>} />
        <Route path="/about" element={<PageContent><AboutPage audioRef={audioRef} audio2Ref={audio2Ref} /></PageContent>} />
        <Route path="/join" element={<PageContent><JoinPage audioRef={audioRef} audio2Ref={audio2Ref} /></PageContent>} />
        <Route path="/events" element={<PageContent><EventsPage audioRef={audioRef} audio2Ref={audio2Ref} /></PageContent>} />
        <Route path="/privacy-policy" element={<PageContent><PrivacyPolicyPage /></PageContent>} />
        <Route path="/cookies" element={<PageContent><CookiesPage /></PageContent>} />
        <Route path="*" element={<PageContent><NotFoundPage /></PageContent>} />
      </Routes>

      <AppLevelOverlay />
      <CookieBanner />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <TransitionProvider>
        <AppContent />
      </TransitionProvider>
    </BrowserRouter>
  )
}

export default App
