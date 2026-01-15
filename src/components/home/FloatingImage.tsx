import { motion, MotionValue, useTransform } from 'framer-motion'

export const FLOATING_IMAGES_CONFIG = [
  { parallaxRange: [-8, 8] as [number, number], initialZ: 2000, duration: 1.4, delay: 0.8 },
  { parallaxRange: [8, -8] as [number, number], initialZ: 1800, duration: 1.3, delay: 0.5 },
  { parallaxRange: [-12, 12] as [number, number], initialZ: 2200, duration: 1.5, delay: 0.4 },
  { parallaxRange: [10, -10] as [number, number], initialZ: 2500, duration: 1.6, delay: 0.6 },
  { parallaxRange: [-5, 5] as [number, number], initialZ: 2800, duration: 1.7, delay: 0.8 },
  { parallaxRange: [-7, 7] as [number, number], initialZ: 2100, duration: 1.45, delay: 0.55 },
]

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
