/**
 * Phase1Obsessive - OBSESSIVE text with placeholder.webp image and decorations
 * EXACT COPY from original BoxInBoxSection lines 329-453
 */

import { motion, MotionValue } from 'framer-motion'

interface Phase1Props {
  imageOpacity: number
  imageWidth: string
  imageHeight: string
  imageTop: string
  placeholderParallaxX: MotionValue<number>
  placeholderParallaxY: MotionValue<number>
  elementsOpacity: number
  showDecorations: boolean
  decorativeBoxParallaxX: MotionValue<number>
  decorativeBoxParallaxY: MotionValue<number>
  decorativeTextParallaxX: MotionValue<number>
  decorativeTextParallaxY: MotionValue<number>
  boxPositionX: number
}

export const Phase1Obsessive = ({
  imageOpacity,
  imageWidth,
  imageHeight,
  imageTop,
  placeholderParallaxX,
  placeholderParallaxY,
  elementsOpacity,
  showDecorations,
  decorativeBoxParallaxX,
  decorativeBoxParallaxY,
  decorativeTextParallaxX,
  decorativeTextParallaxY,
  boxPositionX,
}: Phase1Props) => {
  return (
    <>
      {/* Placeholder image - place1/placeholder.webp */}
      <motion.img
        src="/images/placeholder.webp"
        alt=""
        style={{
          position: 'fixed',
          top: imageTop,
          left: boxPositionX > 0 ? `${50 + boxPositionX}%` : '50%',
          x: placeholderParallaxX,
          y: placeholderParallaxY,
          translateX: '-50%',
          translateY: '-50%',
          opacity: imageOpacity * elementsOpacity,
          zIndex: 12,
          width: imageWidth,
          height: imageHeight,
          objectFit: 'cover',
          objectPosition: 'center center',
          clipPath: 'inset(0 0 0 0)',
          pointerEvents: 'none',
        }}
      />

      {/* First box (back) - separate layer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showDecorations ? imageOpacity * elementsOpacity : 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed',
          top: imageTop,
          left: boxPositionX > 0 ? `${50 + boxPositionX}%` : '50%',
          x: decorativeBoxParallaxX,
          y: decorativeBoxParallaxY,
          translateX: '-50%',
          translateY: '-50%',
          zIndex: 13,
          pointerEvents: 'none',
          width: imageWidth,
          height: imageHeight,
        }}
      >
        <img
          src="/icons/box.svg"
          alt=""
          style={{
            position: 'absolute',
            top: '33%',
            left: '38%',
            width: '20%',
            height: 'auto',
            pointerEvents: 'none',
          }}
        />
      </motion.div>

      {/* Second box (front) - separate layer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showDecorations ? imageOpacity * elementsOpacity : 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed',
          top: imageTop,
          left: boxPositionX > 0 ? `${50 + boxPositionX}%` : '50%',
          x: decorativeBoxParallaxX,
          y: decorativeBoxParallaxY,
          translateX: '-50%',
          translateY: '-50%',
          zIndex: 14,
          pointerEvents: 'none',
          width: imageWidth,
          height: imageHeight,
        }}
      >
        <img
          src="/icons/box.svg"
          alt=""
          style={{
            position: 'absolute',
            top: '36%',
            left: '42%',
            width: '20%',
            height: 'auto',
            pointerEvents: 'none',
          }}
        />
      </motion.div>

      {/* Bottom right text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showDecorations ? imageOpacity * elementsOpacity : 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed',
          top: imageTop,
          left: boxPositionX > 0 ? `${50 + boxPositionX}%` : '50%',
          x: decorativeTextParallaxX,
          y: decorativeTextParallaxY,
          translateX: '-50%',
          translateY: '-50%',
          zIndex: 14,
          pointerEvents: 'none',
          width: imageWidth,
          height: imageHeight,
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: '6%',
            right: '6%',
            fontFamily: 'Outfit, -apple-system, BlinkMacSystemFont, sans-serif',
            fontSize: 'clamp(1.2rem, 2vw, 1.8rem)',
            fontWeight: 400,
            color: '#FFFFFF',
            textAlign: 'right',
            lineHeight: 1.4,
            pointerEvents: 'none',
          }}
        >
          For those who outwork<br />
          and outthink the rest.
        </div>
      </motion.div>
    </>
  )
}
