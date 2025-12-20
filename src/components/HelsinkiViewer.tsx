/**
 * Helsinki 3D Viewer Component
 * React + TypeScript component with Three.js and pencil shader effect
 */

import { useEffect, useRef, useState } from 'react'
import { HelsinkiScene } from '../core'
import type { RenderMode } from '../loaders'
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

  useEffect(() => {
    if (!containerRef.current || !shouldLoad || shouldPause) return

    // Use requestIdleCallback to load map during browser idle time (non-blocking)
    const idleCallback = (window as any).requestIdleCallback || ((cb: Function) => setTimeout(cb, 1))

    const idleHandle = idleCallback(() => {
      if (!containerRef.current || shouldPause) return

      try {
        // Initialize Helsinki scene during idle time
        const scene = new HelsinkiScene({
          container: containerRef.current,
          helsinkiCenter: {
            lat: 60.1699,
            lng: 24.9384,
          },
          radius: 2, // 2km radius
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

      // Animation loop
      const animate = () => {
        if (sceneRef.current) {
          sceneRef.current.update()
          animationFrameRef.current = requestAnimationFrame(animate)
        }
      }

      animate()
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        setStatus('Error: ' + message)
        setLoading(false)
      }
    })

    // Cleanup
    return () => {
      const cancelIdleCallback = (window as any).cancelIdleCallback || clearTimeout
      cancelIdleCallback(idleHandle)

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (sceneRef.current) {
        sceneRef.current.dispose()
        sceneRef.current = null
      }
    }
  }, [shouldLoad, shouldPause])

  // Independent ticker animation - runs smoothly from 0-100 over ~2.5 seconds
  useEffect(() => {
    if (!loading) return

    let raf = 0
    const TICKER_DURATION = 2500 // 2.5 seconds to reach 100

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

      // Keep animating - the cleanup or loading state change will cancel it
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
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

  return (
    <>
      <div
        ref={containerRef}
        className={`helsinki-container ${renderMode === 'textured-red' || renderMode === 'no-texture-red' ? 'red-filter' : ''}`}
      />

      {/* UI Overlay - Chartogne style */}
      <div className="ui-overlay" style={{ opacity: scrollProgress >= 1 ? 1 : 0, transition: 'opacity 0.5s ease-out' }}>        <div className="main-cta">
          <img src="/FHLOGO.png" alt="FH Logo" className="fh-logo" />
        </div>

        <div className="controls">
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
    </>
  )
}

export default HelsinkiViewer
