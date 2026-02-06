import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { HelsinkiViewer } from '../map'
import './LoadingScreen.css'

interface LoadingScreenProps {
  onComplete: () => void
  duration: number
  scrollProgress: number
  onScrollProgressChange: (progress: number) => void
  isReturnVisit?: boolean
}

interface MapLoadingState {
  isLoaded: boolean
  progress: number
}

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

type Stage = 'logo-loading' | 'logo-blur' | 'pixel-out-to-text1' | 'text1' | 'text2' | 'map-slide-in' | 'map-expand' | 'complete' | 'return-loading' | 'return-pixel-in' | 'return-pixel-hold' | 'return-pixel-out'

export const LoadingScreen = ({ onComplete, duration, scrollProgress, isReturnVisit = false }: LoadingScreenProps) => {
  // Check sessionStorage directly to ensure we have the correct value on mount
  const isReturnVisitRef = useRef(sessionStorage.getItem('hasVisitedMap') === 'true')
  const isReturn = isReturnVisitRef.current
  
  console.log('🔍 LoadingScreen mount:', { isReturn, isReturnVisit, hasVisitedMap: sessionStorage.getItem('hasVisitedMap') })
  
  const [blocks, setBlocks] = useState<Block[]>([])
  const shouldSkipIntro = sessionStorage.getItem('skipIntro') === 'true'
  const [stage, setStage] = useState<Stage>(isReturn ? 'return-loading' : 'logo-loading')
  const [mapLoadingState, setMapLoadingState] = useState<MapLoadingState>({ isLoaded: false, progress: 0 })
  const [canProceedToBlur, setCanProceedToBlur] = useState(false)
  const loadingBarRef = useRef<HTMLDivElement>(null)
  const hasCompletedRef = useRef(false)
  const returnLoadingDuration = 2000

  const [loadingImage] = useState(() => {
    const images = [
      '/assets/images/events/LoadInImage-min.webp',
      '/assets/images/membership/join-process.webp',
      '/assets/images/events/Wave x Maki Photo (2).webp',
      '/assets/images/events/Wave x Maki Photo.webp',
      '/assets/images/events/FH_people1.webp',
      '/assets/images/events/FH_zechen.webp'
    ]
    const randomIndex = Math.floor(Math.random() * images.length)
    return images[randomIndex]
  })

  const [showSkipButton, setShowSkipButton] = useState(false)
  const [hasSkipped, setHasSkipped] = useState(false)

  useEffect(() => {
    if (shouldSkipIntro) {
      sessionStorage.removeItem('skipIntro')
    }
  }, [shouldSkipIntro])

  useEffect(() => {
    if (stage === 'text1' || stage === 'text2') {
      setShowSkipButton(true)
    } else if (stage === 'map-slide-in' || stage === 'map-expand' || stage === 'complete') {
      setShowSkipButton(false)
    }
  }, [stage])

  const handleSkip = () => {
    setShowSkipButton(false)
    setHasSkipped(true)
    setStage('map-slide-in')

    setTimeout(() => {
      setStage('map-expand')
      setTimeout(() => {
        setStage('complete')
      }, 1500)
    }, 1600)
  }

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

  useEffect(() => {
    if (scrollProgress > 0 || (stage !== 'logo-loading' && stage !== 'return-loading')) return

    const startTime = performance.now()
    const duration = 3000
    let animationFrameId: number

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min((elapsed / duration) * 100, 100)

      if (loadingBarRef.current) {
        loadingBarRef.current.style.width = `${progress}%`
      }

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

  useEffect(() => {
    if (scrollProgress > 0) return

    if (mapLoadingState.isLoaded && mapLoadingState.progress >= 100) {
      setCanProceedToBlur(true)
    }
  }, [scrollProgress, mapLoadingState])

  useEffect(() => {
    const generatedBlocks: Block[] = []
    const cols = 18
    const rows = 10
    const blockWidth = 100 / cols
    const blockHeight = 100 / rows

    const blockPositions: Block[] = []
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
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

    const shuffled = blockPositions.sort(() => Math.random() - 0.5)
    const maxDelay = 800 // Reduced for faster animations
    shuffled.forEach((block) => {
      generatedBlocks.push({
        ...block,
        delay: Math.random() * maxDelay
      })
    })

    setBlocks(generatedBlocks)

    return () => {}
  }, [duration, onComplete])

  useEffect(() => {
    if (!canProceedToBlur || hasSkipped) return

    const startTime = Date.now()

    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - startTime

      if (isReturn) {
        console.log('⏱️ Return visit timeline:', { elapsed, stage })
        // Return visit: load bar → pixel-in → pixel-out → complete
        const pixelInDuration = 1600
        const pixelOutDuration = 800
        
        if (elapsed < pixelInDuration) {
          setStage('return-pixel-in')
        } else if (elapsed >= pixelInDuration && elapsed < pixelInDuration + pixelOutDuration) {
          setStage('return-pixel-out')
        } else if (elapsed >= pixelInDuration + pixelOutDuration) {
          setStage('complete')
          clearInterval(checkInterval)
        }
      } else if (shouldSkipIntro) {
        console.log('⏱️ Skip intro timeline:', { elapsed, stage })
        if (elapsed >= 500 && elapsed < 1300) {
          setStage('logo-blur')
        } else if (elapsed >= 1300 && elapsed < 3100) {
          setStage('map-slide-in')
        } else if (elapsed >= 3100 && elapsed < 4600) {
          setStage('map-expand')
        } else if (elapsed >= 4600) {
          setStage('complete')
          clearInterval(checkInterval)
        }
      }
      else {
        console.log('⏱️ Full intro timeline:', { elapsed, stage })
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
          clearInterval(checkInterval)
        }
      }
    }, 50)

    return () => {
      clearInterval(checkInterval)
    }
  }, [canProceedToBlur, scrollProgress, hasSkipped, shouldSkipIntro, isReturn])

  const showLogo = isReturn
    ? (stage === 'return-loading' || stage === 'return-pixel-in' || stage === 'return-pixel-out')
    : (stage === 'logo-loading' || stage === 'logo-blur' || stage === 'pixel-out-to-text1')
  const showLoadingBar = stage === 'logo-loading' || stage === 'return-loading'
  const showBackgroundImage = isReturn
    ? (stage === 'return-loading' || stage === 'return-pixel-in' || stage === 'return-pixel-out')
    : (stage === 'logo-loading' || stage === 'logo-blur' || stage === 'pixel-out-to-text1')
  const showPixelTransition = isReturn
    ? (stage === 'return-pixel-in' || stage === 'return-pixel-out')
    : (stage === 'pixel-out-to-text1')
  const [showText1Delayed, setShowText1Delayed] = useState(false)
  const showText1 = !isReturn && stage === 'text1' && showText1Delayed
  const [fadeOutText1, setFadeOutText1] = useState(false)
  const shouldBlurLogo = stage === 'logo-blur' || stage === 'pixel-out-to-text1'
  const shouldFadeOutForReturn = false // Don't fade during return visits - let pixels cover content

  useEffect(() => {
    let showTimeout: ReturnType<typeof setTimeout> | undefined
    let fadeOutTimeout: ReturnType<typeof setTimeout> | undefined
    if (stage === 'text1') {
      showTimeout = setTimeout(() => setShowText1Delayed(true), 300)
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

  useEffect(() => {
    if (stage !== 'complete' || hasCompletedRef.current) return
    hasCompletedRef.current = true
    onComplete()
  }, [stage, onComplete])

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
        <section className="visually-hidden" aria-label="Founders House summary">
          <h1>Founders House</h1>
          <p>Built for the obsessed. Built for the exceptional.</p>
          <p>Premium community space in Helsinki for ambitious founders.</p>
        </section>
        <div className={`loading-text${!isReturn ? ' text-page' : ''}${stage === 'map-slide-in' ? ' text-pushed-by-box' : ''}`} style={{ pointerEvents: 'none', zIndex: 0, position: 'fixed', inset: 0 }}>
          {!isReturn && (stage === 'text1' || stage === 'text2' || stage === 'map-slide-in' || stage === 'map-expand') && <>
            <span
              className={`corner-label top-left${stage === 'text1' ? ' fade-in' : ''}${stage !== 'text1' ? ' fade-in-persist' : ''}`}
            >FOUNDERS HOUSE</span>
            <span
              className={`corner-label top-right${stage === 'text1' ? ' fade-in' : ''}${stage !== 'text1' ? ' fade-in-persist' : ''}`}
            >HELSINKI, FINLAND</span>
          </>}
          <div className={`text-centered align-left${stage === 'map-slide-in' ? ' text-pushed-by-box' : ''}${stage === 'map-expand' ? ' text-pushed-expand' : ''}`} style={{ opacity: !isReturn && (stage === 'text1' || stage === 'text2' || stage === 'map-slide-in' || stage === 'map-expand' || stage === 'complete') ? 1 : 0 }}>
            <div style={{ display: stage === 'text1' && showText1 ? 'block' : 'none' }}>
              <div className="fade-up-wrapper"><AnimatedText text="FOR THE NEXT" fadeUp={true} fadeOut={fadeOutText1} /></div>
              <div className="fade-up-wrapper"><AnimatedText text="FOUNDER GENERATION" fadeUp={true} fadeOut={fadeOutText1} /></div>
            </div>
            <div
              style={{ display: !isReturn && (stage === 'text2' || stage === 'map-slide-in' || stage === 'map-expand' || stage === 'complete') ? 'block' : 'none' }}
            >
              <div className="fade-up-wrapper"><AnimatedText text="WHERE BUILDERS CONVERGE," fadeUp /></div>
              <div className="fade-up-wrapper"><AnimatedText text="WHERE POTENTIAL MULTIPLIES" fadeUp /></div>
            </div>
          </div>
        </div>

        {showBackgroundImage && (
          <div className={`loading-background-image ${shouldFadeOutForReturn ? 'return-fade-out' : ''}`}>
            <img
              src={loadingImage}
              alt="Founders House"
              className="background-image-layer background-image-static"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        )}

        {showLogo && (
          <div
            className={`loading-logo ${shouldBlurLogo ? 'blur-out' : ''} ${shouldFadeOutForReturn ? 'return-fade-out' : ''}`}
            style={{ height: '76px', width: 'auto' }}
          >
            <img src="/assets/logos/fhlogo_horizontal.png" alt="Founders House" style={{ height: '100%', width: 'auto', display: 'block' }} />
          </div>
        )}
        {showLoadingBar && (
          <div className="loading-bar-container">
            <div ref={loadingBarRef} className="loading-bar" />
          </div>
        )}

        {showPixelTransition && (
          <div className="blocks-container">
            {blocks.map((block) => (
              <div
                key={block.id}
                className={`block${stage === 'return-pixel-out' ? ' pixel-out' : ' pixel-reveal'}`}
                style={{
                  left: `${block.x}%`,
                  top: `${block.y}%`,
                  width: `${block.width}%`,
                  height: `${block.height}%`,
                  animationDelay: stage === 'return-pixel-out' ? `${block.delay * 0.7}ms` : `${block.delay}ms`
                }}
              />
            ))}
          </div>
        )}

        <div
          className={`map-container${stage === 'map-slide-in' ? ' slide-in' : ''}${stage === 'map-expand' ? ' expand' : ''}${stage === 'return-pixel-out' ? ' return-pixel-out' : ''}${stage === 'complete' ? ' complete' : ''}`}
          style={{
            visibility: (stage === 'map-slide-in' || stage === 'map-expand' || stage === 'complete' || stage === 'return-pixel-out') ? 'visible' : 'hidden',
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
              scrollProgress={(stage === 'map-expand' || stage === 'complete' || stage === 'return-pixel-out') ? 1 : 0}
            />
          </div>
        </div>

        {showSkipButton && stage !== 'complete' && stage !== 'map-slide-in' && stage !== 'map-expand' && (
          <button
            className="skip-intro-button"
            onClick={handleSkip}
            aria-label="Skip to map"
          >
            skip
          </button>
        )}
      </div>
    </motion.div>
  )
}
