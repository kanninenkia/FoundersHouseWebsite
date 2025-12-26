import { useEffect, useState } from 'react'
import { HelsinkiViewer } from './HelsinkiViewer'
import './LoadingScreen.css'

interface LoadingScreenProps {
  onComplete: () => void
  duration: number
  scrollProgress: number
  onScrollProgressChange: (progress: number) => void
}

interface MapLoadingState {
  isLoaded: boolean
  progress: number
}

// Animated text component with fade-in effect
const AnimatedText = ({ text }: { text: string; duration?: number }) => {
  return <span className="fade-in-text">{text}</span>
}

interface Block {
  id: number
  x: number
  y: number
  width: number
  height: number
  delay: number
}

type Stage = 'logo-loading' | 'logo-blur' | 'pixel-out-to-text1' | 'text1' | 'text2' | 'lines-connect' | 'slide-up-start' | 'complete'

export const LoadingScreen = ({ onComplete, duration, scrollProgress, onScrollProgressChange }: LoadingScreenProps) => {
  const [blocks, setBlocks] = useState<Block[]>([])
  // Persist stage across tab switches - if user is at scrollProgress > 0, they're already at slide-up-start
  const [stage, setStage] = useState<Stage>(() => {
    const saved = sessionStorage.getItem('animationStage')
    if (saved && scrollProgress > 0) return saved as Stage
    return 'logo-loading'
  })
  const [userHasScrolled, setUserHasScrolled] = useState(false)
  const [mapLoadingState, setMapLoadingState] = useState<MapLoadingState>({ isLoaded: false, progress: 0 })
  const [loadingBarProgress, setLoadingBarProgress] = useState(0)
  const [canProceedToBlur, setCanProceedToBlur] = useState(false)

  // Save stage to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('animationStage', stage)
  }, [stage])

  // Loading bar effect - runs for exactly 7 seconds, independent of map loading
  // Uses timestamp-based progress to work in background tabs
  useEffect(() => {
    if (scrollProgress > 0) return

    const LOADING_DURATION = 7000 // 7 seconds
    const startTime = Date.now()

    // Use setInterval with timestamp checking instead of increment-based
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min((elapsed / LOADING_DURATION) * 100, 100)

      setLoadingBarProgress(progress)

      if (progress >= 100) {
        clearInterval(interval)
      }
    }, 50) // Check every 50ms - will continue even if throttled in background

    // After 7 seconds, check if map is loaded
    const checkTimer = setTimeout(() => {
      if (mapLoadingState.isLoaded) {
        // Map is loaded, can proceed immediately
        setCanProceedToBlur(true)
      } else {
        // Map still loading, wait for it
        // canProceedToBlur will be set to true when map finishes loading
      }
    }, LOADING_DURATION)

    return () => {
      clearInterval(interval)
      clearTimeout(checkTimer)
    }
  }, [scrollProgress, mapLoadingState.isLoaded])

  // Watch for map loading completion after 7 seconds
  useEffect(() => {
    if (loadingBarProgress >= 100 && mapLoadingState.isLoaded) {
      setCanProceedToBlur(true)
    }
  }, [loadingBarProgress, mapLoadingState.isLoaded])

  useEffect(() => {
    // Skip animations if returning to a saved state with scrollProgress > 0
    if (scrollProgress > 0) {
      return
    }

    // Generate random blocks with natural dissolve timing
    const generatedBlocks: Block[] = []
    const cols = 24 // More columns for finer pixelation (24 blocks wide)
    const rows = 16 // 24x16 grid maintains aspect ratio
    const blockWidth = 100 / cols
    const blockHeight = 100 / rows

    // Create blocks with random appearance order
    const blockPositions: Block[] = []
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        blockPositions.push({
          id: i * rows + j,
          x: i * blockWidth,
          y: j * blockHeight,
          width: blockWidth,
          height: blockHeight,
          delay: 0
        })
      }
    }

    // Shuffle blocks and assign truly random delays for natural dissolve
    const shuffled = blockPositions.sort(() => Math.random() - 0.5)
    const maxDelay = 1200 // Spread dissolve over 1.2 seconds
    shuffled.forEach((block) => {
      generatedBlocks.push({
        ...block,
        delay: Math.random() * maxDelay // Completely random delay for natural effect
      })
    })

    setBlocks(generatedBlocks)

    // No timers here - stages are controlled by canProceedToBlur
    // All stage transitions happen in a separate useEffect watching canProceedToBlur

    return () => {
      // No timers to clean up
    }
  }, [duration, onComplete])

  // Stage transitions triggered after loading completes
  // Uses timestamp-based checking with setInterval to work in background tabs
  useEffect(() => {
    if (!canProceedToBlur || scrollProgress > 0) return

    // Record start time for time-based stage transitions
    const startTime = Date.now()

    // Use setInterval instead of setTimeout chain to work in background tabs
    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - startTime

      if (elapsed >= 500 && elapsed < 1300) {
        setStage('logo-blur')
      } else if (elapsed >= 1300 && elapsed < 2800) {
        setStage('pixel-out-to-text1')
      } else if (elapsed >= 2800 && elapsed < 6300) {
        setStage('text1')
      } else if (elapsed >= 6300 && elapsed < 8300) {
        setStage('text2')
      } else if (elapsed >= 8300 && elapsed < 11100) {
        setStage('lines-connect')
      } else if (elapsed >= 11100) {
        setStage('slide-up-start')
        clearInterval(checkInterval) // Stop checking once we reach final stage
      }
    }, 50) // Check every 50ms for smooth transitions

    return () => {
      clearInterval(checkInterval)
    }
  }, [canProceedToBlur, scrollProgress])

  // Handle scroll to expand map to full screen
  useEffect(() => {
    if (stage !== 'slide-up-start') return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      // Mark that user has scrolled (cancels auto-scroll)
      setUserHasScrolled(true)

      // Once scrollProgress reaches 1, lock it there (no unscrolling)
      if (scrollProgress >= 1 && e.deltaY < 0) {
        return // Prevent scrolling back up
      }

      const delta = e.deltaY * 0.002 // Smooth scroll sensitivity
      const next = Math.min(Math.max(scrollProgress + delta, 0), 1) // Clamp between 0 and 1
      onScrollProgressChange(next)
    }

    window.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      window.removeEventListener('wheel', handleWheel)
    }
  }, [stage, scrollProgress, onScrollProgressChange])

  // Auto-scroll timer - starts after slide-up animation reaches 67vh (3s animation completes)
  useEffect(() => {
    if (stage !== 'slide-up-start' || userHasScrolled) return

    // Wait for slide-up animation to complete (3s), then start 3s timer
    const autoScrollTimer = setTimeout(() => {
      if (scrollProgress < 1 && !userHasScrolled) {
        // Smoothly animate to 100% - slower, more gentle transition
        const startProgress = scrollProgress
        const duration = 2500 // 2.5 second animation (slower)
        const startTime = Date.now()

        const animate = () => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / duration, 1)

          // Easing function (ease-in-out for smoother feel)
          const eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2
          const newProgress = startProgress + (1 - startProgress) * eased

          onScrollProgressChange(newProgress)

          if (progress < 1) {
            requestAnimationFrame(animate)
          }
        }

        animate()
      }
    }, 3000 + 3000) // 3s for slide-up animation + 3s wait time

    return () => clearTimeout(autoScrollTimer)
  }, [stage, scrollProgress, onScrollProgressChange, userHasScrolled])

  const showLogo = stage === 'logo-loading' || stage === 'logo-blur' || stage === 'pixel-out-to-text1'
  const showLoadingBar = stage === 'logo-loading'
  const showBackgroundImage = stage === 'logo-loading' || stage === 'logo-blur' || stage === 'pixel-out-to-text1'
  const showPixelTransition = stage === 'pixel-out-to-text1'
  const showTextPage = stage === 'text1' || stage === 'text2' || stage === 'lines-connect' || stage === 'slide-up-start'
  const showText1 = stage === 'text1'
  const showText2 = stage === 'text2' || stage === 'lines-connect' || stage === 'slide-up-start'
  const shouldBlurLogo = stage === 'logo-blur' || stage === 'pixel-out-to-text1'
  const shouldConnectLines = stage === 'lines-connect' || stage === 'slide-up-start'
  const shouldShowMapInBox = stage === 'lines-connect' || stage === 'slide-up-start'
  const shouldSlideUp = stage === 'slide-up-start'
  // Start loading map immediately at page launch (all stages)
  const shouldLoadMap = true
  // NEVER pause map loading - even in background tabs
  // This ensures the map loads regardless of tab visibility or animation stage
  const shouldPauseMapLoading = false

  // Debug logging
  console.log('[LoadingScreen] Render:', {
    stage,
    shouldLoadMap,
    shouldPauseMapLoading,
    scrollProgress
  })

  return (
    <div
      className="loading-screen"
      style={{
        pointerEvents: scrollProgress >= 1 ? 'none' : 'auto',
        zIndex: scrollProgress >= 1 ? 1 : 10000,
        background: 'transparent'
      }}
    >
      <div className="loading-content">
        {/* Background layer: LoadInImage - Always visible during initial stages */}
        {showBackgroundImage && (
          <div className="loading-background-image">
            <img src="/LoadInImage.png" alt="Founders House" />
          </div>
        )}

        {/* Stage 1 & 2: Logo + Loading Bar (on top of background) */}
        {showLogo && (
          <div className={`loading-logo ${shouldBlurLogo ? 'blur-out' : ''}`}>
            <img src="/fhlogo_horizontal.png" alt="Founders House" />
          </div>
        )}
        {showLoadingBar && (
          <div className="loading-bar-container">
            <div className="loading-bar" style={{ width: `${loadingBarProgress}%` }} />
          </div>
        )}

        {/* Cream blocks that pixelate out the image to reveal text */}
        {showPixelTransition && (
          <div className="blocks-container">
            {blocks.map((block) => (
              <div
                key={block.id}
                className="block pixel-reveal"
                style={{
                  left: `${block.x}%`,
                  top: `${block.y}%`,
                  width: `${block.width}%`,
                  height: `${block.height}%`,
                  animationDelay: `${block.delay}ms`
                }}
              />
            ))}
          </div>
        )}

        {/* Single persistent orange text page - content changes but page stays */}
        {showTextPage && scrollProgress < 1 && (
          <div
            className={`loading-text text-page ${shouldConnectLines ? 'lines-connect' : ''}`}
            style={{
              pointerEvents: 'none'
            }}
          >
            {/* Logo and Hamburger - Hidden on loading screen, will show on map view instead */}

            <span
              className="corner-label top-left"
              style={{
                transform: shouldSlideUp ? `translateY(-${scrollProgress * 100}vh)` : undefined,
                opacity: shouldSlideUp ? 1 - scrollProgress : undefined,
                transition: 'none'
              }}
            >
              FOUNDERS HOUSE
            </span>
            <span
              className="corner-label top-right"
              style={{
                transform: shouldSlideUp ? `translateY(-${scrollProgress * 100}vh)` : undefined,
                opacity: shouldSlideUp ? 1 - scrollProgress : undefined,
                transition: 'none'
              }}
            >
              HELSINKI, FINLAND
            </span>

            {/* Vertical drop lines */}
            {shouldConnectLines && scrollProgress < 1 && (
              <>
                <div className={`vertical-line-left ${shouldSlideUp ? 'sliding-up' : ''}`}></div>
                <div className={`vertical-line-right ${shouldSlideUp ? 'sliding-up' : ''}`}></div>
              </>
            )}

            {/* Text content - switches from text1 to text2 seamlessly */}
            <div
              className={`text-centered align-left ${shouldSlideUp ? 'text-pushed-by-box' : ''}`}
              data-scrolling={shouldSlideUp && scrollProgress > 0 ? 'true' : 'false'}
              style={
                shouldSlideUp && scrollProgress > 0
                  ? {
                      // Text starts at -25vh (from animation), moves up with map's top edge
                      // Map top moves from 33vh to 0vh (moves up 33vh total)
                      // Text should move from -25vh to -58vh to stay with map
                      transform: `translateY(${-25 - scrollProgress * 33}vh) translateZ(0)`,
                      // Fade from 0.8 to 0 as scroll progresses from 0 to 1
                      opacity: Math.max(0, 0.8 - scrollProgress * 0.8),
                      visibility: scrollProgress >= 1 ? 'hidden' : 'visible'
                    }
                  : shouldSlideUp
                  ? {
                      // During animation, let CSS handle it, but hide when animation completes
                      animationFillMode: 'forwards'
                    }
                  : undefined
              }
            >
              {showText1 && (
                <>
                  <div><AnimatedText text="FOR THE NEXT" /></div>
                  <div><AnimatedText text="FOUNDER GENERATION" /></div>
                </>
              )}
              {showText2 && (
                <>
                  <div><AnimatedText text="Where builders converge," /></div>
                  <div><AnimatedText text="Where potential multiplies" /></div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Map container - fades into box when lines connect, then slides up */}
        {shouldLoadMap && (
          <div
            className={`map-container ${shouldShowMapInBox ? 'show-in-box' : ''} ${shouldSlideUp ? 'sliding-up' : ''}`}
            style={{
              ...(shouldSlideUp && scrollProgress > 0
                ? {
                    height: `${67 + scrollProgress * 33}vh`,
                    width: `${80 + scrollProgress * 20}vw`,
                    borderRadius: `${8 - scrollProgress * 8}px`,
                    animation: 'none',
                    transform: `translateX(-50%) translateY(0) scale(1)`,
                    opacity: 0.8 + scrollProgress * 0.2,
                    zIndex: scrollProgress >= 1 ? 10001 : 2
                  }
                : {}),
              // Hide until lines connect
              visibility: shouldShowMapInBox ? 'visible' : 'hidden',
              pointerEvents: shouldShowMapInBox ? 'auto' : 'none'
            }}
          >
            <HelsinkiViewer
              shouldLoad={shouldLoadMap}
              shouldPause={shouldPauseMapLoading}
              scrollProgress={scrollProgress}
              onMapLoadingChange={setMapLoadingState}
            />
          </div>
        )}
      </div>
    </div>
  )
}
