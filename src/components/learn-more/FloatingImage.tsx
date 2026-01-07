/**
 * FloatingImage Component
 * Decorative images with parallax effect and depth transitions
 */

import { motion, MotionValue, useTransform } from 'framer-motion'

interface FloatingImageProps {
  index: number
  className: string
  smoothMouseX: MotionValue<number>
  smoothMouseY: MotionValue<number>
  imageDepthZ: MotionValue<number>
  finalDepthOpacity: MotionValue<number> | number
  hasEnteredFromTransition: boolean
  parallaxRange: [number, number]
  initialZ: number
  duration: number
  delay: number
}

export const FloatingImage = ({
  index,
  className,
  smoothMouseX,
  smoothMouseY,
  imageDepthZ,
  finalDepthOpacity,
  hasEnteredFromTransition,
  parallaxRange,
  initialZ,
  duration,
  delay,
}: FloatingImageProps) => {
  const parallaxX = useTransform(smoothMouseX, [-1, 1], parallaxRange)
  const parallaxY = useTransform(smoothMouseY, [-1, 1], parallaxRange)

  // Special animation for first image when entering from transition
  const isFirstImage = index === 0 && hasEnteredFromTransition

  return (
    <motion.div
      className={className}
      style={{
        x: parallaxX,
        y: parallaxY,
        z: imageDepthZ,
        opacity: finalDepthOpacity,
      }}
      initial={{
        opacity: 0,
        z: isFirstImage ? 2500 : initialZ,
      }}
      animate={{
        z: isFirstImage ? [2500, -100, 0] : 0,
        opacity: isFirstImage ? [0, 1, 1] : 1,
      }}
      transition={{
        duration,
        ease: isFirstImage ? [0.25, 1, 0.5, 1] : [0.16, 1, 0.3, 1],
        delay,
        times: isFirstImage ? [0, 0.7, 1] : undefined,
      }}
    />
  )
}
