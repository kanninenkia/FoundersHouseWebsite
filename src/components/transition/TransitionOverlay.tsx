/**
 * TransitionOverlay - Flying elements during transition
 * Super seamless: zoom → red page → elements fly through → stick into parallax depth view
 */

import { motion, AnimatePresence } from 'framer-motion'
import './TransitionOverlay.css'

interface TransitionOverlayProps {
  isActive: boolean
}

export const TransitionOverlay = ({
  isActive
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
          {/* Constant stream of flying squares through URL change */}
          {[...Array(12)].map((_, i) => {
            // Alternate between 0.4 and 1.0 opacity
            const targetOpacity = i % 3 === 0 ? 0.4 : 1.0

            // Constant motion - start behind, fly through, no stopping
            const startZ = 2500
            const endZ = -2000

            // Calculate delay to create constant stream
            // Start RIGHT when navigation occurs: 1.2s zoom, then immediately start squares
            // Stagger squares over 1.5s for continuous stream
            const delayStart = 1.2
            const delaySpread = 1.5
            const delay = delayStart + (i * (delaySpread / 12))

            return (
              <motion.div
                key={`transition-square-${i}`}
                className={`transition-flying-square square-${i % 12}`}
                initial={{
                  z: startZ,
                  opacity: 0,
                }}
                animate={{
                  z: endZ, // Continuous motion - no stops
                  opacity: [0, targetOpacity, 0],
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
