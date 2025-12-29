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
  // Persist stage across tab switches
  const [stage, setStage] = useState<Stage>(() => {
    const saved = sessionStorage.getItem('animationStage')
    return saved ? (saved as Stage) : 'logo-loading'
  })
  const [mapLoadingState, setMapLoadingState] = useState<MapLoadingState>({ isLoaded: false, progress: 0 })
  const [loadingBarProgress, setLoadingBarProgress] = useState(0)
  const [smoothLoadingBarProgress, setSmoothLoadingBarProgress] = useState(0)
  const [canProceedToBlur, setCanProceedToBlur] = useState(false)

  // YOUR IMAGE CYCLING - Keep all 6 images
  // LoadInImage.png is ALWAYS first (index 0) so it can be preloaded in HTML
  const [loadingImages] = useState(() => {
    const images = [
      '/LoadInImage.png', // ALWAYS FIRST - preloaded in index.html
      '/The Legends Day.png',
      '/Wave x Maki Photo (2).png',
      '/Wave x Maki Photo.png',
      '/Legends Day Still 002.png',
      '/Legends Day Still 014.png'
    ]
    // Don't shuffle - keep LoadInImage.png at index 0
    return images
  })

  // ALWAYS start with LoadInImage.png (index 0) for instant display
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [previousImageIndex, setPreviousImageIndex] = useState(0)
  const [isFirstImage, setIsFirstImage] = useState(true)

  // Save stage to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('animationStage', stage)
  }, [stage])

  // YOUR IMAGE CYCLING LOGIC - Cycle through images every 1 second with crossfade
  useEffect(() => {
    if (scrollProgress > 0 || stage !== 'logo-loading') return

    const startTime = Date.now()
    let lastChangeTime = startTime

    const checkInterval = setInterval(() => {
      const now = Date.now()
      const elapsed = now - lastChangeTime

      // Change image exactly every 600ms based on timestamp
      if (elapsed >= 600) {
        setIsFirstImage(false)
        setPreviousImageIndex(currentImageIndex)
        setCurrentImageIndex((prev) => (prev + 1) % loadingImages.length)
        lastChangeTime = now
      }
    }, 16) // Check every 16ms (~60fps) for smooth timing

    return () => clearInterval(checkInterval)
  }, [scrollProgress, stage, loadingImages.length, currentImageIndex])

  // Loading bar tied to actual map loading progress
  useEffect(() => {
    if (scrollProgress > 0) return

    // Update target loading bar based on map progress
    setLoadingBarProgress(mapLoadingState.progress)

    // When map fully loads, proceed to blur
    if (mapLoadingState.isLoaded && mapLoadingState.progress >= 100) {
      setCanProceedToBlur(true)
    }
  }, [scrollProgress, mapLoadingState])

  // Smooth loading bar animation at 120fps
  useEffect(() => {
    if (scrollProgress > 0) return

    let animationFrameId: number

    const animate = () => {
      setSmoothLoadingBarProgress((current) => {
        const target = loadingBarProgress
        const diff = target - current

        // Smooth interpolation - closes gap by 20% each frame
        if (Math.abs(diff) < 0.1) {
          return target
        }
        return current + diff * 0.2
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [scrollProgress, loadingBarProgress])

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

    return () => {
      // No timers to clean up
    }
  }, [duration, onComplete])

  // JASON'S STAGE TRANSITIONS - map-slide-in and map-expand timing
  useEffect(() => {
    if (!canProceedToBlur) return

    // Record start time for time-based stage transitions
    const startTime = Date.now()

    // Use setInterval instead of setTimeout chain to work in background tabs
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
  }, [canProceedToBlur, scrollProgress])

  const showLogo = stage === 'logo-loading' || stage === 'logo-blur' || stage === 'pixel-out-to-text1'
  const showLoadingBar = stage === 'logo-loading'
  const showBackgroundImage = stage === 'logo-loading' || stage === 'logo-blur' || stage === 'pixel-out-to-text1'
  const showPixelTransition = stage === 'pixel-out-to-text1'
  // JASON'S DELAYED TEXT1 APPEARANCE
  const [showText1Delayed, setShowText1Delayed] = useState(false)
  const showText1 = stage === 'text1' && showText1Delayed
  const [fadeOutText1, setFadeOutText1] = useState(false)
  const shouldBlurLogo = stage === 'logo-blur' || stage === 'pixel-out-to-text1'
  // Start loading map immediately at page launch (all stages)
  const shouldLoadMap = true
  const shouldPauseMapLoading = false

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
        pointerEvents: 'auto',
        zIndex: 10000,
        background: 'transparent'
      }}
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

        {/* Background layer: YOUR CYCLING LOADING IMAGES WITH CROSSFADE - Always visible during initial stages */}
        {showBackgroundImage && (
          <div className="loading-background-image">
            {/* Previous image - stays visible underneath (only show after first transition) */}
            {!isFirstImage && (
              <img
                key={`prev-${previousImageIndex}`}
                src={loadingImages[previousImageIndex]}
                alt="Founders House"
                className="background-image-layer background-image-previous"
              />
            )}
            {/* Current image - fades in on top (except first image which appears immediately) */}
            <img
              key={`curr-${currentImageIndex}`}
              src={loadingImages[currentImageIndex]}
              alt="Founders House"
              className={`background-image-layer ${isFirstImage ? 'background-image-first' : 'background-image-current'}`}
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
            <div className="loading-bar" style={{ width: `${smoothLoadingBarProgress}%` }} />
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
          <HelsinkiViewer
            shouldLoad={true}
            shouldPause={false}
            onMapLoadingChange={setMapLoadingState}
            scrollProgress={(stage === 'map-expand' || stage === 'complete') ? 1 : 0}
          />
        </div>
      </div>
    </div>
  )
}
