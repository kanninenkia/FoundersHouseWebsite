/**
 * Helsinki 3D Viewer Component
 * React + TypeScript component with Three.js and pencil shader effect
 */

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { HelsinkiScene } from '../core'
import type { PointOfInterest } from '../constants/poi'
import { POINTS_OF_INTEREST } from '../constants/poi'
import { POINavigator } from './POINavigator'
import { MagneticElement } from './MagneticElement'
import { AnimatedHamburger } from './AnimatedHamburger'
import { FullScreenMenu } from './FullScreenMenu'
import './HelsinkiViewer.css'

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
}

export const HelsinkiViewer = ({
  shouldLoad = true,
  shouldPause = false,
  scrollProgress = 0,
  onMapLoadingChange,
  staticMode = false,
  environmentColor,
}: HelsinkiViewerProps) => {  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HelsinkiScene | null>(null)
  const animationFrameRef = useRef<number>(0)
  const tickerStartTimeRef = useRef<number>(Date.now())

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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const lastInteractionTime = useRef<number>(Date.now())
  const initialLoadTime = useRef<number>(Date.now())
  const [isDragging, setIsDragging] = useState(false)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [showDragIndicator, setShowDragIndicator] = useState(true)
  const hasInteractedRef = useRef(false)
  const [isTransitionActive, setIsTransitionActive] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY })
    }

    const handleMouseDown = () => setIsDragging(true)
    const handleMouseUp = () => setIsDragging(false)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  useEffect(() => {
    if (scrollProgress >= 1) {
      setShowHeroText(false)
      setShowUIState(false)
      if (fadeTimers.current.hero) clearTimeout(fadeTimers.current.hero)
      if (fadeTimers.current.ui) clearTimeout(fadeTimers.current.ui)
      fadeTimers.current.hero = setTimeout(() => {
        setShowHeroText(true)
      }, 800)
      fadeTimers.current.ui = setTimeout(() => {
        setShowUIState(true)
      }, 1800)
    } else {
      setShowHeroText(false)
      setShowUIState(false)
      if (fadeTimers.current.hero) clearTimeout(fadeTimers.current.hero)
      if (fadeTimers.current.ui) clearTimeout(fadeTimers.current.ui)
    }
    return () => {
      if (fadeTimers.current.hero) clearTimeout(fadeTimers.current.hero)
      if (fadeTimers.current.ui) clearTimeout(fadeTimers.current.ui)
    }
  }, [scrollProgress])

  const isDemoNightMode = false

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
      })
      sceneRef.current = scene

      setStatus('Loading Helsinki 3D model...')

      const animate = () => {
        if (sceneRef.current) {
          sceneRef.current.update()

          const camera = sceneRef.current.getCamera()
          const foundersHousePos = new THREE.Vector3(30.77, -20.14, -533.42)
          const screenPos = foundersHousePos.clone()
          screenPos.project(camera)

          const viewportX = (screenPos.x + 1) * 50
          const viewportY = (1 - screenPos.y) * 50

          const centerX = 50
          const centerY = 65
          const distanceFromCenterX = Math.abs(viewportX - centerX)
          const distanceFromCenterY = Math.abs(viewportY - centerY)

          const threshold = 13
          const isInCenter = distanceFromCenterX <= threshold && distanceFromCenterY <= threshold

          const opacity = isInCenter ? 1 : 0
          setHeroTextOpacity(opacity)

          const now = Date.now()
          const timeSinceLastInteraction = now - lastInteractionTime.current
          const timeSinceLoad = now - initialLoadTime.current
          const idleThreshold = 3000
          const initialLoadDelay = 15000

          if (isInCenter && timeSinceLastInteraction >= idleThreshold && timeSinceLoad >= initialLoadDelay) {
            const offsetX = viewportX - centerX
            const offsetY = viewportY - centerY

            const maxSafeOffset = 20
            if ((Math.abs(offsetX) > 2 || Math.abs(offsetY) > 2) &&
                Math.abs(offsetX) < maxSafeOffset && Math.abs(offsetY) < maxSafeOffset) {
              const controls = sceneRef.current.getControls()
              if (controls && controls.target) {
                const currentTarget = controls.target.clone()

                const right = new THREE.Vector3()
                const worldUp = new THREE.Vector3(0, 1, 0)
                camera.getWorldDirection(right)
                right.crossVectors(worldUp, right).normalize()

                const cameraUp = new THREE.Vector3()
                cameraUp.crossVectors(right, camera.getWorldDirection(new THREE.Vector3())).normalize()

                const driftSpeed = 0.3
                const worldAdjustment = new THREE.Vector3()
                worldAdjustment.addScaledVector(right, -offsetX * driftSpeed)
                worldAdjustment.addScaledVector(cameraUp, offsetY * driftSpeed)

                const newTarget = currentTarget.add(worldAdjustment)
                controls.setTarget(newTarget.x, newTarget.y, newTarget.z)
              }
            }
          }

          animationFrameRef.current = requestAnimationFrame(animate)
        }
      }

      animate()
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
  }, [scrollProgress])

  useEffect(() => {
    let lastMouseX = 0
    let lastMouseY = 0

    const handleMouseInteraction = (event: MouseEvent) => {
      if (event.type === 'mousemove') {
        if (event.clientX === lastMouseX && event.clientY === lastMouseY) {
          return
        }
        lastMouseX = event.clientX
        lastMouseY = event.clientY
      }

      lastInteractionTime.current = Date.now()

      if (!hasInteractedRef.current) {
        hasInteractedRef.current = true
        setShowDragIndicator(false)
      }
    }

    const handleTouchInteraction = () => {
      lastInteractionTime.current = Date.now()

      if (!hasInteractedRef.current) {
        hasInteractedRef.current = true
        setShowDragIndicator(false)
      }
    }

    const handleWheelInteraction = () => {
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
      canvas.style.filter = `grayscale(${grayscaleAmount}%) brightness(1.50) contrast(0.88)`
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

  const handlePOISelect = (poi: PointOfInterest) => {
    if (sceneRef.current && (sceneRef.current as any).focusPOI) {
      const poiKey = Object.entries(POINTS_OF_INTEREST).find(
        ([_, poiObj]) => poiObj.id === poi.id
      )?.[0]

      if (poiKey) {
        setIsCameraFlying(true)
        ;(sceneRef.current as any).focusPOI(poiKey)

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
      </div>


      {/* Logo - Top Left with Magnetic Effect & Rotation */}
      <MagneticElement
        className="logo-container"
        style={{
          opacity: showUIState && !isTransitionActive && !isMenuOpen ? 1 : 0,
          transition: isTransitionActive
            ? 'opacity 1.5s cubic-bezier(0.22, 1, 0.36, 1)'
            : 'opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
          pointerEvents: showUIState && !isMenuOpen ? 'auto' : 'none',
        }}
        strength={0.25}
        range={120}
        rotate={true}
        rotateDegrees={5}
      >
        <img src="/logos/logo.svg" alt="Founders House Logo" className="cube-logo" />
      </MagneticElement>

      <MagneticElement
        className="hamburger-menu"
        style={{
          opacity: showUIState && !isTransitionActive && !isMenuOpen ? 1 : 0,
          transition: isTransitionActive
            ? 'opacity 1.5s cubic-bezier(0.22, 1, 0.36, 1)'
            : 'opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
          pointerEvents: showUIState && !isMenuOpen ? 'auto' : 'none',
        }}
        strength={0.25}
        range={120}
      >
        <AnimatedHamburger
          isOpen={isMenuOpen}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          color="#D82E11"
        />
      </MagneticElement>

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
          opacity: showHeroText ? heroTextOpacity : 0,
          transition: 'opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
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
          <div className="hero-subtext-row">
            <p className="hero-subtext hero-subtext-left">Built for the obsessed.</p>
            <p className="hero-subtext hero-subtext-right">Built for the exceptional.</p>
          </div>
          <h1 className="hero-title">
            <span className="hero-title-founders">FOUNDERS</span> <span className="hero-title-house">HOUSE</span>
          </h1>

          {showHeroText && heroTextOpacity > 0.5 && (
            <div className="hero-line-wrapper">
              <div className="hero-vertical-line"></div>
              <a 
                href="#" 
                className="hero-learn-more clickable"
                onClick={(e) => {
                  e.preventDefault()

                  if (isTransitionActive) return

                  const globalSetTransitionActive = (window as any).setTransitionActive

                setIsTransitionActive(true)

                if (globalSetTransitionActive) {
                  globalSetTransitionActive(true)
                }

                if (sceneRef.current) {
                  sceneRef.current.focusPOI('FOUNDERS_HOUSE', 100, -136, 22, 1.2, true, () => {

                    if ((window as any).navigateToLearnMore) {
                      (window as any).navigateToLearnMore()
                    }

                    setTimeout(() => {
                      if (globalSetTransitionActive) {
                        globalSetTransitionActive(false)
                      }
                      setIsTransitionActive(false)
                    }, 1500)
                  }, true)
                }
              }}
            >
              Learn more
            </a>
          </div>
          )}
        </div>
      </div>

      {showUIState && (
        <div className="poi-navigator-wrapper">
          <POINavigator onPOISelect={handlePOISelect} initialPOI="FOUNDERS_HOUSE" />
        </div>
      )}

      {isDragging && scrollProgress >= 1 && (
        <div
          className="drag-cursor-indicator"
          style={{
            left: `${cursorPosition.x}px`,
            top: `${cursorPosition.y}px`,
          }}
        >
          <svg viewBox="0 0 50 50" className="cursor-circle">
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="#8B1215"
              strokeWidth="0.8"
              opacity="0.25"
            />
          </svg>
          <div className="cursor-label">EXPLORE</div>
        </div>
      )}

      <FullScreenMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  )
}

export default HelsinkiViewer
