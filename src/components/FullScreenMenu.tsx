import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { AnimatedHamburger } from './AnimatedHamburger'
import './FullScreenMenu.css'

interface FullScreenMenuProps {
  isOpen: boolean
  onClose: () => void
}

export const FullScreenMenu = ({ isOpen, onClose }: FullScreenMenuProps) => {
  const navigate = useNavigate()

  const handleNavigation = (path: string) => {
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
        >
          <div className="menu-header">
            <img src="/logos/logoWhite.png" alt="Founders House" className="menu-logo" />
            <AnimatedHamburger isOpen={isOpen} onClick={onClose} />
          </div>

          <div className="fullscreen-menu-content">
            <div className="menu-left">
              <nav className="menu-nav">
                <button onClick={() => handleNavigation('/')} className="menu-nav-item">
                  <span className="menu-nav-item-text">
                    {'MAP'.split('').map((letter, i) => (
                      <span key={i} className="char" style={{ transitionDelay: `${i * 0.03}s` }}>
                        <span className="char-original">{letter}</span>
                        <span className="char-clone">{letter}</span>
                      </span>
                    ))}
                  </span>
                </button>
                <button onClick={() => handleNavigation('/home')} className="menu-nav-item">
                  <span className="menu-nav-item-text">
                    {'HOME'.split('').map((letter, i) => (
                      <span key={i} className="char" style={{ transitionDelay: `${i * 0.03}s` }}>
                        <span className="char-original">{letter}</span>
                        <span className="char-clone">{letter}</span>
                      </span>
                    ))}
                  </span>
                </button>
                <button onClick={() => handleNavigation('/about')} className="menu-nav-item">
                  <span className="menu-nav-item-text">
                    {'ABOUT'.split('').map((letter, i) => (
                      <span key={i} className="char" style={{ transitionDelay: `${i * 0.03}s` }}>
                        <span className="char-original">{letter}</span>
                        <span className="char-clone">{letter}</span>
                      </span>
                    ))}
                  </span>
                </button>
                <button onClick={() => handleNavigation('/join')} className="menu-nav-item">
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
                <img src="/models/birdseyemaps.webp" alt="Birds Eye View" className="menu-map" />
                <img src="/models/radar.svg" alt="Radar" className="menu-radar" />
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
