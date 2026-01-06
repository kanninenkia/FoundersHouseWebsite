import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
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

// Animated text component with fade-in or fade-up effect and optional fade-out (Jason's version)
const AnimatedText = ({ text, fadeUp = false, fadeOut = false }: { text: string; fadeUp?: boolean; fadeOut?: boolean; duration?: number }) => {
  let className = "fade-in-text";
  if (fadeUp) className = "fade-up-text";
  if (fadeUp && fadeOut) className += " fade-up-out";
  return <span className={className}>{text}</span>;
}

interface Block {
  id: number
  x: number
  y: number
  width: number
  height: number
  delay: number
}

// Jason's stages: map-slide-in and map-expand instead of lines-connect and slide-up-start
type Stage = 'logo-loading' | 'logo-blur' | 'pixel-out-to-text1' | 'text1' | 'text2' | 'map-slide-in' | 'map-expand' | 'complete'

export const LoadingScreen = ({ onComplete, duration, scrollProgress }: LoadingScreenProps) => {
  const [blocks, setBlocks] = useState<Block[]>([])
  // Always start fresh on page load - don't persist animation stage
  const [stage, setStage] = useState<Stage>('logo-loading')
  const [mapLoadingState, setMapLoadingState] = useState<MapLoadingState>({ isLoaded: false, progress: 0 })
  const [canProceedToBlur, setCanProceedToBlur] = useState(false)
  
  // Direct DOM manipulation for loading bar - bypasses React re-renders
  const loadingBarRef = useRef<HTMLDivElement>(null)

  // YOUR IMAGE CYCLING - All images now optimized as WebP
  // Select ONE random image on component mount
  const [loadingImage] = useState(() => {
    const images = [
      '/LoadInImage-min.webp',
      '/The Legends Day.webp',
      '/Wave x Maki Photo (2).webp',
      '/Wave x Maki Photo.webp',
      '/Legends Day Still 002.webp',
      '/Legends Day Still 014.webp'
    ]
    // Pick one random image
    const randomIndex = Math.floor(Math.random() * images.length)
    return images[randomIndex]
  })

  // Skip intro button state
  const [showSkipButton, setShowSkipButton] = useState(false)
  const [hasSkipped, setHasSkipped] = useState(false)

  // Show skip button when pixelation stage completes and we enter text1
  useEffect(() => {
    if (stage === 'text1' || stage === 'text2') {
      setShowSkipButton(true)
    } else if (stage === 'map-slide-in' || stage === 'map-expand' || stage === 'complete') {
      setShowSkipButton(false)
    }
  }, [stage])

  // Skip intro handler - jumps directly to map slide-in and then expand
  const handleSkip = () => {
    setShowSkipButton(false)
    setHasSkipped(true)
    setStage('map-slide-in')

    // Wait for slide-in animation to almost complete (1.6s of 1.8s total)
    // This shows the map nearly fully slid in before expanding
    setTimeout(() => {
      setStage('map-expand')
      setTimeout(() => {
        setStage('complete')
      }, 1500) // Duration of expand animation
    }, 1600) // 1.6s to let map slide to ~90% before expanding
  }

  // Keyboard shortcut for skip (Space or Enter)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'Enter') && showSkipButton && stage !== 'complete') {
        e.preventDefault()
        handleSkip()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showSkipButton, stage])

  // REMOVED: Time-based image cycling - now using single random image

  // ULTRA-SMOOTH LOADING BAR - Direct DOM manipulation, zero React interference
  useEffect(() => {
    if (scrollProgress > 0 || stage !== 'logo-loading') return

    const startTime = performance.now()
    const duration = 3000 // 3 seconds
    let animationFrameId: number

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min((elapsed / duration) * 100, 100)
      
      // Direct DOM update - bypasses React state and re-renders
      if (loadingBarRef.current) {
        loadingBarRef.current.style.width = `${progress}%`
      }

      // Continue until we hit 100%
      if (progress < 100) {
        animationFrameId = requestAnimationFrame(animate)
      }
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [scrollProgress, stage])

  // SAFETY CHECK - Wait for map to load, then allow progression
  useEffect(() => {
    if (scrollProgress > 0) return

    // When map fully loads, allow proceeding to blur
    if (mapLoadingState.isLoaded && mapLoadingState.progress >= 100) {
      setCanProceedToBlur(true)
    }
  }, [scrollProgress, mapLoadingState])

  useEffect(() => {
    // Generate random blocks with natural dissolve timing
    const generatedBlocks: Block[] = []
    // JASON'S GRID SIZE: 18x10 (reduced from your 24x16)
    const cols = 18 // Reduced columns for cleaner pixelation
    const rows = 10 // Reduced rows
    const blockWidth = 100 / cols
    const blockHeight = 100 / rows

    // Create blocks with edge-filling logic (Jason's overlap approach)
    const blockPositions: Block[] = []
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        // Overlap amount in percent
        const overlap = 0.15;
        blockPositions.push({
          id: i * rows + j,
          x: i * blockWidth,
          y: j * blockHeight,
          width: i === cols - 1 ? 100 - i * blockWidth : blockWidth + overlap,
          height: j === rows - 1 ? 100 - j * blockHeight : blockHeight + overlap,
          delay: 0
        })
      }
    }

    // Shuffle blocks and assign truly random delays, rotation, and scale for natural dissolve
    const shuffled = blockPositions.sort(() => Math.random() - 0.5)
    const maxDelay = 1200 // Spread dissolve over 1.2 seconds
    shuffled.forEach((block) => {
      generatedBlocks.push({
        ...block,
        delay: Math.random() * maxDelay // Completely random delay for natural effect
      })
    })

    setBlocks(generatedBlocks)

    return () => {
      // No timers to clean up
    }
  }, [duration, onComplete])

  // JASON'S STAGE TRANSITIONS - map-slide-in and map-expand timing
  // Runs continuously regardless of tab visibility
  useEffect(() => {
    if (!canProceedToBlur || hasSkipped) return

    // Record start time for time-based stage transitions
    const startTime = Date.now()

    // Use setInterval to check elapsed time continuously
    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - startTime

      if (elapsed >= 500 && elapsed < 1300) {
        setStage('logo-blur')
      } else if (elapsed >= 1300 && elapsed < 2800) {
        setStage('pixel-out-to-text1')
      } else if (elapsed >= 2800 && elapsed < 6800) {
        setStage('text1')
      } else if (elapsed >= 6800 && elapsed < 9000) {
        setStage('text2')
      } else if (elapsed >= 9000 && elapsed < 9500) {
        setStage('map-slide-in')
      } else if (elapsed >= 11500 && elapsed < 13000) {
        setStage('map-expand')
      } else if (elapsed >= 13000) {
        setStage('complete')
        clearInterval(checkInterval) // Stop checking once we reach final stage
      }
    }, 50) // Check every 50ms for smooth transitions

    return () => {
      clearInterval(checkInterval)
    }
  }, [canProceedToBlur, scrollProgress, hasSkipped])

  const showLogo = stage === 'logo-loading' || stage === 'logo-blur' || stage === 'pixel-out-to-text1'
  const showLoadingBar = stage === 'logo-loading'
  const showBackgroundImage = stage === 'logo-loading' || stage === 'logo-blur' || stage === 'pixel-out-to-text1'
  const showPixelTransition = stage === 'pixel-out-to-text1'
  // JASON'S DELAYED TEXT1 APPEARANCE
  const [showText1Delayed, setShowText1Delayed] = useState(false)
  const showText1 = stage === 'text1' && showText1Delayed
  const [fadeOutText1, setFadeOutText1] = useState(false)
  const shouldBlurLogo = stage === 'logo-blur' || stage === 'pixel-out-to-text1'

  // JASON'S TEXT DELAY AND FADE-OUT LOGIC
  useEffect(() => {
    let showTimeout: ReturnType<typeof setTimeout> | undefined
    let fadeOutTimeout: ReturnType<typeof setTimeout> | undefined
    if (stage === 'text1') {
      showTimeout = setTimeout(() => setShowText1Delayed(true), 300)
      // Fade out text1 just before switching to text2
      fadeOutTimeout = setTimeout(() => setFadeOutText1(true), 3400)
    } else {
      setShowText1Delayed(false)
      setFadeOutText1(false)
    }
    return () => {
      if (showTimeout) clearTimeout(showTimeout)
      if (fadeOutTimeout) clearTimeout(fadeOutTimeout)
    }
  }, [stage])

  return (
    <motion.div
      className="loading-screen"
      style={{
        pointerEvents: 'auto',
        zIndex: 10000,
        background: 'transparent'
      }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      transition={{ duration: 0 }}
    >
      <div className="loading-content">
        {/* Persistent dark red background layer */}
        <div className={`loading-text text-page${stage === 'map-slide-in' ? ' text-pushed-by-box' : ''}`} style={{ pointerEvents: 'none', zIndex: 0, position: 'fixed', inset: 0 }}>
          {/* Corner labels absolutely positioned, not wrapped, so they stay in corners */}
          {(stage === 'text1' || stage === 'text2' || stage === 'map-slide-in' || stage === 'map-expand') && <>
            <span
              className={`corner-label top-left${stage === 'text1' ? ' fade-in' : ''}${stage !== 'text1' ? ' fade-in-persist' : ''}`}
            >FOUNDERS HOUSE</span>
            <span
              className={`corner-label top-right${stage === 'text1' ? ' fade-in' : ''}${stage !== 'text1' ? ' fade-in-persist' : ''}`}
            >HELSINKI, FINLAND</span>
          </>}
          {/* Text content in its own container for independent animation */}
          <div className={`text-centered align-left${stage === 'map-slide-in' ? ' text-pushed-by-box' : ''}${stage === 'map-expand' ? ' text-pushed-expand' : ''}`} style={{ opacity: (stage === 'text1' || stage === 'text2' || stage === 'map-slide-in' || stage === 'map-expand' || stage === 'complete') ? 1 : 0 }}>
            {/* Always render both text1 and text2, but control their visibility with stage */}
            <div style={{ display: stage === 'text1' && showText1 ? 'block' : 'none' }}>
              <div className="fade-up-wrapper"><AnimatedText text="FOR THE NEXT" fadeUp={true} fadeOut={fadeOutText1} /></div>
              <div className="fade-up-wrapper"><AnimatedText text="FOUNDER GENERATION" fadeUp={true} fadeOut={fadeOutText1} /></div>
            </div>
            <div
              style={{ display: (stage === 'text2' || stage === 'map-slide-in' || stage === 'map-expand' || stage === 'complete') ? 'block' : 'none' }}
            >
              <div className="fade-up-wrapper"><AnimatedText text="WHERE BUILDERS CONVERGE," fadeUp /></div>
              <div className="fade-up-wrapper"><AnimatedText text="WHERE POTENTIAL MULTIPLIES" fadeUp /></div>
            </div>
          </div>
        </div>

        {/* Background layer: Single random loading image - Always visible during initial stages */}
        {showBackgroundImage && (
          <div className="loading-background-image">
            <img
              src={loadingImage}
              alt="Founders House"
              className="background-image-layer background-image-static"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        )}

        {/* Stage 1 & 2: Logo + Loading Bar (on top of background) */}
        {showLogo && (
          <div
            className={`loading-logo ${shouldBlurLogo ? 'blur-out' : ''}`}
            style={{ height: '76px', width: 'auto' }}
          >
            <img src="/fhlogo_horizontal.png" alt="Founders House" style={{ height: '100%', width: 'auto', display: 'block' }} />
          </div>
        )}
        {showLoadingBar && (
          <div className="loading-bar-container">
            <div ref={loadingBarRef} className="loading-bar" />
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

        {/* Always mount HelsinkiViewer so it can trigger loading state */}
        <div
          className={`map-container${stage === 'map-slide-in' ? ' slide-in' : ''}${stage === 'map-expand' ? ' expand' : ''}`}
          style={{
            visibility: (stage === 'map-slide-in' || stage === 'map-expand' || stage === 'complete') ? 'visible' : 'hidden',
            pointerEvents: (stage === 'map-slide-in' || stage === 'map-expand' || stage === 'complete') ? 'auto' : 'none',
            position: 'fixed',
            left: 0,
            top: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 2,
            background: 'transparent',
            opacity: 1,
            overflow: 'hidden',
            transition: 'none',
          }}
        >
          <div className={`helsinki-zoom-wrapper${stage === 'map-slide-in' ? ' zoomed-in' : ''}${stage === 'map-expand' ? ' zooming-out' : ''}`}
            style={{width: '100%', height: '100%'}}>
            <HelsinkiViewer
              shouldLoad={true}
              shouldPause={false}
              onMapLoadingChange={setMapLoadingState}
              scrollProgress={(stage === 'map-expand' || stage === 'complete') ? 1 : 0}
            />
          </div>
        </div>

        {/* Skip intro button - appears after pixelation (2.8s) */}
        {showSkipButton && stage !== 'complete' && stage !== 'map-slide-in' && stage !== 'map-expand' && (
          <button
            className="skip-intro-button"
            onClick={handleSkip}
            aria-label="Skip to map"
          >
            → Explore
          </button>
        )}
      </div>
    </motion.div>
  )
}
