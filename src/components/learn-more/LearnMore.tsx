import { useEffect, useRef, useState } from 'react'
import { motion, useTransform, useMotionValue, useSpring, MotionValue } from 'framer-motion'
import { QuoteCard } from './QuoteCard'
import { LearnMoreHeader } from './LearnMoreHeader'
import { FloatingImage } from './FloatingImage'
import { quoteCardsData } from './quoteCardsData'
import './LearnMore.css'

// Separate component for decorative squares to avoid Rules of Hooks violation
interface DecorativeSquareProps {
  index: number
  hasEnteredFromTransition: boolean
  smoothMouseX: MotionValue<number>
  smoothMouseY: MotionValue<number>
  squareDepthZ: MotionValue<number>
  depthTransitionProgress: MotionValue<number>
}

const DecorativeSquare = ({ 
  index, 
  hasEnteredFromTransition, 
  smoothMouseX, 
  smoothMouseY, 
  squareDepthZ,
  depthTransitionProgress 
}: DecorativeSquareProps) => {
  const targetOpacity = [1, 3, 4, 7, 9, 11].includes(index) ? 0.4 : 1

  const parallaxX = useTransform(smoothMouseX, [-1, 1], [-15 - (index * 2), 15 + (index * 2)])
  const parallaxY = useTransform(smoothMouseY, [-1, 1], [-15 - (index * 2), 15 + (index * 2)])
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
          ease: [0.25, 1, 0.5, 1],
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
        duration: 1.2 + (index * 0.08),
        ease: [0.16, 1, 0.3, 1],
        delay: 0.1 + (index * 0.04)
      }}
    />
  )
}

