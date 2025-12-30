import { motion, useMotionValue, useSpring } from 'framer-motion'
import { ReactNode, useRef } from 'react'

interface MagneticElementProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  strength?: number // Magnetic pull strength (0-1)
  range?: number // Magnetic field radius in pixels
  rotate?: boolean // Enable rotation on hover
  rotateDegrees?: number // Max rotation in degrees
}

export const MagneticElement = ({
  children,
  className = '',
  style = {},
  strength = 0.2,
  range = 100,
  rotate = false,
  rotateDegrees = 5
}: MagneticElementProps) => {
  const ref = useRef<HTMLDivElement>(null)

  // Magnetic cursor effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotation = useMotionValue(0)

  // Olivier's spring config: buttery smooth motion
  const springConfig = { damping: 25, stiffness: 400, mass: 0.5 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)
  const rotateZ = useSpring(rotation, springConfig)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    // Calculate distance from element center
    const distanceX = e.clientX - centerX
    const distanceY = e.clientY - centerY

    // Calculate distance-based magnetic strength
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)
    const pullStrength = Math.max(0, 1 - distance / range)

    // Apply magnetic pull
    mouseX.set(distanceX * strength * pullStrength)
    mouseY.set(distanceY * strength * pullStrength)

    // Apply rotation if enabled (based on X position)
    if (rotate) {
      const rotateAmount = (distanceX / rect.width) * rotateDegrees
      rotation.set(rotateAmount)
    }
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
    rotation.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ ...style, x, y, rotateZ }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  )
}
