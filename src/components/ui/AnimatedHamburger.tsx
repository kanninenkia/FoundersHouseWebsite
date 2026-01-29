import { motion } from 'framer-motion'
import { useState } from 'react'

interface AnimatedHamburgerProps {
  isOpen: boolean
  onClick: () => void
  color?: string
}

export const AnimatedHamburger = ({ isOpen, onClick, color = '#FFF8F2' }: AnimatedHamburgerProps) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      className="hamburger-button"
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        width: '32px',
        height: '24px',
        position: 'relative',
        padding: 0,
      }}
    >
      <svg
        width="32"
        height="24"
        viewBox="0 0 32 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <clipPath id="topLineClip">
            <rect x="0" y="0" width="32" height="4" />
          </clipPath>
          <clipPath id="middleLineClip">
            <rect x="0" y="10" width="32" height="4" />
          </clipPath>
          <clipPath id="bottomLineClip">
            <rect x="0" y="20" width="32" height="4" />
          </clipPath>
        </defs>

        <g clipPath={isOpen ? undefined : "url(#topLineClip)"}>
          {/* Top line */}
          <motion.line
            x1="0"
            y1="2"
            x2="32"
            y2="2"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            animate={{
              rotate: isOpen ? 45 : 0,
              y: isOpen ? 10 : 0,
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 28,
              mass: 0.5,
            }}
            style={{ originX: '50%', originY: '50%' }}
          />
          {/* White streak overlay for top line */}
          {!isOpen && (
            <motion.rect
              x="-32"
              y="0.75"
              width="32"
              height="2.5"
              fill="rgba(255, 255, 255, 1)"
              initial={{ x: -32 }}
              animate={{ x: isHovered ? 64 : -32 }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          )}
        </g>

        <g clipPath={isOpen ? undefined : "url(#middleLineClip)"}>
          {/* Middle line */}
          <motion.line
            x1="0"
            y1="12"
            x2="32"
            y2="12"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ opacity: 1, scale: 1 }}
            animate={{
              opacity: isOpen ? 0 : 1,
              scale: isOpen ? 0 : 1,
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 28,
              mass: 0.5,
            }}
          />
          {/* White streak overlay for middle line */}
          {!isOpen && (
            <motion.rect
              x="-32"
              y="10.75"
              width="32"
              height="2.5"
              fill="rgba(255, 255, 255, 1)"
              initial={{ x: -32 }}
              animate={{ x: isHovered ? 64 : -32 }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.08,
              }}
            />
          )}
        </g>

        <g clipPath={isOpen ? undefined : "url(#bottomLineClip)"}>
          {/* Bottom line */}
          <motion.line
            x1="0"
            y1="22"
            x2="32"
            y2="22"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            animate={{
              rotate: isOpen ? -45 : 0,
              y: isOpen ? -10 : 0,
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 28,
              mass: 0.5,
            }}
            style={{ originX: '50%', originY: '50%' }}
          />
          {/* White streak overlay for bottom line */}
          {!isOpen && (
            <motion.rect
              x="-32"
              y="20.75"
              width="32"
              height="2.5"
              fill="rgba(255, 255, 255, 1)"
              initial={{ x: -32 }}
              animate={{ x: isHovered ? 64 : -32 }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.16,
              }}
            />
          )}
        </g>
      </svg>
    </button>
  )
}