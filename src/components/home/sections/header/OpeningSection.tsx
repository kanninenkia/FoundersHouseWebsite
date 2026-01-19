/**
 * OpeningSection - The initial hero section with floating images and decorative squares
 */

import { motion, MotionValue, useTransform } from 'framer-motion'
import { FloatingImage, FLOATING_IMAGES_CONFIG } from '../../FloatingImage'

interface DecorativeSquareProps {
  index: number
  hasEnteredFromTransition: boolean
  smoothMouseX: MotionValue<number>
  smoothMouseY: MotionValue<number>
  squareDepthZ: MotionValue<number>
  depthTransitionProgress: MotionValue<number>
  ANIMATION_CONFIG: any
  EASING: any
}

const DecorativeSquare = ({
  index,
  hasEnteredFromTransition,
  smoothMouseX,
  smoothMouseY,
  squareDepthZ,
  depthTransitionProgress,
  ANIMATION_CONFIG,
  EASING
}: DecorativeSquareProps) => {
  const { decorativeSquares } = ANIMATION_CONFIG
  const targetOpacity = decorativeSquares.opacityIndices.includes(index)
    ? decorativeSquares.opacityDim
    : decorativeSquares.opacityFull

  const parallaxBase = decorativeSquares.parallaxBase
  const parallaxX = useTransform(smoothMouseX, [-1, 1], [-parallaxBase - (index * 2), parallaxBase + (index * 2)])
  const parallaxY = useTransform(smoothMouseY, [-1, 1], [-parallaxBase - (index * 2), parallaxBase + (index * 2)])
  const depthOpacityTransform = useTransform(depthTransitionProgress, (progress) => {
    if (progress === 0) return targetOpacity
    return Math.max(0, targetOpacity - progress * 1.5)
  })

  if (hasEnteredFromTransition) {
    return (
      <motion.div
        key={`square-${index}`}
        className={`decorative-square square-${index}`}
        style={{
          x: parallaxX,
          y: parallaxY,
          z: squareDepthZ,
          opacity: depthOpacityTransform,
        }}
        initial={{
          z: 2500,
          opacity: 0,
        }}
        animate={{
          z: [2500, -150, 0],
          opacity: [0, targetOpacity, targetOpacity],
        }}
        transition={{
          duration: 1.4,
          delay: 0.9 + (index * 0.05),
          ease: EASING.bezier.out,
          times: [0, 0.7, 1],
        }}
      />
    )
  }

  const startZ = 3000 + (index * 150)
  const finalZ = 0

  return (
    <motion.div
      key={`square-${index}`}
      className={`decorative-square square-${index}`}
      style={{
        x: parallaxX,
        y: parallaxY,
        z: squareDepthZ,
        opacity: depthOpacityTransform,
      }}
      initial={{
        opacity: 0,
        z: startZ,
      }}
      animate={{
        opacity: targetOpacity,
        z: finalZ,
      }}
      transition={{
        duration: 1.0 + (index * 0.06),
        ease: EASING.bezier.out,
        delay: 0.2 + (index * 0.06)
      }}
    />
  )
}

interface OpeningSectionProps {
  showBackground: boolean
  hasEnteredFromTransition: boolean
  openingSectionOpacity: MotionValue<number>
  textParallaxX: MotionValue<number>
  textParallaxY: MotionValue<number>
  textDepthZ: MotionValue<number>
  finalDepthOpacity: MotionValue<number>
  smoothMouseX: MotionValue<number>
  smoothMouseY: MotionValue<number>
  imageDepthZ: MotionValue<number>
  squareDepthZ: MotionValue<number>
  depthTransitionProgress: MotionValue<number>
  ANIMATION_CONFIG: any
  EASING: any
}

export const OpeningSection = ({
  showBackground,
  hasEnteredFromTransition,
  openingSectionOpacity,
  textParallaxX,
  textParallaxY,
  textDepthZ,
  finalDepthOpacity,
  smoothMouseX,
  smoothMouseY,
  imageDepthZ,
  squareDepthZ,
  depthTransitionProgress,
  ANIMATION_CONFIG,
  EASING
}: OpeningSectionProps) => {
  const floatingImagesConfig = FLOATING_IMAGES_CONFIG.map((config: typeof FLOATING_IMAGES_CONFIG[0], i: number) =>
    i === 0 && hasEnteredFromTransition ? { ...config, delay: 0.8 } : config
  )

  if (!showBackground && hasEnteredFromTransition) return null

  return (
    <motion.section
      className="opening-section"
      style={{
        opacity: openingSectionOpacity,
        pointerEvents: 'auto'
      }}
    >
      <motion.div
        className="opening-content"
        style={{
          x: textParallaxX,
          y: textParallaxY,
          z: textDepthZ,
          opacity: finalDepthOpacity,
        }}
      >
        <motion.h1
          className="opening-headline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: hasEnteredFromTransition ? 1.2 : 1.8,
            ease: [0.22, 1, 0.36, 1],
            delay: hasEnteredFromTransition ? 1.8 : 0.8
          }}
        >
          WE BRING EXCEPTIONAL YOUNG<br />
          TALENT UNDER ONE ROOF,<br />
          WHERE AMBITION CONCENTRATES<br />
          AND POTENTIAL MULTIPLIES.
        </motion.h1>
      </motion.div>

      {floatingImagesConfig.map((config: typeof FLOATING_IMAGES_CONFIG[0], i: number) => (
        <FloatingImage
          key={`floating-image-${i + 1}`}
          index={i}
          className={`floating-image floating-image-${i + 1}`}
          smoothMouseX={smoothMouseX}
          smoothMouseY={smoothMouseY}
          imageDepthZ={imageDepthZ}
          finalDepthOpacity={finalDepthOpacity}
          hasEnteredFromTransition={hasEnteredFromTransition}
          {...config}
        />
      ))}

      {hasEnteredFromTransition && [...Array(12)].map((_, i) => {
        const targetOpacity = i % 3 === 0 ? 0.4 : 1.0

        return (
          <motion.div
            key={`flythrough-square-${i}`}
            className={`decorative-square square-${i % 12}`}
            initial={{ z: 2500, opacity: 0 }}
            animate={{ z: -2000, opacity: [0, targetOpacity, 0] }}
            transition={{ duration: 1.0, delay: 0.3 + (i * 0.05), ease: EASING.bezier.inOut }}
          />
        )
      })}

      {[...Array(10)].map((_, i) => (
        <DecorativeSquare
          key={`square-${i}`}
          index={i}
          hasEnteredFromTransition={hasEnteredFromTransition}
          smoothMouseX={smoothMouseX}
          smoothMouseY={smoothMouseY}
          squareDepthZ={squareDepthZ}
          depthTransitionProgress={depthTransitionProgress}
          ANIMATION_CONFIG={ANIMATION_CONFIG}
          EASING={EASING}
        />
      ))}
    </motion.section>
  )
}
