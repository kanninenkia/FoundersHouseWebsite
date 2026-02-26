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
  audioRef: React.MutableRefObject<HTMLAudioElement | null>
  audio2Ref: React.MutableRefObject<HTMLAudioElement | null>
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

export const LoadingScreen = ({ onComplete, duration, scrollProgress, isReturnVisit = false, audioRef, audio2Ref }: LoadingScreenProps) => {
  // Check sessionStorage directly to ensure we have the correct value on mount
  const isReturnVisitRef = useRef(sessionStorage.getItem('hasVisitedMap') === 'true')
  const isReturn = isReturnVisitRef.current
  
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
      '/assets/images/events/join-process.webp',
      '/assets/images/events/Wave x Maki Photo (2).webp',
      '/assets/images/events/Wave x Maki Photo.webp',
      '/assets/images/membership/FH_people1.webp',
      '/assets/images/events/FH_zechen.webp'
    ]
    const randomIndex = Math.floor(Math.random() * images.length)
    return images[randomIndex]
  })

  const [showSkipButton, setShowSkipButton] = useState(false)
  const [hasSkipped, setHasSkipped] = useState(false)
  const [waitingForConsent, setWaitingForConsent] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    // Restore user's audio preference from localStorage
    try {
      const saved = localStorage.getItem('fh_audio_muted')
      return saved !== 'true' // Invert because soundEnabled is opposite of muted
    } catch {
      return true // Default to sound enabled
    }
  })
  const consentGivenRef = useRef(false)
  const startTimeRef = useRef<number>(0)
  const pausedAtRef = useRef<number>(0)
  const resumeOffsetRef = useRef<number>(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const lowPassFilterRef = useRef<BiquadFilterNode | null>(null)

  // Initialize audio on return visits
  // Note: Volume is controlled by Web Audio API gain nodes in App.tsx
  useEffect(() => {
    if (isReturn && audioRef.current && audio2Ref.current) {
      // Try to start playback (required for Web Audio to work)
      audioRef.current.play().catch(_err => {
        // console.log('Audio autoplay on return visit:', _err.message)
      })

      // Delay ambience by 2 seconds
      setTimeout(() => {
        if (audio2Ref.current) {
          audio2Ref.current.play().catch(_err => {
            // console.log('Ambience autoplay on return visit:', _err.message)
          })
        }
      }, 2000)
    }
  }, [isReturn, audioRef, audio2Ref])

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

  const handleEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    consentGivenRef.current = true
    setFadeOutText1(true)

    // Play audio based on user preference with fade-in using Web Audio API gain nodes
    if (audioRef.current && audio2Ref.current) {
      // Resume AudioContext on user interaction (required by browsers)
      const audioContext = (window as any).__audioContext
      const gainNodeRef = (window as any).__gainNodeRef
      const gain2NodeRef = (window as any).__gain2NodeRef
      const isUserMutedRef = (window as any).__isUserMutedRef

      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume()
      }

      // Play music immediately
      audioRef.current.play()
        .catch(err => {
          console.error('❌ Music play failed:', err)
        })

      // Delay ambience by 2 seconds
      setTimeout(() => {
        if (audio2Ref.current) {
          audio2Ref.current.play()
            .catch(err => {
              console.error('❌ Ambience play failed:', err)
            })
        }
      }, 2000)

      // Set user muted state
      if (isUserMutedRef) {
        isUserMutedRef.current = !soundEnabled
      }

      // Save preference to localStorage
      try {
        localStorage.setItem('fh_audio_muted', (!soundEnabled).toString())
      } catch (err) {
        console.error('Failed to save audio preference:', err)
      }

      // Fade in using Web Audio API gain nodes (smooth exponential ramp)
      if (audioContext && gainNodeRef?.current && gain2NodeRef?.current) {
        const currentTime = audioContext.currentTime
        const fadeInDuration = 2.0 // 2 seconds

        // Target volumes based on user preference
        const targetMusicVolume = soundEnabled ? 0.5 : 0
        const targetAmbienceVolume = soundEnabled ? 0.5 : 0 // 0.5 on map page

        // Fade in music immediately using exponential ramp for smoothness
        gainNodeRef.current.gain.cancelScheduledValues(currentTime)
        gainNodeRef.current.gain.setValueAtTime(0, currentTime)
        gainNodeRef.current.gain.linearRampToValueAtTime(targetMusicVolume, currentTime + fadeInDuration)

        // Fade in ambience after 2-second delay
        gain2NodeRef.current.gain.cancelScheduledValues(currentTime)
        gain2NodeRef.current.gain.setValueAtTime(0, currentTime)
        gain2NodeRef.current.gain.linearRampToValueAtTime(targetAmbienceVolume, currentTime + 2 + fadeInDuration)

        // console.log(`🎵 Audio fade-in started: music=${targetMusicVolume}, ambience=${targetAmbienceVolume}`)
      }
    } else {
      console.error('❌ No audio element found!')
    }

    // Small delay before removing button to allow fade animation
    setTimeout(() => setWaitingForConsent(false), 400)
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
    // Adjust grid size for mobile to prevent squished pixels (matches TransitionOverlay)
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1
    const cols = isMobile ? 10 : 18
    const rows = isMobile
      ? Math.max(1, Math.ceil(cols * (viewportHeight / viewportWidth)))
      : 10
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

    // Initialize startTime only once
    if (startTimeRef.current === 0) {
      startTimeRef.current = Date.now()
    }

    const checkInterval = setInterval(() => {
      // If waiting for consent, pause the timer
      if (waitingForConsent && pausedAtRef.current === 0) {
        pausedAtRef.current = Date.now() - startTimeRef.current
      }
      
      // If consent was given, calculate resume offset
      if (consentGivenRef.current && pausedAtRef.current > 0 && resumeOffsetRef.current === 0) {
        resumeOffsetRef.current = Date.now() - startTimeRef.current - pausedAtRef.current
      }
      
      const elapsed = waitingForConsent ? pausedAtRef.current : (Date.now() - startTimeRef.current - resumeOffsetRef.current)

      if (isReturn) {
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
        if (elapsed >= 500 && elapsed < 1300) {
          setStage('logo-blur')
        } else if (elapsed >= 1300 && elapsed < 2800) {
          setStage('pixel-out-to-text1')
        } else if (elapsed >= 2800 && !waitingForConsent && !consentGivenRef.current) {
          // Reached text1 stage - wait for user consent
          setStage('text1')
          setWaitingForConsent(true)
        } else if (consentGivenRef.current && elapsed >= 2800 && elapsed < 4200) {
          // After consent given, show text1 for 1.4 seconds before transitioning
          setStage('text1')
        } else if (elapsed >= 4200 && elapsed < 6400) {
          setStage('text2')
        } else if (elapsed >= 6400 && elapsed < 6900) {
          setStage('map-slide-in')
        } else if (elapsed >= 9000 && elapsed < 10500) {
          setStage('map-expand')
        } else if (elapsed >= 10500) {
          setStage('complete')
          clearInterval(checkInterval)
        }
      }
    }, 50)

    return () => {
      clearInterval(checkInterval)
    }
  }, [canProceedToBlur, scrollProgress, hasSkipped, shouldSkipIntro, isReturn, waitingForConsent])

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
    if (stage === 'text1') {
      showTimeout = setTimeout(() => setShowText1Delayed(true), 300)
    } else {
      setShowText1Delayed(false)
      setFadeOutText1(false)
    }
    return () => {
      if (showTimeout) clearTimeout(showTimeout)
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
              {waitingForConsent && (
                <div className="enter-buttons-wrapper">
                  <button
                    type="button"
                    className="enter-button"
                    onClick={handleEnter}
                    aria-label="Enter site"
                    style={{ pointerEvents: 'auto' }}
                  >
                    enter
                  </button>
                  <button
                    type="button"
                    className={`sound-toggle-button ${soundEnabled ? '' : 'muted'}`}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSoundEnabled(!soundEnabled)
                    }}
                    aria-label={soundEnabled ? 'Disable sound' : 'Enable sound'}
                    style={{ pointerEvents: 'auto' }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M11 5L6 9H2v6h4l5 4V5z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                      {soundEnabled ? (
                        <>
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M18.07 5.93a9 9 0 0 1 0 12.73" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </>
                      ) : (
                        <>
                          <line x1="16" y1="9" x2="22" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          <line x1="22" y1="9" x2="16" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              )}
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
              audioRef={audioRef}
              audio2Ref={audio2Ref}
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
