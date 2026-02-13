import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { AnimatedHamburger } from '../ui'
import './FullScreenMenu.css'
import { useState, useRef, useEffect, useMemo } from 'react'

interface FullScreenMenuProps {
  isOpen: boolean
  onClose: () => void
  currentPage?: string
}

export const FullScreenMenu = ({ isOpen, onClose, currentPage = '/' }: FullScreenMenuProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const isDesktop = typeof window !== 'undefined' && window.innerWidth > 1024
  const rafRef = useRef<number | null>(null)
  const pendingMouseUpdate = useRef<{ x: number; y: number } | null>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktop) return
    
    const { clientX, clientY } = e
    const { innerWidth, innerHeight } = window
    
    // Normalize to -1 to 1
    const x = (clientX / innerWidth) * 2 - 1
    const y = (clientY / innerHeight) * 2 - 1
    
    // Store pending update
    pendingMouseUpdate.current = { x, y }
    
    // Only schedule RAF if not already scheduled
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        if (pendingMouseUpdate.current) {
          setMousePos(pendingMouseUpdate.current)
          pendingMouseUpdate.current = null
        }
        rafRef.current = null
      })
    }
  }

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  const handleNavigation = (path: string) => {
    if (path === '/') {
      sessionStorage.setItem('hasVisitedMap', 'true')
    }
    // Navigate first (start pixel transition), then close menu after pixels cover
    navigate(path)
    // Close menu after pixel transition starts (let pixels cover the menu too)
    setTimeout(() => {
      onClose()
    }, 100)
  }

  // Memoize styles to prevent recalculation
  const navStyle = useMemo(() => {
    if (!isDesktop) return {}
    return {
      transform: `translate(${mousePos.x * 5}px, ${mousePos.y * 5}px)`,
      transition: 'transform 1.2s cubic-bezier(0.17, 0.67, 0.3, 0.99)'
    }
  }, [mousePos.x, mousePos.y, isDesktop])

  const stockholmStyle = useMemo(() => {
    if (!isDesktop) return {}
    return {
      transform: `translate(${mousePos.x * 10}px, ${mousePos.y * 10}px)`,
      transition: 'transform 1s cubic-bezier(0.17, 0.67, 0.3, 0.99)'
    }
  }, [mousePos.x, mousePos.y, isDesktop])

  const mapStyle1 = useMemo(() => {
    if (!isDesktop) return { mixBlendMode: "multiply" as const, isolation: "isolate" as const, height: "100%", zIndex: 1 }
    return {
      mixBlendMode: "multiply" as const,
      isolation: "isolate" as const,
      height: "100%",
      zIndex: 1,
      transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`,
      transition: 'transform 2s cubic-bezier(0.17, 0.67, 0.3, 0.99)'
    }
  }, [mousePos.x, mousePos.y, isDesktop])

  const mapStyle2 = useMemo(() => {
    if (!isDesktop) return { height: "100%", zIndex: 2 }
    return {
      height: "100%",
      zIndex: 2,
      transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`,
      transition: 'transform 2.3s cubic-bezier(0.17, 0.67, 0.3, 0.99)'
    }
  }, [mousePos.x, mousePos.y, isDesktop])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fullscreen-menu ${currentPage !== '/' ? 'menu-red-hover' : ''}`}
          data-menu-open={isOpen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          onMouseMove={handleMouseMove}
        >
          {/*}
          <div className="menu-header">
            <img src="/assets/logos/logoWhite.png" alt="Founders House" className="menu-logo" />
            <AnimatedHamburger isOpen={isOpen} onClick={onClose} />
          </div>
          </div>*/}

          <div className="fullscreen-menu-content">
            <div className="menu-left">
              <nav 
                className="menu-nav"
                style={navStyle}
              >
                <button onClick={() => handleNavigation('/')} className={`menu-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
                  <span className="menu-nav-item-text">
                    {'MAP'.split('').map((letter, i) => (
                      <span key={i} className="char" style={{ transitionDelay: `${i * 0.03}s` }}>
                        <span className="char-original">{letter}</span>
                        <span className="char-clone">{letter}</span>
                      </span>
                    ))}
                  </span>
                </button>
                <button onClick={() => handleNavigation('/home')} className={`menu-nav-item ${location.pathname === '/home' ? 'active' : ''}`}>
                  <span className="menu-nav-item-text">
                    {'HOME'.split('').map((letter, i) => (
                      <span key={i} className="char" style={{ transitionDelay: `${i * 0.03}s` }}>
                        <span className="char-original">{letter}</span>
                        <span className="char-clone">{letter}</span>
                      </span>
                    ))}
                  </span>
                </button>
                <button onClick={() => handleNavigation('/about')} className={`menu-nav-item ${location.pathname === '/about' ? 'active' : ''}`}>
                  <span className="menu-nav-item-text">
                    {'ABOUT'.split('').map((letter, i) => (
                      <span key={i} className="char" style={{ transitionDelay: `${i * 0.03}s` }}>
                        <span className="char-original">{letter}</span>
                        <span className="char-clone">{letter}</span>
                      </span>
                    ))}
                  </span>
                </button>
                <button onClick={() => handleNavigation('/events')} className={`menu-nav-item ${location.pathname === '/events' ? 'active' : ''}`}>
                  <span className="menu-nav-item-text">
                    {'EVENTS'.split('').map((letter, i) => (
                      <span key={i} className="char" style={{ transitionDelay: `${i * 0.03}s` }}>
                        <span className="char-original">{letter}</span>
                        <span className="char-clone">{letter}</span>
                      </span>
                    ))}
                  </span>
                </button>
                <button onClick={() => handleNavigation('/join')} className={`menu-nav-item ${location.pathname === '/join' ? 'active' : ''}`}>
                  <span className="menu-nav-item-text">
                    {'JOIN'.split('').map((letter, i) => (
                      <span key={i} className="char" style={{ transitionDelay: `${i * 0.03}s` }}>
                        <span className="char-original">{letter}</span>
                        <span className="char-clone">{letter}</span>
                      </span>
                    ))}
                  </span>
                </button>
              </nav>
            </div>

            <div className="menu-right">
              <div className="content-img-container">
                <div 
                  className="img-container-stockholm"
                  style={stockholmStyle}
                >
                  <a 
                    href="https://founders-house.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="stockholm-link"
                  >
                    <span className="stockholm-link-text">VISIT US IN STOCKHOLM</span>
                    <div className="stockholm-link-arrow">
                      <div className="arrow-head"></div>
                      <div className="arrow-line"></div>
                    </div>
                  </a>
                </div>
                <div className="img-container-fade">
                    <div className="img-gradient-left" />
                    <div className="img-gradient-right" />
                    <div className="img-gradient-top" />
                    <div className="img-gradient-bottom" />
                </div>
                <div 
                  className="section-5-map-img-container" 
                  style={mapStyle1}
                >
                  <img
                    className="section-5-map-img"
                    src="/assets/models/birdseyemaps.webp"
                    alt="2D Map"
                    loading="lazy"
                  />
                </div>
                <div 
                  className="section-5-map-img-container" 
                  style={mapStyle2}
                >
                  <img
                    className="section-5-map-img"
                    src="/assets/models/radar.webp"
                    alt="2D Map Pin"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="menu-social-bottom">
            <a href="https://www.linkedin.com/company/founders-house-helsinki" target="_blank" rel="noopener noreferrer" className="menu-social-link">
              LINKEDIN
            </a>
            <a href="https://www.instagram.com/foundershousehelsinki/" target="_blank" rel="noopener noreferrer" className="menu-social-link">
              INSTAGRAM
            </a>
          </div>

          <div className="menu-footer">
            <button className="menu-footer-link" onClick={() => handleNavigation('/privacy-policy')}>
              PRIVACY POLICY
            </button>
            <button className="menu-footer-link" onClick={() => handleNavigation('/cookies')}>
              COOKIES SETTINGS
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}