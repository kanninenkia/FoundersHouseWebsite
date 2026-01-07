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
}

export const HelsinkiViewer = ({ shouldLoad = true, shouldPause = false, scrollProgress = 0, onMapLoadingChange }: HelsinkiViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HelsinkiScene | null>(null)
  const animationFrameRef = useRef<number>(0)
  const tickerStartTimeRef = useRef<number>(Date.now())

  const [status, setStatus] = useState<string>('Initializing...')
  const [loading, setLoading] = useState<boolean>(true)
  const [tickerProgress, setTickerProgress] = useState<number>(0)
  const [modelLoaded, setModelLoaded] = useState<boolean>(false)
  const [grayscaleAmount, setGrayscaleAmount] = useState<number>(75) // BRIGHTNESS: Moderate grayscale 75% (was 90% too dark, 60% too bright)
  const [heroTextOpacity, setHeroTextOpacity] = useState<number>(1) // Hero text opacity based on camera direction
  // New staged fade-in states
  const [showHeroText, setShowHeroText] = useState(false)
  const [showUI, setShowUI] = useState(false)
  const fadeTimers = useRef<{ hero?: NodeJS.Timeout; ui?: NodeJS.Timeout }>({})

  // Camera flying state for vignette effect
  const [isCameraFlying, setIsCameraFlying] = useState(false)

  // Menu state for hamburger animation
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Idle detection state
  const lastInteractionTime = useRef<number>(Date.now())
  const initialLoadTime = useRef<number>(Date.now())

  // Dragging state for cursor
  const [isDragging, setIsDragging] = useState(false)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })

  // "Drag & Explore" indicator state - shows until first interaction
  const [showDragIndicator, setShowDragIndicator] = useState(true)
  const hasInteractedRef = useRef(false)

  // Transition state is now managed by App.tsx (accessed via window globals)
  const [isTransitionActive, setIsTransitionActive] = useState(false)

  // Track dragging and cursor position for indicator
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

  // Staged fade-in logic for hero text and UI after map expands
  useEffect(() => {
    // Only trigger when scrollProgress transitions to 1
    if (scrollProgress >= 1) {
      // Reset states in case of repeated triggers
      setShowHeroText(false)
      setShowUI(false)
      // Clear any previous timers
      if (fadeTimers.current.hero) clearTimeout(fadeTimers.current.hero)
      if (fadeTimers.current.ui) clearTimeout(fadeTimers.current.ui)
      // Hero text after 800ms (reduced from 1s for snappier feel)
      fadeTimers.current.hero = setTimeout(() => {
        setShowHeroText(true)
      }, 800)
      // UI after 1.8s (800ms + 1s - reduced from 2.2s)
      fadeTimers.current.ui = setTimeout(() => {
        setShowUI(true)
      }, 1800)
    } else {
      // If user scrolls back, hide all and clear timers
      setShowHeroText(false)
      setShowUI(false)
      if (fadeTimers.current.hero) clearTimeout(fadeTimers.current.hero)
      if (fadeTimers.current.ui) clearTimeout(fadeTimers.current.ui)
    }
    return () => {
      if (fadeTimers.current.hero) clearTimeout(fadeTimers.current.hero)
      if (fadeTimers.current.ui) clearTimeout(fadeTimers.current.ui)
    }
  }, [scrollProgress])

  // Night mode is disabled - always use day mode
  const isDemoNightMode = false

  useEffect(() => {
    if (!containerRef.current || !shouldLoad || shouldPause) return

    // CRITICAL: Cleanup any existing scene before creating new one
    // This prevents memory leaks during HMR (Hot Module Reload)
    if (sceneRef.current) {
      sceneRef.current.dispose()
      sceneRef.current = null
    }

    // Initialize immediately - no setTimeout/requestIdleCallback
    // This ensures loading starts even in background tabs
    try {
      // Initialize Helsinki scene
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
        })

      sceneRef.current = scene

      setStatus('Loading Helsinki 3D model...')

      const animate = () => {
        if (sceneRef.current) {
          sceneRef.current.update()

          // Update camera rotation for hero text positioning (every frame)
          const camera = sceneRef.current.getCamera()

          // Calculate hero text opacity based on Founders House viewport position
          // Hero text should only appear when Founders House is near center of screen

          // Founders House position (updated)
          const foundersHousePos = new THREE.Vector3(30.77, -20.14, -533.42)

          // Project Founders House position to screen coordinates
          const screenPos = foundersHousePos.clone()
          screenPos.project(camera)

          // Convert from normalized device coordinates (-1 to 1) to viewport percentage (0 to 100)
          const viewportX = (screenPos.x + 1) * 50  // 0-100%
          const viewportY = (1 - screenPos.y) * 50  // 0-100% (flip Y axis)

          // Calculate distance from target point (50% horizontal, 65% vertical)
          const centerX = 50
          const centerY = 65
          const distanceFromCenterX = Math.abs(viewportX - centerX)
          const distanceFromCenterY = Math.abs(viewportY - centerY)

          // Show hero text when Founders House is within 13vh/vw of center
          const threshold = 13
          const isInCenter = distanceFromCenterX <= threshold && distanceFromCenterY <= threshold

          // Binary visibility: fully opaque when in range, hidden when not
          const opacity = isInCenter ? 1 : 0
          setHeroTextOpacity(opacity)

          // Auto-centering logic: if hero text is visible and user has been idle for 3+ seconds
          const now = Date.now()
          const timeSinceLastInteraction = now - lastInteractionTime.current
          const timeSinceLoad = now - initialLoadTime.current
          const idleThreshold = 3000 // 3 seconds
          const initialLoadDelay = 15000 // 15 seconds - don't drift until after initial load period

          if (isInCenter && timeSinceLastInteraction >= idleThreshold && timeSinceLoad >= initialLoadDelay) {
            // Gradual rotation to center FH at the hero text sweet spot (50% horizontal, 65% vertical)
            // This is a subtle drift, not a camera fly-to

            // Calculate how far off-center FH currently is (in viewport %)
            const offsetX = viewportX - centerX // Horizontal offset from target
            const offsetY = viewportY - centerY // Vertical offset from target

            // Only apply adjustment if there's a meaningful offset
            // Stop drifting when we're close to perfect center (< 2% offset)
            // Also ensure offsets are not too large (safety check to prevent camera flying away)
            const maxSafeOffset = 20 // Max 20% viewport offset
            if ((Math.abs(offsetX) > 2 || Math.abs(offsetY) > 2) &&
                Math.abs(offsetX) < maxSafeOffset && Math.abs(offsetY) < maxSafeOffset) {
              const controls = sceneRef.current.getControls()
              if (controls && controls.target) {
                // Get current target position
                const currentTarget = controls.target.clone()

                // Get camera's right and up vectors in world space
                const right = new THREE.Vector3()
                const worldUp = new THREE.Vector3(0, 1, 0)
                camera.getWorldDirection(right)
                right.crossVectors(worldUp, right).normalize()

                const cameraUp = new THREE.Vector3()
                cameraUp.crossVectors(right, camera.getWorldDirection(new THREE.Vector3())).normalize()

                // Convert viewport offset to world space adjustment
                // Negative offsetX means FH is too far right, need to move target right
                // Negative offsetY means FH is too far down, need to move target down
                const driftSpeed = 0.3 // Much faster, frame-rate independent
                const worldAdjustment = new THREE.Vector3()
                worldAdjustment.addScaledVector(right, -offsetX * driftSpeed)
                worldAdjustment.addScaledVector(cameraUp, offsetY * driftSpeed)

                // Apply the adjustment to camera target
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

      // Force garbage collection hint by clearing container
      if (containerRef.current) {
        // Remove all canvas elements to ensure cleanup
        const canvases = containerRef.current.querySelectorAll('canvas')
        canvases.forEach(canvas => canvas.remove())
      }
    }
  }, [shouldLoad, shouldPause, isDemoNightMode])

  // Control parallax based on scroll progress - disable during animation, enable at fullscreen
  useEffect(() => {
    if (!sceneRef.current) return

    // Disable parallax when map is animating (scrollProgress < 1)
    // Enable parallax when map reaches fullscreen (scrollProgress >= 1)
    sceneRef.current.setParallaxEnabled(scrollProgress >= 1)
  }, [scrollProgress])

  // Track user interactions for idle detection
  useEffect(() => {
    let lastMouseX = 0
    let lastMouseY = 0

    const handleMouseInteraction = (event: MouseEvent) => {
      // For mousemove, only count as interaction if mouse actually moved
      if (event.type === 'mousemove') {
        if (event.clientX === lastMouseX && event.clientY === lastMouseY) {
          return // Mouse didn't actually move, ignore
        }
        lastMouseX = event.clientX
        lastMouseY = event.clientY
      }

      lastInteractionTime.current = Date.now()
      
      // Hide drag indicator on first interaction
      if (!hasInteractedRef.current) {
        hasInteractedRef.current = true
        setShowDragIndicator(false)
      }
    }

    const handleTouchInteraction = () => {
      lastInteractionTime.current = Date.now()
      
      // Hide drag indicator on first interaction
      if (!hasInteractedRef.current) {
        hasInteractedRef.current = true
        setShowDragIndicator(false)
      }
    }

    const handleWheelInteraction = () => {
      lastInteractionTime.current = Date.now()
      
      // Hide drag indicator on first interaction
      if (!hasInteractedRef.current) {
        hasInteractedRef.current = true
        setShowDragIndicator(false)
      }
    }

    // Listen for all interaction types
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

  // Wheel event listener to control grayscale slider - bidirectional and very gradual
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      setGrayscaleAmount(prev => {
        // Scroll down (positive deltaY) = reduce grayscale
        // Scroll up (negative deltaY) = increase grayscale
        // BRIGHTNESS: Max changed to 75% to match new starting point
        const change = event.deltaY > 0 ? -0.3 : 0.3
        const newAmount = Math.max(0, Math.min(75, prev + change))
        return newAmount
      })
    }

    window.addEventListener('wheel', handleWheel)
    return () => window.removeEventListener('wheel', handleWheel)
  }, [])

  // Apply grayscale dynamically to canvas
  useEffect(() => {
    if (!containerRef.current) return

    const canvas = containerRef.current.querySelector('canvas')
    if (canvas) {
      canvas.style.filter = `grayscale(${grayscaleAmount}%) brightness(1.50) contrast(0.88)` // BRIGHTNESS: Moderate 1.50 (was 1.38 too dark, 1.65 too bright)
    }
  }, [grayscaleAmount])


  // Independent ticker animation - runs smoothly from 0-100 over ~2.5 seconds
  // Uses setInterval instead of requestAnimationFrame to ensure it runs even when tab is inactive
  useEffect(() => {
    if (!loading) return

    const TICKER_DURATION = 2500 // 2.5 seconds to reach 100
    const UPDATE_INTERVAL = 16 // ~60fps (16ms per frame)

    const tick = () => {
      const elapsed = Date.now() - tickerStartTimeRef.current
      const timeBasedProgress = Math.min((elapsed / TICKER_DURATION) * 100, 100)

      setTickerProgress((prev) => {
        // Smoothly interpolate towards time-based progress
        const target = timeBasedProgress
        const distance = target - prev

        if (Math.abs(distance) < 0.1) return target

        // Smooth easing
        const increment = distance * 0.1
        return prev + increment
      })
    }

    // Use setInterval instead of requestAnimationFrame to continue in background
    const intervalId = setInterval(tick, UPDATE_INTERVAL)
    return () => clearInterval(intervalId)
  }, [loading])

  // Hide loading screen when both ticker reaches ~100 AND model is loaded
  useEffect(() => {
    if (modelLoaded && tickerProgress >= 99) {
      // Small delay to ensure user sees 100%
      const timer = setTimeout(() => {
        setLoading(false)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [modelLoaded, tickerProgress])

  // Failsafe: Force hide loading screen after 30 seconds (for very large models)
  useEffect(() => {
    const failsafeTimer = setTimeout(() => {
      if (loading) {
        setLoading(false)
        setModelLoaded(true)
      }
    }, 30000) // 30 seconds

    return () => clearTimeout(failsafeTimer)
  }, [loading])

  const handlePOISelect = (poi: PointOfInterest) => {
    if (sceneRef.current && (sceneRef.current as any).focusPOI) {
      // Find the POI key by matching the POI id
      const poiKey = Object.entries(POINTS_OF_INTEREST).find(
        ([_, poiObj]) => poiObj.id === poi.id
      )?.[0]

      if (poiKey) {
        // Enable vignette during camera transition
        setIsCameraFlying(true)

        // Use the focusPOI method to smoothly transition to the selected POI
        ;(sceneRef.current as any).focusPOI(poiKey)

        // Disable vignette after transition completes + extra time for gradual fade
        // 2.5s flight + 1.2s fade out = 3.7s total
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
          opacity: showUI && !isTransitionActive ? 1 : 0,
          transition: isTransitionActive
            ? 'opacity 1.5s cubic-bezier(0.22, 1, 0.36, 1)'
            : 'opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
          pointerEvents: showUI ? 'auto' : 'none',
        }}
        strength={0.25}
        range={120}
        rotate={true}
        rotateDegrees={5}
      >
        <img src="/logo.svg" alt="Founders House Logo" className="cube-logo" />
      </MagneticElement>

      {/* Hamburger Menu - Top Right with Magnetic Effect & Morph Animation */}
      <MagneticElement
        className="hamburger-menu"
        style={{
          opacity: showUI && !isTransitionActive ? 1 : 0,
          transition: isTransitionActive
            ? 'opacity 1.5s cubic-bezier(0.22, 1, 0.36, 1)'
            : 'opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
          pointerEvents: showUI ? 'auto' : 'none',
        }}
        strength={0.25}
        range={120}
      >
        <AnimatedHamburger
          isOpen={isMenuOpen}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        />
      </MagneticElement>

      {/* Status overlay */}
      <div
        className="ui-overlay"
        style={{
          opacity: showUI ? 1 : 0,
          transition: 'opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
          pointerEvents: 'none',
        }}
      >
        <div className="status">{status}</div>
      </div>

      {/* Hero Text Overlay - "FOUNDERS HOUSE" */}
      <div
        className="hero-text-container"
        style={{
          opacity: showHeroText ? heroTextOpacity : 0,
          transition: 'opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
          pointerEvents: 'none',
        }}
      >
        {/* "Drag & Explore" indicator - appears above hero text, disappears on first interaction */}
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
          
          {/* Vertical red line with "Learn more" at the end - only render when conditions are met */}
          {showHeroText && heroTextOpacity > 0.5 && (
            <div className="hero-line-wrapper">
              <div className="hero-vertical-line"></div>
              <a 
                href="#" 
                className="hero-learn-more clickable"
                onClick={(e) => {
                  e.preventDefault()

                  // Check if we're already transitioning
                  if (isTransitionActive) return

                  // Use global transition controls from App.tsx
                  const globalSetTransitionActive = (window as any).setTransitionActive

                // Mark transition as started (for UI hiding)
                setIsTransitionActive(true)

                // STEP 1: Start transition overlay immediately
                if (globalSetTransitionActive) {
                  globalSetTransitionActive(true)
                }

                // STEP 2: Cinematic zoom into FH center (1.2s)
                if (sceneRef.current) {
                  sceneRef.current.focusPOI('FOUNDERS_HOUSE', 100, -136, 22, 1.2, true, () => {

                    // STEP 3: Navigate immediately after zoom completes
                    // No red square animation, go straight to red page
                    if ((window as any).navigateToLearnMore) {
                      (window as any).navigateToLearnMore()
                    }

                    // STEP 4: Keep overlay active for flying squares to appear in LearnMore
                    // After navigation, squares fly through immediately
                    // Total duration: 1.2s (zoom) + 1.5s (for squares) = 2.7s
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

      {/* POI Navigator - Bottom navigation bar */}
      {/* Only render when showUI is true to trigger POI animations */}
      {showUI && (
        <div className="poi-navigator-wrapper">
          <POINavigator onPOISelect={handlePOISelect} initialPOI="FOUNDERS_HOUSE" />
        </div>
      )}

      {/* Drag cursor indicator - shows "EXPLORE" when dragging */}
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
    </>
  )
}

export default HelsinkiViewer
