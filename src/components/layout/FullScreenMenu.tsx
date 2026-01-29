import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { AnimatedHamburger } from '../ui'
import './FullScreenMenu.css'
import ParallaxMotion from '../../effects/ParallaxMotion'
import { useState } from 'react'

interface FullScreenMenuProps {
  isOpen: boolean
  onClose: () => void
}

export const FullScreenMenu = ({ isOpen, onClose }: FullScreenMenuProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e
    const { innerWidth, innerHeight } = window
    
    // Normalize to -1 to 1
    const x = (clientX / innerWidth) * 2 - 1
    const y = (clientY / innerHeight) * 2 - 1
    
    setMousePos({ x, y })
  }

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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fullscreen-menu"
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
              <nav className="menu-nav">
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
                <div className="img-container-fade">
                    <div className="img-gradient-left" />
                    <div className="img-gradient-right" />
                    <div className="img-gradient-top" />
                    <div className="img-gradient-bottom" />
                </div>
                <div 
                  className="section-5-map-img-container" 
                  style={{ 
                    mixBlendMode: "multiply", 
                    isolation: "isolate", 
                    height: "100%", 
                    zIndex: 1,
                    transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`,
                    transition: 'transform 2s cubic-bezier(0.17, 0.67, 0.3, 0.99)'
                  }}
                >
                  <motion.img
                    className="section-5-map-img"
                    src="/assets/models/birdseyemaps.webp"
                    alt="2D Map"
                  />
                </div>
                <div 
                  className="section-5-map-img-container" 
                  style={{ 
                    height: "100%", 
                    zIndex: 2,
                    transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`,
                    transition: 'transform 2.3s cubic-bezier(0.17, 0.67, 0.3, 0.99)'
                  }}
                >
                  <motion.img
                    className="section-5-map-img"
                    src="/assets/models/radar.webp"
                    alt="2D Map Pin"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="menu-social-bottom">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="menu-social-link">
              {'LINKEDIN'.split('').map((letter, i) => (
                <span key={i} className="char-small" style={{ transitionDelay: `${i * 0.02}s` }}>
                  <span className="char-original-small">{letter}</span>
                  <span className="char-clone-small">{letter}</span>
                </span>
              ))}
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="menu-social-link">
              {'INSTAGRAM'.split('').map((letter, i) => (
                <span key={i} className="char-small" style={{ transitionDelay: `${i * 0.02}s` }}>
                  <span className="char-original-small">{letter}</span>
                  <span className="char-clone-small">{letter}</span>
                </span>
              ))}
            </a>
          </div>

          <div className="menu-footer">
            <button className="menu-footer-link">
              {'PRIVACY POLICY'.split('').map((letter, i) => (
                <span key={i} className="char-small" style={{ transitionDelay: `${i * 0.02}s` }}>
                  <span className="char-original-small">{letter === ' ' ? '\u00A0' : letter}</span>
                  <span className="char-clone-small">{letter === ' ' ? '\u00A0' : letter}</span>
                </span>
              ))}
            </button>
            <button className="menu-footer-link">
              {'COOKIES SETTINGS'.split('').map((letter, i) => (
                <span key={i} className="char-small" style={{ transitionDelay: `${i * 0.02}s` }}>
                  <span className="char-original-small">{letter === ' ' ? '\u00A0' : letter}</span>
                  <span className="char-clone-small">{letter === ' ' ? '\u00A0' : letter}</span>
                </span>
              ))}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}