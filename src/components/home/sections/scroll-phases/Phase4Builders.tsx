/**
 * Phase4Builders - BUILDERS text with place4.webp image
 * EXACT COPY from original BoxInBoxSection lines 572-705
 */

import { motion, MotionValue } from 'framer-motion'

interface Phase4Props {
  fourthImageOpacity: number
  fourthImageParallaxX: MotionValue<number>
  fourthImageParallaxY: MotionValue<number>
  fourthImageBoxParallaxX: MotionValue<number>
  fourthImageBoxParallaxY: MotionValue<number>
  fourthDecorativeBoxParallaxX: MotionValue<number>
  fourthDecorativeBoxParallaxY: MotionValue<number>
  fourthDecorativeTextParallaxX: MotionValue<number>
  fourthDecorativeTextParallaxY: MotionValue<number>
  phase4Opacity: number
}

export const Phase4Builders = ({
  fourthImageOpacity,
  fourthImageParallaxX,
  fourthImageParallaxY,
  fourthImageBoxParallaxX,
  fourthImageBoxParallaxY,
  fourthDecorativeBoxParallaxX,
  fourthDecorativeBoxParallaxY,
  fourthDecorativeTextParallaxX,
  fourthDecorativeTextParallaxY,
  phase4Opacity,
}: Phase4Props) => {
  return (
    <>
      {/* Fourth image - place4.webp - below sticky BUILDERS text */}
      <motion.div
        style={{
          position: 'fixed',
          top: 'calc(50% - 30vh)',
          left: 'calc(50% - 41vw)',
          transform: 'translate(-50%, -50%)',
          x: fourthImageParallaxX,
          y: fourthImageParallaxY,
          opacity: fourthImageOpacity * phase4Opacity,
          zIndex: 13,
          pointerEvents: 'none',
        }}
      >
        {/* Background box behind place4 image - fades in */}
        {fourthImageOpacity > 0 && (
          <motion.div
            style={{
              position: 'absolute',
              top: '5%',
              left: '50%',
              translateX: '-50%',
              x: fourthImageBoxParallaxX,
              y: fourthImageBoxParallaxY,
              width: '69.3vw', // 90% of 77vw
              height: '100%',
              background: '#FFF8F2',
              zIndex: -1,
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: fourthImageOpacity
            }}
            transition={{
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1]
            }}
          />
        )}
        <motion.img
          src="/images/place4.webp"
          alt=""
          style={{
            width: '77vw',
            height: 'auto',
            display: 'block',
            position: 'relative',
            zIndex: 1,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: fourthImageOpacity }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1]
          }}
        />

        {/* Box.svg in center of place4 image */}
        {fourthImageOpacity > 0 && (
          <motion.div
            style={{
              position: 'absolute',
              top: 'calc(50% - 2%)', // Moved up by 2%
              left: 'calc(50% + 2%)', // Moved right by 2%
              translateX: '-50%',
              translateY: '-50%',
              x: fourthDecorativeBoxParallaxX,
              y: fourthDecorativeBoxParallaxY,
              zIndex: 2,
              pointerEvents: 'none',
            }}
          >
            <motion.img
              src="/icons/minirect.svg"
              alt=""
              style={{
                width: '14vw',
                height: 'auto',
                display: 'block',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: fourthImageOpacity }}
              transition={{
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1]
              }}
            />
          </motion.div>
        )}
      </motion.div>

      {/* Decorative text for place4 - top right */}
      {fourthImageOpacity > 0 && (
        <motion.div
          style={{
            position: 'fixed',
            top: 'calc(50% - 30vh - 10vh + 14%)', // Moved down by 7%
            left: 'calc(50% - 41vw + 77vw - 5vw - 11%)', // Moved left by 7%
            opacity: phase4Opacity,
            zIndex: 14,
            pointerEvents: 'none',
          }}
        >
          <motion.div
            style={{
              x: fourthDecorativeTextParallaxX,
              y: fourthDecorativeTextParallaxY,
            }}
          >
            <motion.div
              style={{
                fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
                fontSize: 'clamp(0.9rem, 1.2vw, 1.2rem)',
                fontWeight: 400,
                color: '#FFFFFF',
                textAlign: 'left',
                lineHeight: 1.4,
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: fourthImageOpacity }}
              transition={{
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1]
              }}
            >
              For those who outpace<br />
              their own ambition.
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}
