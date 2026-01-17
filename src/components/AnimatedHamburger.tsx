import { motion } from 'framer-motion'

interface AnimatedHamburgerProps {
  isOpen: boolean
  onClick: () => void
  color?: string
}

export const AnimatedHamburger = ({ isOpen, onClick, color = '#FFF8F2' }: AnimatedHamburgerProps) => {
  return (
    <button
      onClick={onClick}
      className="hamburger-button"
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
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
      >
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

        {/* Middle line */}
        <motion.line
          x1="0"
          y1="12"
          x2="32"
          y2="12"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
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
      </svg>
    </button>
  )
}
