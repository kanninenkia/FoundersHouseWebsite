import { useEffect, useRef, useState } from 'react'
import { motion, useTransform, useMotionValue, useSpring, MotionValue } from 'framer-motion'
import Lenis from '@studio-freight/lenis'
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
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const lenisRef = useRef<Lenis | null>(null)
  
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
    stiffness: 150, // Increased for faster response
    damping: 25,    // Reduced for quicker settling
    mass: 0.3,      // Reduced for lighter feel
    restDelta: 0.01,
    restSpeed: 0.01
  })
  
  // Force initial state on mount
  useEffect(() => {
    virtualScrollTarget.set(0)
    virtualScroll.set(0)
    depthTransitionProgress.set(0)
    accumulatedScroll.current = 0
  }, [])

  // Entry animation state - check if coming from transition
  const hasEnteredFromTransition = sessionStorage.getItem('transitioningToLearnMore') === 'true'
  const showBackground = true

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
    })

    lenisRef.current = lenis

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  // Track accumulated virtual scroll from wheel events
  const accumulatedScroll = useRef(0)
  const maxVirtualScroll = window.innerHeight * 1.5 // Extended for 3-stage sequence
  const [zScrollComplete, setZScrollComplete] = useState(false)
  const isScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<number | undefined>(undefined)
  const [scrollProgress, setScrollProgress] = useState(0) // Direct state for reliability

  // Bidirectional Z-scroll animation - scrub forward and backward freely
  // But STOP hijacking wheel after reaching 100% to allow traditional scroll
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Only hijack wheel if we haven't reached the end OR user is scrolling back up
      const atTheEnd = accumulatedScroll.current >= maxVirtualScroll * 0.99

      if (!atTheEnd || e.deltaY < 0) {
        e.preventDefault()

        // Accumulate scroll delta bidirectionally with damping for smoother control
        const scrollDelta = e.deltaY * 1.5 // Increase multiplier for faster response
        accumulatedScroll.current = Math.max(0, Math.min(maxVirtualScroll, accumulatedScroll.current + scrollDelta))

        // Calculate and update progress IMMEDIATELY (don't rely on springs)
        const progress = Math.max(0, Math.min(1, accumulatedScroll.current / maxVirtualScroll))
        setScrollProgress(progress)

        // Set virtual scroll target (drives all animations)
        virtualScrollTarget.set(accumulatedScroll.current)

        // Track scrolling state
        isScrollingRef.current = true
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
        scrollTimeoutRef.current = window.setTimeout(() => {
          isScrollingRef.current = false
        }, 150)

        // Mark as complete when at the end (for pointer events)
        const isComplete = accumulatedScroll.current >= maxVirtualScroll * 0.99
        setZScrollComplete(isComplete)
      }
      // When at the end and scrolling down, allow default behavior (traditional scroll)
    }

    window.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      window.removeEventListener('wheel', handleWheel)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [virtualScrollTarget, maxVirtualScroll])

  // Subscribe to virtual scroll changes to update depth progress
  // Also sync with scrollProgress state for reliability
  useEffect(() => {
    // Update depth progress from state (always reliable)
    depthTransitionProgress.set(scrollProgress)
    
    const unsubscribe = virtualScroll.on('change', (latest) => {
      // Calculate depth transition progress
      const transitionStart = 0
      const transitionEnd = maxVirtualScroll
      const depthProgress = Math.max(0, Math.min(1, (latest - transitionStart) / (transitionEnd - transitionStart)))
      
      // Always update, even if value is the same (ensures consistency)
      depthTransitionProgress.set(depthProgress)
    })

    return () => unsubscribe()
  }, [virtualScroll, depthTransitionProgress, maxVirtualScroll, scrollProgress])

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
  // Stage 1 (0-50%): Header elements fly through gradually
  // Stage 2 (50-100%): Color transition happens and quote cards fade in

  // Opening section opacity - fades out more gradually to reveal cards
  const openingSectionOpacity = useTransform(depthTransitionProgress, [0, 0.5], [1, 0])

  // Pointer events for quote cards - enable when visible (>70%)
  const cardsInteractive = scrollProgress > 0.7
  
  // Background color - smooth transition from light red to dark red during scroll
  // Using custom interpolation to ensure proper color transition
  const backgroundColor = useTransform(
    depthTransitionProgress,
    (progress) => {
      // Light red: #9E1B1E (rgb(158, 27, 30))
      // Dark red: #590D0F (rgb(89, 13, 15))
      const r = Math.round(158 - (158 - 89) * progress)
      const g = Math.round(27 - (27 - 13) * progress)
      const b = Math.round(30 - (30 - 15) * progress)
      return `rgb(${r}, ${g}, ${b})`
    }
  )

  // Scroll-based width animation state
  const [scrollWidth, setScrollWidth] = useState('100%')

  // Listen to scroll after z-scroll completes to animate width
  useEffect(() => {
    if (!zScrollComplete) return

    const handleScroll = () => {
      const scrolled = window.scrollY
      const maxScroll = window.innerHeight * 2 // 200vh of content
      const progress = Math.min(scrolled / maxScroll, 1)
      const width = 100 - (progress * 20) // 100% → 80%
      setScrollWidth(`${width}%`)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [zScrollComplete])


  return (
    <motion.div
      ref={containerRef}
      className="learn-more-container"
      style={{
        backgroundColor: backgroundColor,
      }}
      initial={{ opacity: 1, backgroundColor: '#9E1B1E' }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      transition={{ duration: 0 }}
      // Force GPU acceleration
      layout={false}
    >
      {/* Header Component - handles its own entry animation logic */}
      <LearnMoreHeader />

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
          pointerEvents: cardsInteractive ? 'auto' : 'none'
        }}
      >
        <div className="quote-cards-grid">
          {quoteCardsData.map((card, index) => {
            // Calculate card visibility based PURELY on scroll progress
            // Threshold: Cards start appearing at 70% scroll progress
            const appearThreshold = 0.7
            const cardProgress = Math.max(0, Math.min(1, (scrollProgress - appearThreshold) / (1 - appearThreshold)))

            // Stagger each card's animation
            const staggerDelay = index * 0.15 // 150ms between each card
            const cardOpacity = Math.max(0, Math.min(1, (cardProgress - staggerDelay) * 3))

            // Y-axis animation: start from offset, move to 0
            const yOffset = card.animateY
            const cardY = yOffset * (1 - Math.max(0, Math.min(1, (cardProgress - staggerDelay) * 2)))

            return (
              <motion.div
                key={card.name}
                className="quote-card-wrapper"
                style={{
                  opacity: cardOpacity,
                  y: cardY
                }}
              >
                <QuoteCard
                  name={card.name}
                  quote={card.quote}
                  imageUrl={card.imageUrl}
                  nameColor={card.nameColor}
                />
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      {/* Scrollable Content Section - Only visible after quote cards complete */}
      {zScrollComplete && (
        <div
          ref={scrollContainerRef}
          style={{
            position: 'relative',
            minHeight: '200vh', // Creates scroll area
            background: '#2B0A05', // Darker background revealed behind
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <motion.div
            style={{
              width: scrollWidth,
              background: '#590D0F',
              minHeight: '200vh',
              position: 'relative',
            }}
          >
            {/* Content will go here */}
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
