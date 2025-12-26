/**
 * Helsinki 3D Viewer Component
 * React + TypeScript component with Three.js and pencil shader effect
 */

import { useEffect, useRef, useState } from 'react'
import { HelsinkiScene } from '../core'
import type { RenderMode } from '../loaders'
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
  const [isDemoNightMode, setIsDemoNightMode] = useState<boolean>(false)
  const [isAdvancedCamera, setIsAdvancedCamera] = useState<boolean>(false)
  const [renderMode, setRenderMode] = useState<RenderMode>('textured-red')
  const [currentPOI, setCurrentPOI] = useState<{ name: string; description: string } | null>(null)
  const [cameraRotationX, setCameraRotationX] = useState<number>(0)

  useEffect(() => {
    if (!containerRef.current || !shouldLoad || shouldPause) return

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
      
      // Expose to window for console debugging
      ;(window as any).helsinkiScene = scene
      
      // Expose POI label setter to scene
      ;(window as any).showPOILabel = (name: string, description: string) => {
        setCurrentPOI({ name, description })
      }
      ;(window as any).hidePOILabel = () => {
        setCurrentPOI(null)
      }
      
      setStatus('Loading Helsinki 3D model...')

      // Animation loop with camera logging
      let lastLogTime = 0
      const logInterval = 2000 // Log every 2 seconds

      const animate = () => {
        if (sceneRef.current) {
          sceneRef.current.update()

          // Update camera rotation for hero text positioning (every frame)
          const camera = sceneRef.current.getCamera()
          const rotX = camera.rotation.x
          setCameraRotationX(rotX)

          // Log camera data periodically
          const now = Date.now()
          if (now - lastLogTime >= logInterval) {
            const scene = sceneRef.current as any
            const pos = camera.position
            const rotXDeg = rotX * 180 / Math.PI
            const rotY = camera.rotation.y * 180 / Math.PI
            const rotZ = camera.rotation.z * 180 / Math.PI

            console.log('📷 CAMERA:', {
              position: {
                x: Math.round(pos.x),
                y: Math.round(pos.y),
                z: Math.round(pos.z)
              },
              rotation: {
                x: rotXDeg.toFixed(1) + '°',
                y: rotY.toFixed(1) + '°',
                z: rotZ.toFixed(1) + '°'
              },
              target: scene.controls?.target ? {
                x: Math.round(scene.controls.target.x),
                y: Math.round(scene.controls.target.y),
                z: Math.round(scene.controls.target.z)
              } : 'N/A',
              height: Math.round(pos.y),
              distance: Math.round(Math.sqrt(
                Math.pow(pos.x - (scene.controls?.target?.x || 0), 2) +
                Math.pow(pos.y - (scene.controls?.target?.y || 0), 2) +
                Math.pow(pos.z - (scene.controls?.target?.z || 0), 2)
              ))
            })

            lastLogTime = now
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
      }
      if (sceneRef.current) {
        sceneRef.current.dispose()
        sceneRef.current = null
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

  const handleToggleDayNight = () => {
    if (sceneRef.current) {
      const newMode = !isDemoNightMode
      setIsDemoNightMode(newMode)
      // Call the toggle method on the scene
      sceneRef.current.toggleDayNightMode(newMode)
    }
  }

  const handleToggleAdvancedCamera = async () => {
    if (!sceneRef.current) return
    setStatus('Enabling advanced camera...')
    const ok = await sceneRef.current.enableAdvancedCamera()
    setIsAdvancedCamera(ok)
    setStatus(ok ? 'Advanced camera enabled' : 'Using fallback OrbitControls')
  }

  const handleRenderModeChange = (mode: RenderMode) => {
    setRenderMode(mode)
    setLoading(true)
    setTickerProgress(0)
    setModelLoaded(false)
    tickerStartTimeRef.current = Date.now() // Reset ticker timer

    // Reload scene with new render mode
    if (sceneRef.current && containerRef.current) {
      // Cancel existing animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      sceneRef.current.dispose()
      sceneRef.current = null

      const scene = new HelsinkiScene({
        container: containerRef.current,
        helsinkiCenter: { lat: 60.1699, lng: 24.9384 },
        radius: 2,
        renderMode: mode,
        isNightMode: isDemoNightMode,
        onLoadProgress: (progress) => {
          setStatus(`Loading... ${progress.toFixed(1)}%`)
        },
        onLoadComplete: () => {
          setModelLoaded(true)
          setStatus('Helsinki 3D - 2km radius')
        },
      })
      sceneRef.current = scene

      // Restart animation loop
      const animate = () => {
        if (sceneRef.current) {
          sceneRef.current.update()
          animationFrameRef.current = requestAnimationFrame(animate)
        }
      }
      animate()
    }
  }

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
        className={`helsinki-container ${renderMode === 'textured-red' || renderMode === 'no-texture-red' ? 'red-filter' : ''}`}
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

      {/* UI Overlay - Debug controls */}
      <div className="ui-overlay" style={{ opacity: scrollProgress >= 1 ? 1 : 0, transition: 'opacity 0.5s ease-out' }}>

        {/* Debug Controls - Hidden by default, can be toggled */}
        <div className="controls debug-controls">
          <div className="mode-selector">
            <label>Render Mode:</label>
            <select value={renderMode} onChange={(e) => handleRenderModeChange(e.target.value as RenderMode)}>
              <option value="wireframe">Wireframe</option>
              <option value="faint-buildings">Faint Buildings</option>
              <option value="textured">Textured</option>
              <option value="textured-red">Textured + Red Coat</option>
              <option value="no-texture-red">Red Coat (No Textures)</option>
            </select>
          </div>
          <button onClick={handleToggleDayNight}>
            {isDemoNightMode ? 'Day Mode' : 'Night Mode'}
          </button>
          <button onClick={handleToggleAdvancedCamera}>
            {isAdvancedCamera ? 'Advanced Camera' : 'Basic Camera'}
          </button>
        </div>

        <div className="status">{status}</div>
      </div>

      {/* Loading overlay removed - handled by main LoadingScreen component */}

      {/* POI Label Overlay */}
      {currentPOI && (
        <div className="poi-label">
          <div className="poi-label-content">
            <h2 className="poi-label-name">{currentPOI.name}</h2>
            <p className="poi-label-description">{currentPOI.description}</p>
          </div>
        </div>
      )}

      {/* Hero Text Overlay - "FOUNDERS HOUSE" */}
      {scrollProgress >= 1 && (
        <div
          className="hero-text-container"
          style={{
            // Simpler positioning - just use fixed offset for now
            // Camera tracking causes text to go off-screen
            transform: `translateY(0vh)`
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
