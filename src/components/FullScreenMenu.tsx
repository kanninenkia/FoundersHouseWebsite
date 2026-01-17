import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { AnimatedHamburger } from './AnimatedHamburger'
import './FullScreenMenu.css'

interface FullScreenMenuProps {
  isOpen: boolean
  onClose: () => void
}

export const FullScreenMenu = ({ isOpen, onClose }: FullScreenMenuProps) => {
  const navigate = useNavigate()
  const location = useLocation()

  // Parallax effect for map and radar
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 30, stiffness: 150, mass: 0.5 }
  const mapX = useSpring(mouseX, springConfig)
  const mapY = useSpring(mouseY, springConfig)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = e
    const { width, height } = currentTarget.getBoundingClientRect()

    // Calculate normalized position (-1 to 1)
    const xNorm = (clientX / width) * 2 - 1
    const yNorm = (clientY / height) * 2 - 1

    // Apply parallax offset (max 20px movement)
    mouseX.set(xNorm * 20)
    mouseY.set(yNorm * 20)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const handleNavigation = (path: string) => {
    if (path === '/') {
      sessionStorage.setItem('hasVisitedMap', 'true')
    }
    navigate(path)
    onClose()
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
          onMouseLeave={handleMouseLeave}
        >
          <div className="menu-header">
            <img src="/logos/logoWhite.png" alt="Founders House" className="menu-logo" />
            <AnimatedHamburger isOpen={isOpen} onClick={onClose} />
          </div>

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
              <div className="menu-map-container">
                <motion.img
                  src="/models/birdseyemaps.webp"
                  alt="Birds Eye View"
                  className="menu-map"
                  style={{ x: mapX, y: mapY }}
                />
                <motion.img
                  src="/models/radar.svg"
                  alt="Radar"
                  className="menu-radar"
                  style={{ x: mapX, y: mapY }}
                />
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
