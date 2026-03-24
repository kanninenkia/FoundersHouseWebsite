/**
 * Helsinki 3D Viewer Component
 * React + TypeScript component with Three.js - displays 3D Helsinki map with baked textures
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import FloatingParticlesOverlay from './FloatingParticlesOverlay'
import { HelsinkiScene } from '../../core'
import { motion } from 'framer-motion'
import type { PointOfInterest } from '../../constants/poi'
import { POINTS_OF_INTEREST } from '../../constants/poi'
import { POINavigator } from './POINavigator'
import POILayer from './POILayer'
import { POIInfoBox } from './POIInfoBox'
import { Button } from '../ui'
import { NavBar } from '../layout'
import { useTransition } from '../transitions/TransitionContext'
import './HelsinkiViewer.css'
import './HelsinkiViewerMobile.css'
import ParallaxMotion from '../../effects/ParallaxMotion'

interface MapLoadingState {
  isLoaded: boolean
  progress: number
}

interface HelsinkiViewerProps {
  shouldLoad?: boolean
  shouldPause?: boolean
  scrollProgress?: number
  onMapLoadingChange?: (state: MapLoadingState) => void
  showUI?: boolean
  staticMode?: boolean; // disables drag/zoom/pan, enables only mouse-move camera
  environmentColor?: string; // custom background/environment color
  audioRef?: React.MutableRefObject<HTMLAudioElement | null>
  audio2Ref?: React.MutableRefObject<HTMLAudioElement | null>
}

export const HelsinkiViewer = ({
  shouldLoad = true,
  shouldPause = false,
  scrollProgress = 0,
  onMapLoadingChange,
  staticMode = false,
  environmentColor,
  audioRef,
  audio2Ref,
}: HelsinkiViewerProps) => {
  const { navigateWithTransition } = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)

  const sceneRef = useRef<HelsinkiScene | null>(null)
  const animationFrameRef = useRef<number>(0)
  const tickerStartTimeRef = useRef<number>(Date.now())
  // CHROME FIX: Add frame time smoothing for consistent frame pacing
  const lastFrameTimeRef = useRef<number>(performance.now())
  const frameTimesRef = useRef<number[]>([16.67, 16.67, 16.67]) // Rolling average

  const [status, setStatus] = useState<string>('Initializing...')
  const [loading, setLoading] = useState<boolean>(true)
  const [tickerProgress, setTickerProgress] = useState<number>(0)
  const [modelLoaded, setModelLoaded] = useState<boolean>(false)
  const [grayscaleAmount, setGrayscaleAmount] = useState<number>(75)
  const [heroTextOpacity, setHeroTextOpacity] = useState<number>(1)
  const [showHeroText, setShowHeroText] = useState(false)
  const [showUIState, setShowUIState] = useState(false)
  const fadeTimers = useRef<{ hero?: NodeJS.Timeout; ui?: NodeJS.Timeout }>({})
  const [isCameraFlying, setIsCameraFlying] = useState(false)
  const [isHeroFadingOut, setIsHeroFadingOut] = useState(false)
  const [showNavBar, setShowNavBar] = useState(false)
  const [showCustomCursor, setShowCustomCursor] = useState(false)
    // Track animation paused state
    const animationPausedRef = useRef<boolean>(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isMenuOpenRef = useRef<boolean>(false)
  const lastInteractionTime = useRef<number>(Date.now())
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const targetCursorPosition = useRef({ x: 0, y: 0 })
  const [showDragIndicator, setShowDragIndicator] = useState(true)
  const [activePOIKey, setActivePOIKey] = useState<string | null>('FOUNDERS_HOUSE')
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [selectedPOIInfo, setSelectedPOIInfo] = useState<PointOfInterest | null>(null)
  const poiInfoBoxRef = useRef<HTMLDivElement>(null)

  const [showExploreHint, setShowExploreHint] = useState(false)
  const hintDismissedRef = useRef(false)

  const hasInteractedRef = useRef(false)
  const [isTransitionActive, setIsTransitionActive] = useState(false)
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false)
  const hoveringInteractiveRef = useRef(false)

  // On mobile: kill the rAF loop as soon as transition fires so iOS Safari's
  // event loop isn't saturated and React's scheduler can process state updates
  useEffect(() => {
    if (isTransitionActive && window.innerWidth <= 1024) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = 0
      }
    }
  }, [isTransitionActive])

  const handleLearnMoreClick = useCallback((event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.()

    if (isTransitionActive) return

    setIsTransitionActive(true)

    const isMobile = window.innerWidth <= 1024

    // Cancel the rAF loop immediately on mobile. The isTransitionActive useEffect that
    // normally does this never fires because React 18 batches setIsTransitionActive(true)
    // and setIsTransitionActive(false) from the same click handler into one render,
    // so the effect never sees the true value.
    if (isMobile && animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = 0
    }

    const doNavigate = () => {
      sessionStorage.setItem('transitioningToLearnMore', 'true')
      sessionStorage.setItem('skipIntro', 'true')
      sessionStorage.setItem('hasVisitedMap', 'true')
      navigateWithTransition('/home')
      setIsTransitionActive(false)
    }

    setIsHeroFadingOut(true)

    if (sceneRef.current && !isMobile) {
      // Desktop: play 3D camera zoom into Founders House, then navigate
      sceneRef.current.zoomToFoundersHouse(doNavigate)
    } else {
      // Mobile: skip the 3D zoom and navigate directly — pixel transition still plays
      doNavigate()
    }
  }, [isTransitionActive, navigateWithTransition])

  // Sync menu state to ref so animate function can access it without recreating scene
  useEffect(() => {
    isMenuOpenRef.current = isMenuOpen
  }, [isMenuOpen])

  useEffect(() => {
    // Don't attach mousemove listener when menu is open
    if (isMenuOpen) return;

    const handleMouseMove = (e: MouseEvent) => {
       targetCursorPosition.current = { x: e.clientX, y: e.clientY }
      const target = document.elementFromPoint(e.clientX, e.clientY)
      const isInteractive = !!target?.closest(
        'a, button, .clickable, .navbar, .navbar-hamburger, .navbar-logo-container, .poi-navigator-wrapper, .full-screen-menu, .poi-info-box'
      )
      if (isInteractive !== hoveringInteractiveRef.current) {
        hoveringInteractiveRef.current = isInteractive
        setIsHoveringInteractive(isInteractive)
      }
      // Update mousePos for parallax (only on desktop)
      if (window.innerWidth > 1024) {
        const { innerWidth, innerHeight } = window
        const x = (e.clientX / innerWidth) * 2 - 1
        const y = (e.clientY / innerHeight) * 2 - 1
        setMousePos({ x, y })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isMenuOpen])


  useEffect(() => {
    // Don't run cursor smoothing when menu is open OR on mobile (performance)
    const isMobile = window.innerWidth <= 1024;
    if (isMenuOpen || isMobile) return;

    let animationFrameId: number

    const smoothCursor = () => {
      setCursorPosition(prev => {
        const dx = targetCursorPosition.current.x - prev.x
        const dy = targetCursorPosition.current.y - prev.y

        // Lerp factor - lower = smoother but slower, higher = faster but less smooth
        const lerp = 0.3

        return {
          x: prev.x + dx * lerp,
          y: prev.y + dy * lerp
        }
      })

      animationFrameId = requestAnimationFrame(smoothCursor)
    }

    animationFrameId = requestAnimationFrame(smoothCursor)

    return () => cancelAnimationFrame(animationFrameId)
  }, [isMenuOpen])


  useEffect(() => {
    if (scrollProgress >= 1) {
      setShowHeroText(false)
      setShowUIState(false)
      if (fadeTimers.current.hero) clearTimeout(fadeTimers.current.hero)
      fadeTimers.current.hero = setTimeout(() => {
        setShowHeroText(true)
      }, 800)
      setShowUIState(true)
      setTimeout(() => {
        setShowNavBar(true)
      }, 2500)
      // Delay custom cursor fade-in by 3.5 seconds (only on desktop)
      setTimeout(() => {
        // Only show custom cursor on desktop (width > 1024px)
        if (window.innerWidth > 1024) {
          setShowCustomCursor(true)
        }
      }, 3500)
    } else {
      setShowHeroText(false)
      setShowUIState(false)
      setShowNavBar(false)
      setShowCustomCursor(false)
      if (fadeTimers.current.hero) clearTimeout(fadeTimers.current.hero)
    }
    return () => {
      if (fadeTimers.current.hero) clearTimeout(fadeTimers.current.hero)
    }
  }, [scrollProgress])

  // Cycling explore hint: fade in after 5s, show for duration, hide, repeat
  useEffect(() => {
    if (!showUIState) {
      setShowExploreHint(false)
      return
    }

    hintDismissedRef.current = false
    const timeouts: ReturnType<typeof setTimeout>[] = []

    const cycle = (initialDelay: number) => {
      const t1 = setTimeout(() => {
        if (hintDismissedRef.current) return
        setShowExploreHint(true)
        const t2 = setTimeout(() => {
          setShowExploreHint(false)
          if (!hintDismissedRef.current) cycle(20000)
        }, 10000)
        timeouts.push(t2)
      }, initialDelay)
      timeouts.push(t1)
    }

    cycle(5000)

    return () => timeouts.forEach(clearTimeout)
  }, [showUIState])

  const isDemoNightMode = false

  const handleHeroTextOpacityChange = useCallback((opacity: number) => {
    setHeroTextOpacity(opacity)
  }, [])

  useEffect(() => {
    if (!containerRef.current || !shouldLoad || shouldPause) return

    if (sceneRef.current) {
      sceneRef.current.dispose()
      sceneRef.current = null
    }

    try {
      const scene = new HelsinkiScene({
        container: containerRef.current,
        helsinkiCenter: {
          lat: 60.1699,
          lng: 24.9384,
        },
        radius: 2, // 2km radius
        isNightMode: isDemoNightMode, // Use day mode by default
        onLoadProgress: (progress) => {
          setStatus(`Loading Helsinki 3D model... ${progress.toFixed(1)}%`)
          onMapLoadingChange?.({ isLoaded: false, progress })
        },
        onLoadComplete: () => {
          setModelLoaded(true)
          setStatus('Helsinki 3D - 2km radius')
          onMapLoadingChange?.({ isLoaded: true, progress: 100 })
        },
        staticMode,
        environmentColor,
        enableAutoCentering: scrollProgress >= 1,
        onHeroTextOpacityChange: handleHeroTextOpacityChange,
      })
      sceneRef.current = scene

      setStatus('Loading Helsinki 3D model...')

      const animate = (currentTime: number) => {
        if (sceneRef.current) {
          // Pause rendering when menu is open to improve performance
          if (!isMenuOpenRef.current) {
            // CHROME FIX: Always update, but track frame timing for smoothness
            const frameTime = currentTime - lastFrameTimeRef.current
            lastFrameTimeRef.current = currentTime

            // Add to rolling average (keeps last 3 frames)
            frameTimesRef.current.push(frameTime)
            if (frameTimesRef.current.length > 3) {
              frameTimesRef.current.shift()
            }

            // Always update - the scene's delta clamping handles spikes
            sceneRef.current.update()
          }

          animationFrameRef.current = requestAnimationFrame(animate)
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setStatus('Error: ' + message)
      setLoading(false)
    }

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = 0
      }
      if (sceneRef.current) {
        sceneRef.current.dispose()
        sceneRef.current = null
      }

      if (containerRef.current) {
        const canvases = containerRef.current.querySelectorAll('canvas')
        canvases.forEach(canvas => canvas.remove())
      }
    }
  }, [shouldLoad, shouldPause, isDemoNightMode])

  useEffect(() => {
    if (!sceneRef.current) return
    sceneRef.current.setParallaxEnabled(scrollProgress >= 1)
    sceneRef.current.setAutoCenteringEnabled(scrollProgress >= 1)
  }, [scrollProgress])

  useEffect(() => {
    let lastMouseX = 0
    let lastMouseY = 0

    const dismissHint = () => {
      if (!hintDismissedRef.current) {
        hintDismissedRef.current = true
        setShowExploreHint(false)
      }
    }

    const handleMouseInteraction = (event: MouseEvent) => {
      if (event.type === 'mousemove') {
        if (event.clientX === lastMouseX && event.clientY === lastMouseY) {
          return
        }
        lastMouseX = event.clientX
        lastMouseY = event.clientY
      } else {
        dismissHint()
      }

      lastInteractionTime.current = Date.now()

      if (!hasInteractedRef.current) {
        hasInteractedRef.current = true
        setShowDragIndicator(false)
      }
    }

    const handleTouchInteraction = () => {
      dismissHint()
      lastInteractionTime.current = Date.now()

      if (!hasInteractedRef.current) {
        hasInteractedRef.current = true
        setShowDragIndicator(false)
      }
    }

    const handleWheelInteraction = () => {
      dismissHint()
      lastInteractionTime.current = Date.now()

      if (!hasInteractedRef.current) {
        hasInteractedRef.current = true
        setShowDragIndicator(false)
      }
    }

    window.addEventListener('mousedown', handleMouseInteraction)
    window.addEventListener('mousemove', handleMouseInteraction)
    window.addEventListener('touchstart', handleTouchInteraction)
    window.addEventListener('touchmove', handleTouchInteraction)
    window.addEventListener('wheel', handleWheelInteraction)

    return () => {
      window.removeEventListener('mousedown', handleMouseInteraction)
      window.removeEventListener('mousemove', handleMouseInteraction)
      window.removeEventListener('touchstart', handleTouchInteraction)
      window.removeEventListener('touchmove', handleTouchInteraction)
      window.removeEventListener('wheel', handleWheelInteraction)
    }
  }, [])

  useEffect(() => {
    if (!showUIState) return;
    const handleWheel = (event: WheelEvent) => {
      setGrayscaleAmount(prev => {
        const change = event.deltaY > 0 ? -0.3 : 0.3
        const newAmount = Math.max(0, Math.min(75, prev + change))
        return newAmount
      })
    }

    window.addEventListener('wheel', handleWheel)
    return () => window.removeEventListener('wheel', handleWheel)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return;
    const canvas = containerRef.current.querySelector('canvas');
    if (canvas) {

    }
  }, [grayscaleAmount]);

  useEffect(() => {
    if (!loading) return

    const TICKER_DURATION = 2500
    const UPDATE_INTERVAL = 16

    const tick = () => {
      const elapsed = Date.now() - tickerStartTimeRef.current;
      const timeBasedProgress = Math.min((elapsed / TICKER_DURATION) * 100, 100);
      setTickerProgress((prev) => {
        const target = timeBasedProgress;
        const distance = target - prev;
        if (Math.abs(distance) < 0.1) return target;
        const increment = distance * 0.1;
        return prev + increment;
      });
    };

    const intervalId = setInterval(tick, UPDATE_INTERVAL)
    return () => clearInterval(intervalId)
  }, [loading])

  useEffect(() => {
    if (modelLoaded && tickerProgress >= 99) {
      const timer = setTimeout(() => {
        setLoading(false)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [modelLoaded, tickerProgress])

  useEffect(() => {
    const failsafeTimer = setTimeout(() => {
      if (loading) {
        setLoading(false)
        setModelLoaded(true)
      }
    }, 30000)

    return () => clearTimeout(failsafeTimer)
  }, [loading])

  // Click-outside and touch handler for POI info box
  useEffect(() => {
    if (!selectedPOIInfo) return

    const handleInteractionOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement

      // Check if interaction is outside the info box
      const isOutsideInfoBox = poiInfoBoxRef.current && !poiInfoBoxRef.current.contains(target)

      // Check if interaction is on a POI button (allow POI clicks to handle themselves)
      const isOnPOIButton = target.closest('.poi-item, .poi-fan-item, .poi-fan-lead, .poi-layer-item')

      if (isOutsideInfoBox && !isOnPOIButton) {
        setSelectedPOIInfo(null)
      }
    }

    // Add listener after a short delay to prevent immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleInteractionOutside)
      document.addEventListener('touchstart', handleInteractionOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleInteractionOutside)
      document.removeEventListener('touchstart', handleInteractionOutside)
    }
  }, [selectedPOIInfo])

  const handlePOISelect = (poi: PointOfInterest) => {
    if (sceneRef.current && (sceneRef.current as any).focusPOI) {
      const poiKey = Object.entries(POINTS_OF_INTEREST).find(
        ([_, poiObj]) => poiObj.id === poi.id
      )?.[0]

      if (poiKey) {
        setActivePOIKey(poiKey)
        setIsCameraFlying(true)
        ;(sceneRef.current as any).focusPOI(poiKey)

        // Show info box for all POIs except Founders House
        if (poiKey !== 'FOUNDERS_HOUSE') {
          setSelectedPOIInfo(poi)
        } else {
          setSelectedPOIInfo(null)
        }

        setTimeout(() => {
          setIsCameraFlying(false)
        }, 3700)
      }
    }
  }

  return (
    <>
      <div
        ref={containerRef}
                className="helsinki-container"
      >
        <div className={`vignette-overlay ${isCameraFlying ? 'active' : ''}`} />
        <POILayer
          sceneRef={sceneRef}
          visible={scrollProgress >= 1}
          activePOIKey={activePOIKey}
          isCameraFlying={isCameraFlying}
          onPOISelect={handlePOISelect}
        />
      </div>


      <NavBar 
        logoColor={isMenuOpen ? "dark" : "light"}
        hamburgerColor={isMenuOpen ? "#FFF8F2" : "#D82E11"}
        opacity={showNavBar && !isTransitionActive ? 1 : 0}
        onMenuChange={setIsMenuOpen}
        audioRef={audioRef}
        audio2Ref={audio2Ref}
      />
      <div
        className="ui-overlay"
        style={{
          opacity: showUIState ? 1 : 0,
          transition: 'opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
          pointerEvents: 'none',
        }}
      >
        <div className="status">{status}</div>
      </div>

      <div
        className="hero-text-container"
        style={{
          opacity: isHeroFadingOut ? 0 : (showHeroText ? heroTextOpacity : 0),
          transition: isHeroFadingOut ? 'opacity 1s ease-out' : 'opacity 0.4s ease-out',
          pointerEvents: 'none',
        }}
      >
        {showHeroText && showDragIndicator && heroTextOpacity > 0.5 && (
          <div className="drag-explore-indicator">
            <svg viewBox="0 0 60 60" className="drag-circle">
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke="#8B1215"
                strokeWidth="0.8"
                opacity="0.3"
              />
            </svg>
            <div className="drag-label">
              Drag &<br />Explore
            </div>
          </div>
        )}

        <div className="hero-text-wrapper">
          {/*
          <div 
            className="hero-subtext-row"
            style={{
              transform: `translate(${mousePos.x * 8}px, ${mousePos.y * 8}px)`,
              transition: 'transform 2s cubic-bezier(0.17, 0.67, 0.3, 0.99)'
            }}
          >
            <p className="hero-subtext hero-subtext-left">BUILT FOR THE OBSESSED.</p>
            <b className="hero-location">HELSINKI</b>
            <p className="hero-subtext hero-subtext-right">BUILT FOR THE EXCEPTIONAL.</p>
          </div>
          */}
          <div 
            className="hero-subtext-row"
            style={{
              transform: `translate(${mousePos.x * 8}px, ${mousePos.y * 8}px)`,
              transition: 'transform 2s cubic-bezier(0.17, 0.67, 0.3, 0.99)'
            }}
          >
            <p className="hero-subtext hero-subtext-left">THIS IS WHERE GENERATIONAL FOUNDERS ARE BORN.</p>
          </div>
          <h1
            className="hero-title"
            style={{
              transform: `translate(${mousePos.x * 15}px, ${mousePos.y * 15}px)`,
              transition: 'transform 2s cubic-bezier(0.17, 0.67, 0.3, 0.99)'
            }}
          >
            <span className="hero-title-founders">FOUNDERS</span> <span className="hero-title-house">HOUSE</span>
          </h1>
          
          <div 
            className="hero-details-wrapper"
            style={{
              transform: `translate(${mousePos.x * 15}px, ${mousePos.y * 15}px)`,
              transition: 'transform 2s cubic-bezier(0.17, 0.67, 0.3, 0.99)'
            }}
          >
            <p className="hero-details-text">Sähkötalo, 00100 Helsinki</p>
            <p className="hero-details-text">60°10'3.60" N 24°55'29.99" E</p>
          </div>
  
          <div 
            className="hero-line-wrapper"
            style={{
              opacity: showHeroText ? heroTextOpacity : 0,
              transition: 'opacity 0.3s cubic-bezier(0.22, 1, 0.36, 1), transform 2s cubic-bezier(0.17, 0.67, 0.3, 0.99)',
              transform: `translate(${mousePos.x * 24}px, ${mousePos.y * 24}px)` }}
          >
            <Button 
              className="hero-learn-more-btn" 
              onClick={() => handleLearnMoreClick()}
              style={{
                pointerEvents: showHeroText && heroTextOpacity > 0.5 ? 'auto' : 'none'
              }}
            >
              Learn more
            </Button>
          </div>
        </div>
      </div>

      {showUIState && (
        <motion.div 
          className="poi-navigator-wrapper"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ 
            delay: 0,
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1]
          }}
        > 
          <POINavigator onPOISelect={handlePOISelect} initialPOI="FOUNDERS_HOUSE" />
        </motion.div>
      )}

      {scrollProgress >= 1 && (

       <motion.div
          className="drag-cursor-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: showCustomCursor && !isHoveringInteractive && !isMenuOpen ? 1 : 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{
            left: `${cursorPosition.x}px`,
            top: `${cursorPosition.y}px`,
          }}
        >
          <img src="/assets/icons/mapdragicon.svg" alt="Drag to explore" className="cursor-icon" />
        </motion.div>
      )}

      <div
        className="explore-hint"
        style={{
          position: 'fixed',
          top: '5vh',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: showExploreHint ? 1 : 0,
          transition: 'opacity 0.8s ease',
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontWeight: 300,
          color: '#797979',
          fontSize: '0.8rem',
          letterSpacing: '0em',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 100,
        }}
      >
        Drag around to explore Finland's Startup Scene
      </div>

      <div ref={poiInfoBoxRef}>
        <POIInfoBox
          poi={selectedPOIInfo}
          onClose={() => setSelectedPOIInfo(null)}
        />
      </div>
    </>
  )
}

export default HelsinkiViewer
