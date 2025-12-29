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

  // Night mode is disabled - always use day mode
  const isDemoNightMode = false

  useEffect(() => {
    if (!containerRef.current || !shouldLoad || shouldPause) return

    // CRITICAL: Cleanup any existing scene before creating new one
    // This prevents memory leaks during HMR (Hot Module Reload)
    if (sceneRef.current) {
      console.warn('Cleaning up existing scene before creating new one (HMR)')
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

          // Fade based on distance from center
          const maxDistance = Math.max(distanceFromCenterX, distanceFromCenterY)
          const opacity = isInCenter ? Math.max(0, Math.min(1, 1 - (maxDistance / threshold))) : 0
          setHeroTextOpacity(opacity)

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
      console.log('HelsinkiViewer cleanup: disposing scene and canceling animation')

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
        // Use the focusPOI method to smoothly transition to the selected POI
        ;(sceneRef.current as any).focusPOI(poiKey)
      }
    }
  }

  return (
    <>
      <div
        ref={containerRef}
        className="helsinki-container"
      />

      {/* Logo - Top Left */}
      {scrollProgress >= 1 && (
        <div className="logo-container">
          <img src="/logo.svg" alt="Founders House Logo" className="cube-logo" />
        </div>
      )}

      {/* Hamburger Menu - Top Right */}
      {scrollProgress >= 1 && (
        <div className="hamburger-menu">
          <img src="/hamburger.svg" alt="Menu" className="hamburger-icon" />
        </div>
      )}

      {/* Status overlay */}
      <div className="ui-overlay" style={{ opacity: scrollProgress >= 1 ? 1 : 0, transition: 'opacity 0.5s ease-out' }}>
        <div className="status">{status}</div>
      </div>

      {/* Loading overlay removed - handled by main LoadingScreen component */}

      {/* Hero Text Overlay - "FOUNDERS HOUSE" */}
      {scrollProgress >= 1 && (
        <div
          className="hero-text-container"
          style={{
            // Simpler positioning - just use fixed offset for now
            // Camera tracking causes text to go off-screen
            transform: `translateY(0vh)`,
            opacity: heroTextOpacity,
            transition: 'opacity 0.3s ease-out'
          }}
        >
          <div className="hero-text-wrapper">
            <div className="hero-subtext-row">
              <p className="hero-subtext hero-subtext-left">Built for the obsessed.</p>
              <p className="hero-subtext hero-subtext-right">Built for the exceptional.</p>
            </div>
            <h1 className="hero-title">
              <span className="hero-title-founders">FOUNDERS</span> <span className="hero-title-house">HOUSE</span>
            </h1>
          </div>
        </div>
      )}


      {/* POI Navigator - Bottom navigation bar */}
      {scrollProgress >= 1 && (
        <POINavigator onPOISelect={handlePOISelect} initialPOI="FOUNDERS_HOUSE" />
      )}

    </>
  )
}

export default HelsinkiViewer
