/**
 * TransitionOverlay - Expanding square with flying elements
 * Super seamless: zoom → square expands → elements fly in → continues into Learn More
 */

import { motion, AnimatePresence } from 'framer-motion'
import './TransitionOverlay.css'

interface TransitionOverlayProps {
  isActive: boolean
  centerPoint?: { x: number; y: number }
}

export const TransitionOverlay = ({
  isActive,
  centerPoint = { x: 50, y: 50 }
}: TransitionOverlayProps) => {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="transition-overlay"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0 }}
        >
          {/* Expanding red square from center - waits for camera zoom to complete */}
          <motion.div
            className="transition-square"
            style={{
              left: `${centerPoint.x}%`,
              top: `${centerPoint.y}%`,
            }}
            initial={{
              scale: 0,
              borderRadius: '0%',
            }}
            animate={{
              scale: 30,
              borderRadius: '0%',
            }}
            transition={{
              duration: 0.8,
              delay: 1.2, // Wait for camera zoom to complete (1.2s)
              ease: [0.65, 0, 0.35, 1],
            }}
          />

          {/* Constant stream of flying squares through URL change */}
          {[...Array(20)].map((_, i) => {
            // Alternate between 0.4 and 1.0 opacity
            const targetOpacity = i % 3 === 0 ? 0.4 : 1.0

            // Constant motion - start behind, fly through, no stopping
            const startZ = 2500
            const endZ = -2000

            // Calculate delay to create constant stream
            // Start RIGHT when navigation occurs: 1.2s zoom + 0.8s square expansion = 2.0s
            // Stagger squares over 1.5s for continuous stream
            const delayStart = 2.0
            const delaySpread = 1.5
            const delay = delayStart + (i * (delaySpread / 20))

            return (
              <motion.div
                key={`transition-square-${i}`}
                className={`transition-flying-square square-${i % 12}`}
                initial={{
                  z: startZ,
                  opacity: 0,
                  filter: 'blur(15px)',
                }}
                animate={{
                  z: endZ, // Continuous motion - no stops
                  opacity: [0, targetOpacity, targetOpacity, 0],
                  filter: ['blur(15px)', 'blur(0px)', 'blur(0px)', 'blur(12px)'],
                }}
                transition={{
                  duration: 1.2,
                  delay: delay,
                  ease: 'linear', // Linear for constant speed, no easing
                }}
              />
            )
          })}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
