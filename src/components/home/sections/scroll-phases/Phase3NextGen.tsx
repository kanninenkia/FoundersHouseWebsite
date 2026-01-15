/**
 * Phase3NextGen - NEXT-GEN text with place3.webp image
 * EXACT COPY from original BoxInBoxSection lines 483-570
 */

import { motion, MotionValue } from 'framer-motion'

interface Phase3Props {
  thirdImageOpacity: number
  thirdImageParallaxX: MotionValue<number>
  thirdImageParallaxY: MotionValue<number>
  thirdImageTextParallaxX: MotionValue<number>
  thirdImageTextParallaxY: MotionValue<number>
}

export const Phase3NextGen = ({
  thirdImageOpacity,
  thirdImageParallaxX,
  thirdImageParallaxY,
  thirdImageTextParallaxX,
  thirdImageTextParallaxY,
}: Phase3Props) => {
  return (
    <>
      {/* Third image (place3.webp) - Left side */}
      <motion.div
        style={{
          position: 'fixed',
          top: 'calc(50% + 6vh)',
          left: 'calc(20% + 3%)',
          opacity: thirdImageOpacity,
          x: thirdImageParallaxX,
          y: thirdImageParallaxY,
          translateX: '-50%',
          translateY: '-50%',
          zIndex: 13,
          pointerEvents: 'none',
        }}
      >
        <img
          src="/images/place3.webp"
          alt="Place 3"
          style={{
            width: 'clamp(414px, 48.3vw, 690px)',
            height: 'auto',
            display: 'block',
          }}
        />
      </motion.div>

      {/* Decorative rectangle on place3 image - top left */}
      <motion.div
        style={{
          position: 'fixed',
          top: 'calc(50% + 6vh - 4vh)',
          left: 'calc(20% + 3% - 2%)',
          opacity: thirdImageOpacity,
          x: thirdImageTextParallaxX,
          y: thirdImageTextParallaxY,
          zIndex: 14,
          pointerEvents: 'none',
        }}
      >
        <img
          src="/icons/rectangle.svg"
          alt=""
          style={{
            width: '12vw',
            height: 'auto',
            transform: 'translate(-100%, -100%) rotate(90deg) scale(0.7)',
            display: 'block',
          }}
        />
      </motion.div>

      {/* Text overlay on place3 image - bottom left */}
      <motion.div
        style={{
          position: 'fixed',
          top: 'calc(50% + 6vh)',
          left: 'calc(20% + 3%)',
          opacity: thirdImageOpacity,
          zIndex: 14,
          pointerEvents: 'none',
        }}
      >
        <motion.div
          style={{
            x: thirdImageTextParallaxX,
            y: thirdImageTextParallaxY,
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(-15vw - 5vh)',
              left: '-17.5vw',
              fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: 'clamp(0.9rem, 1.2vw, 1.2rem)',
              fontWeight: 400,
              color: '#FFFFFF',
              textAlign: 'left',
              lineHeight: 1.4,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
            dangerouslySetInnerHTML={{
              __html: 'For the ones moving faster<br />than everyone else.'
            }}
          />
        </motion.div>
      </motion.div>
    </>
  )
}
