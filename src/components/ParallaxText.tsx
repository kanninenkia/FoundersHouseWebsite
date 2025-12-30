import { motion, useScroll, useTransform } from 'framer-motion'
import { ReactNode, useRef } from 'react'

interface ParallaxTextProps {
  children: ReactNode
  speed?: number // Multiplier for parallax effect (negative = moves up, positive = moves down)
  className?: string
}

export const ParallaxText = ({
  children,
  speed = 0.5,
  className = ''
}: ParallaxTextProps) => {
  const ref = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, speed * 100])

  return (
    <motion.div
      ref={ref}
      style={{ y }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
