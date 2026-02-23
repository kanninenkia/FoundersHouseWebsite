/**
 * NavBar - Unified navigation component
 * Logo on left, Hamburger menu on right
 * Used across all pages for consistent navigation
 */

import { useState, useEffect } from 'react'
import { useTransition } from '../transitions/TransitionContext'
import { AnimatedHamburger } from '../ui'
import { FullScreenMenu } from './FullScreenMenu'
import './NavBar.css'

interface NavBarProps {
  logoColor?: 'light' | 'dark' // 'light' = logo.svg (red), 'dark' = logoWhite.png
  hamburgerColor?: string
  streakColor?: string // Color of the hover streak animation
  className?: string
  style?: React.CSSProperties
  opacity?: number // Control visibility with smooth transition
  onMenuChange?: (isOpen: boolean) => void // Callback when menu state changes
  audioRef?: React.MutableRefObject<HTMLAudioElement | null> // Audio control
  audio2Ref?: React.MutableRefObject<HTMLAudioElement | null> // Second audio control
}

export const NavBar = ({ 
  logoColor = 'light', 
  hamburgerColor = '#D82E11',
  streakColor = 'rgba(255, 255, 255, 1)',
  className = '',
  style = {},
  opacity = 1,
  onMenuChange,
  audioRef,
  audio2Ref
}: NavBarProps) => {
  const { navigateWithTransition } = useTransition()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMuted, setIsMuted] = useState(() => {
    // Simple check: if audio is playing, it's not muted
    if (audioRef?.current && !audioRef.current.paused) {
      return false
    }
    
    // If audio hasn't started yet, check isUserMutedRef
    const isUserMutedRef = (window as any).__isUserMutedRef
    if (isUserMutedRef !== undefined) {
      return isUserMutedRef.current
    }
    
    // Default: show as muted if audio not initialized
    return true
  })

  // Sync muted state with audio playing state and user mute preference
  useEffect(() => {
    const audio = audioRef?.current
    if (!audio) return
    
    const isUserMutedRef = (window as any).__isUserMutedRef
    
    const updateMutedState = () => {
      // If user manually muted, respect that
      if (isUserMutedRef?.current === true) {
        setIsMuted(true)
        return
      }
      
      // Otherwise, check if audio is playing
      setIsMuted(audio.paused)
    }

    // Listen to play/pause events for immediate updates
    audio.addEventListener('play', updateMutedState)
    audio.addEventListener('pause', updateMutedState)
    
    // Check periodically in case state changes
    const interval = setInterval(updateMutedState, 1000)
    
    // Initial check
    updateMutedState()

    return () => {
      audio.removeEventListener('play', updateMutedState)
      audio.removeEventListener('pause', updateMutedState)
      clearInterval(interval)
    }
  }, [audioRef])

  const handleMenuToggle = () => {
    const newState = !isMenuOpen
    setIsMenuOpen(newState)
    onMenuChange?.(newState)
  }

  const toggleAudio = () => {
    if (audioRef?.current) {
      const gainNodeRef = (window as any).__gainNodeRef
      const gain2NodeRef = (window as any).__gain2NodeRef
      const isUserMutedRef = (window as any).__isUserMutedRef
      const audioContext = (window as any).__audioContext
      const isMapPage = window.location.pathname === '/'

      if (isMuted) {
        // UNMUTING - volumes depend on current page

        // Resume AudioContext if suspended (required after direct navigation)
        if (audioContext && audioContext.state === 'suspended') {
          audioContext.resume().then(() => {
            // console.log('✅ AudioContext resumed from NavBar toggle')
          })
        }

        // Audio 1 (music): Always goes to 0.5 when unmuting
        if (gainNodeRef?.current && audioContext) {
          gainNodeRef.current.gain.setTargetAtTime(0.5, audioContext.currentTime, 0.3)
        }

        // Audio 2 (ambience): 0.5 on map page, 0 on other pages
        if (gain2NodeRef?.current && audioContext) {
          const targetVolume = isMapPage ? 0.5 : 0
          gain2NodeRef.current.gain.setTargetAtTime(targetVolume, audioContext.currentTime, 0.3)
        }

        // Ensure audio is playing
        if (audioRef.current.paused) {
          audioRef.current.play().catch(err => console.error('Audio play failed:', err))
        }
        if (audio2Ref?.current && audio2Ref.current.paused) {
          audio2Ref.current.play().catch(err => console.error('Audio2 play failed:', err))
        }

        // Update mute state
        if (isUserMutedRef) {
          isUserMutedRef.current = false
        }
        // Save preference to localStorage
        try {
          localStorage.setItem('fh_audio_muted', 'false')
        } catch (err) {
          console.error('Failed to save audio preference:', err)
        }
        setIsMuted(false)

        // console.log(`🔊 Audio unmuted on ${isMapPage ? 'map' : 'non-map'} page: music=0.5, ambience=${isMapPage ? '0.5' : '0'}`)
      } else {
        // MUTING - both tracks go to 0 regardless of page

        if (gainNodeRef?.current && audioContext) {
          gainNodeRef.current.gain.setTargetAtTime(0, audioContext.currentTime, 0.3)
        }
        if (gain2NodeRef?.current && audioContext) {
          gain2NodeRef.current.gain.setTargetAtTime(0, audioContext.currentTime, 0.3)
        }

        // Update mute state
        if (isUserMutedRef) {
          isUserMutedRef.current = true
        }
        // Save preference to localStorage
        try {
          localStorage.setItem('fh_audio_muted', 'true')
        } catch (err) {
          console.error('Failed to save audio preference:', err)
        }
        setIsMuted(true)

        // console.log('🔇 Audio muted: music=0, ambience=0')
      }
    }
  }

  const logoSrc = logoColor === 'light' 
    ? '/assets/logos/FH_Helsinki_Logo.webp' 
    : '/assets/logos/FH_Helsinki_Logo_Light.webp'

  return (
    <>
      <nav className={`navbar ${className}`} style={style}>
        {/* Logo - Left */}
        <div 
          className="navbar-logo-container"
          style={{
            opacity,
            transition: 'opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
            pointerEvents: opacity > 0 ? 'auto' : 'none'
          }}
        >
          <button
            onClick={() => {
              navigateWithTransition('/')
            }}
            style={{ 
              display: 'block', 
              lineHeight: 0, 
              background: 'none', 
              border: 'none', 
              padding: 0, 
              cursor: 'pointer' 
            }}
          >
            <img src={logoSrc} alt="Founders House Logo" className="navbar-logo" />
          </button>
        </div>

        {/* Right side controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Sound Toggle */}
          {audioRef && (
            <button
              className="navbar-sound-toggle"
              onClick={toggleAudio}
              aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
              style={{
                opacity,
                transition: 'opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
                pointerEvents: opacity > 0 ? 'auto' : 'none'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M11 5L6 9H2v6h4l5 4V5z"
                  stroke={hamburgerColor}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                {!isMuted ? (
                  <>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke={hamburgerColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M18.07 5.93a9 9 0 0 1 0 12.73" stroke={hamburgerColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                ) : (
                  <>
                    <line x1="16" y1="9" x2="22" y2="15" stroke={hamburgerColor} strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="22" y1="9" x2="16" y2="15" stroke={hamburgerColor} strokeWidth="1.5" strokeLinecap="round" />
                  </>
                )}
              </svg>
            </button>
          )}

          {/* Hamburger Menu */}
          <div 
            className="navbar-hamburger"
            style={{
              opacity,
              transition: 'opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
              pointerEvents: opacity > 0 ? 'auto' : 'none'
            }}
          >
            <AnimatedHamburger
              isOpen={isMenuOpen}
              onClick={handleMenuToggle}
              streakColor={streakColor}
              color={hamburgerColor}
            />
          </div>
        </div>
      </nav>

      <FullScreenMenu isOpen={isMenuOpen} onClose={() => {
        setIsMenuOpen(false)
        onMenuChange?.(false)
      }} currentPage={window.location.pathname} />
    </>
  )
}