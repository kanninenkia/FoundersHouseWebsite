/**
 * SharedTextElement - The transforming text that cycles through OBSESSIVE -> AMBITIOUS -> NEXT-GEN -> BUILDERS
 * EXACT COPY from original BoxInBoxSection lines 455-481
 */

import { motion, MotionValue } from 'framer-motion'

interface SharedTextProps {
  textContent: string
  obsessiveY: number
  obsessiveOpacity: number
  obsessiveBottom: string
  obsessiveLeft: string
  textPositionX: number
  textPositionY: number
  textRotation: number
  obsessiveParallaxX: MotionValue<number>
  obsessiveParallaxY: MotionValue<number>
  buildersTextParallaxX: MotionValue<number>
  buildersTextParallaxY: MotionValue<number>
  phase4Opacity: number
}

export const SharedTextElement = ({
  textContent,
  obsessiveY,
  obsessiveOpacity,
  obsessiveBottom,
  obsessiveLeft,
  textPositionX,
  textPositionY,
  textRotation,
  obsessiveParallaxX,
  obsessiveParallaxY,
  buildersTextParallaxX,
  buildersTextParallaxY,
  phase4Opacity,
}: SharedTextProps) => {
  return (
    <motion.div
      key={textContent}
      initial={{ opacity: 0 }}
      animate={{ opacity: textContent === 'BUILDERS' ? obsessiveOpacity * phase4Opacity : obsessiveOpacity }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1]
      }}
      style={{
        position: 'fixed',
        bottom: obsessiveBottom,
        left: obsessiveLeft,
        x: textContent === 'BUILDERS' ? buildersTextParallaxX : obsessiveParallaxX,
        y: textContent === 'BUILDERS' ? buildersTextParallaxY : obsessiveParallaxY,
        translateX: `calc(${textPositionX}vw + 3%)`,
        translateY: `calc(${obsessiveY}% + ${textPositionY}vh)`,
        rotate: textRotation,
        scale: 1.09, // Increased by 15% from 0.95 (0.95 * 1.15 = 1.0925)
        transformOrigin: 'left center',
        zIndex: 15,
        pointerEvents: 'none',
        fontFamily: 'Outfit, -apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: 'clamp(4rem, 10vw, 8rem)',
        fontWeight: 700,
        color: '#D82E11',
        textTransform: 'uppercase',
        letterSpacing: '-0.04rem',
        whiteSpace: 'nowrap',
        maxHeight: '85vh',
      }}
    >
      {textContent}
    </motion.div>
  )
}