export const LearnMore = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Mouse parallax motion values with refined spring physics
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  // Increased damping for editorial smoothness (restraint over spectacle)
  const springConfig = { damping: 35, stiffness: 80, mass: 0.5 }
  const smoothMouseX = useSpring(mouseX, springConfig)
  const smoothMouseY = useSpring(mouseY, springConfig)
  
  // Depth transition progress (opening to quotes section)
  const depthTransitionProgress = useMotionValue(0)
  
  // Virtual scroll with smooth spring physics
  const virtualScrollTarget = useMotionValue(0)
  const virtualScroll = useSpring(virtualScrollTarget, {
    stiffness: 100,
    damping: 30,
    mass: 0.5
  })

  // Entry animation state
  const [hasEnteredFromTransition, setHasEnteredFromTransition] = useState(false)
  const [showBackground, setShowBackground] = useState(false) // Control background visibility

  // Entry animation - check if coming from transition
  useEffect(() => {

    // Check if we're coming from a transition
    const fromTransition = sessionStorage.getItem('transitioningToLearnMore') === 'true'

    if (fromTransition) {
      setHasEnteredFromTransition(true)
      
      // CRITICAL: Show background immediately since screen is already red from TransitionOverlay
      // The red square has already covered the screen before navigation occurred
      setShowBackground(true)
      
      // Clear the flag after a delay
      setTimeout(() => {
        sessionStorage.removeItem('transitioningToLearnMore')
      }, 100)
    } else {
      // If not from transition, show background immediately
      setShowBackground(true)
    }
  }, [])

  // Track accumulated virtual scroll from wheel events
  const accumulatedScroll = useRef(0)
  const maxVirtualScroll = window.innerHeight * 1.5 // Extended for 3-stage sequence
  const [zScrollComplete, setZScrollComplete] = useState(false)

  // Bidirectional Z-scroll animation - scrub forward and backward freely
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      // Accumulate scroll delta bidirectionally
      accumulatedScroll.current = Math.max(0, Math.min(maxVirtualScroll, accumulatedScroll.current + e.deltaY))

      // Set virtual scroll target (drives all animations)
      virtualScrollTarget.set(accumulatedScroll.current)

      // Mark as complete when at the end (for pointer events)
      setZScrollComplete(accumulatedScroll.current >= maxVirtualScroll * 0.99)
    }

    window.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      window.removeEventListener('wheel', handleWheel)
    }
  }, [virtualScrollTarget, maxVirtualScroll])

  // Subscribe to virtual scroll changes to update depth progress
  useEffect(() => {
    const unsubscribe = virtualScroll.on('change', (latest) => {
      // Calculate depth transition progress
      const transitionStart = 0
      const transitionEnd = maxVirtualScroll
      const depthProgress = Math.max(0, Math.min(1, (latest - transitionStart) / (transitionEnd - transitionStart)))
      depthTransitionProgress.set(depthProgress)
    })

    return () => unsubscribe()
  }, [virtualScroll, depthTransitionProgress])

  // Track mouse position for parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      
      mouseX.set(x)
      mouseY.set(y)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  // Parallax transforms - refined depth hierarchy
  // Text: most subtle (±3px) - anchored feeling
  const textParallaxX = useTransform(smoothMouseX, [-1, 1], [-3, 3])
  const textParallaxY = useTransform(smoothMouseY, [-1, 1], [-3, 3])

  // Floating images configuration - centralized data
  const floatingImagesConfig = [
    { parallaxRange: [-8, 8] as [number, number], initialZ: 2000, duration: 1.4, delay: hasEnteredFromTransition ? 0.8 : 0.3 },
    { parallaxRange: [8, -8] as [number, number], initialZ: 1800, duration: 1.3, delay: 0.5 },
    { parallaxRange: [-12, 12] as [number, number], initialZ: 2200, duration: 1.5, delay: 0.4 },
    { parallaxRange: [10, -10] as [number, number], initialZ: 2500, duration: 1.6, delay: 0.6 },
    { parallaxRange: [-5, 5] as [number, number], initialZ: 2800, duration: 1.7, delay: 0.8 },
    { parallaxRange: [-7, 7] as [number, number], initialZ: 2100, duration: 1.45, delay: 0.55 },
  ]

  // Depth transition transforms - elements fly through during Stage 1 (0-40%)
  // Different layers for text, images, and squares (they pass through at different depths)
  // Using spring physics for ultra-smooth depth transitions
  const textDepthZRaw = useTransform(depthTransitionProgress, [0, 0.4], [0, 1500])
  const textDepthZ = useSpring(textDepthZRaw, { stiffness: 120, damping: 30, mass: 0.5 })

  const imageDepthZRaw = useTransform(depthTransitionProgress, [0, 0.4], [0, 2500])
  const imageDepthZ = useSpring(imageDepthZRaw, { stiffness: 120, damping: 30, mass: 0.5 })

  const squareDepthZRaw = useTransform(depthTransitionProgress, [0, 0.4], [0, 3500])
  const squareDepthZ = useSpring(squareDepthZRaw, { stiffness: 120, damping: 30, mass: 0.5 })
  
  // Track if initial settle animation has completed
  const [hasSettled, setHasSettled] = useState(!hasEnteredFromTransition)

  // Mark as settled after initial animations complete
  useEffect(() => {
    if (hasEnteredFromTransition && !hasSettled) {
      const timer = setTimeout(() => {
        setHasSettled(true)
      }, 2500) // After all elements have settled (1.8s delay + 1.4s animation)
      return () => clearTimeout(timer)
    }
  }, [hasEnteredFromTransition, hasSettled])

  const depthOpacityRaw = useTransform(depthTransitionProgress, [0, 0.2, 0.4], [1, 0.5, 0])
  const depthOpacity = useSpring(depthOpacityRaw, { stiffness: 150, damping: 25 })

  // Once settled, keep elements visible (don't fade based on scroll)
  const finalDepthOpacity = hasSettled ? 1 : depthOpacity

  // 3-STAGE SEQUENCE CONTROLLED BY SCROLL:
  // Stage 1 (0-40%): Header elements fly through
  // Stage 2 (40-70%): Color transition happens
  // Stage 3 (70-100%): Quote cards fade in

  // Opening section opacity - fully disappears by 40%
  const openingSectionOpacity = useTransform(depthTransitionProgress, [0, 0.4], [1, 0])

  // Quote cards opacity - only appears after 70%
  const quoteCardsOpacity = useTransform(depthTransitionProgress, [0, 0.7, 1], [0, 0, 1])

  // Pointer events for quote cards - enable when visible (>70%)
  const [cardsInteractive, setCardsInteractive] = useState(false)

  useEffect(() => {
    const unsubscribe = depthTransitionProgress.on('change', (latest) => {
      setCardsInteractive(latest > 0.7)
    })
    return () => unsubscribe()
  }, [depthTransitionProgress])
  
  // Background color - smooth transition from light red to dark red during scroll
  const backgroundColor = useTransform(
    useSpring(depthTransitionProgress, { stiffness: 80, damping: 30, mass: 0.8 }),
    [0, 1],
    ['#9E1B1E', '#590D0F']
  )

  // Determine final background: transparent → animated → locked dark red
  const getBackgroundColor = () => {
    if (!showBackground) return 'transparent'
    if (zScrollComplete) return '#590D0F'
    return backgroundColor
  }


  return (
    <motion.div
      ref={containerRef}
      className="learn-more-container"
      style={{
        backgroundColor: getBackgroundColor(),
      }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      transition={{ duration: 0 }}
      // Force GPU acceleration
      layout={false}
    >
      {/* Header Component */}
      <LearnMoreHeader 
        showBackground={showBackground}
        hasEnteredFromTransition={hasEnteredFromTransition}
      />

      {/* 1. Opening Statement Section - Fixed overlay during z-scroll */}
      {/* Only render when we're ready to show content */}
      {(showBackground || !hasEnteredFromTransition) && (
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
            z: textDepthZ, // Text moves through at closest depth layer
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
              delay: hasEnteredFromTransition ? 1.8 : 0.8 // Appear after flying elements settle
            }}
          >
            WE BRING EXCEPTIONAL YOUNG<br />
            TALENT UNDER ONE ROOF,<br />
            WHERE AMBITION CONCENTRATES<br />
            AND POTENTIAL MULTIPLIES.
          </motion.h1>
        </motion.div>

        {/* Decorative floating images with parallax - highway whoosh effect */}
        {floatingImagesConfig.map((config, i) => (
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

        {/* Initial flying-through squares (only pass through, don't stick) */}
        {hasEnteredFromTransition && [...Array(12)].map((_, i) => {
          const targetOpacity = i % 3 === 0 ? 0.4 : 1.0

          return (
            <motion.div
              key={`flythrough-square-${i}`}
              className={`decorative-square square-${i % 12}`}
              initial={{
                z: 2500,
                opacity: 0,
              }}
              animate={{
                z: -2000,
                opacity: [0, targetOpacity, 0],
              }}
              transition={{
                duration: 1.0,
                delay: 0.3 + (i * 0.05),
                ease: 'linear',
              }}
            />
          )
        })}

        {/* Decorative squares - fly through then stick */}
        {[...Array(12)].map((_, i) => (
          <DecorativeSquare
            key={`square-${i}`}
            index={i}
            hasEnteredFromTransition={hasEnteredFromTransition}
            smoothMouseX={smoothMouseX}
            smoothMouseY={smoothMouseY}
            squareDepthZ={squareDepthZ}
            depthTransitionProgress={depthTransitionProgress}
          />
        ))}
      </motion.section>
      )}

      {/* 2. Quote Cards Section - 3x2 Grid - Revealed behind as opening flies through */}
      <motion.section
        className="quote-cards-section"
        style={{
          opacity: quoteCardsOpacity,
          pointerEvents: cardsInteractive ? 'auto' : 'none'
        }}
      >
        <div className="quote-cards-grid">
          {quoteCardsData.map((card, index) => {
            const cardY = useTransform(
              depthTransitionProgress,
              [0.7, 0.85 + (index * 0.02)],
              [card.animateY, 0]
            )
            const cardOpacity = useTransform(
              depthTransitionProgress,
              [0.7, 0.85 + (index * 0.02)],
              [0, 1]
            )

            return (
              <motion.div
                key={card.name}
                className="quote-card-wrapper"
                style={{
                  y: cardY,
                  opacity: cardOpacity
                }}
              >
                <QuoteCard
                  name={card.name}
                  quote={card.quote}
                  imageUrl={card.imageUrl}
                  nameColor={card.nameColor}
                  delay={index * 0.1}
                />
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      {/* Map, CTA, and Final sections removed - will be recreated later */}
    </motion.div>
  )
}
