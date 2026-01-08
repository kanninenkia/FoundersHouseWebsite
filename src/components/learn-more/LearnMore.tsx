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
    stiffness: 120, // Balanced for consistent feel
    damping: 30,    // Balanced damping
    mass: 0.5,      // Consistent mass
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
      // Only hijack wheel if we're in z-scroll range
      const atTheEnd = accumulatedScroll.current >= maxVirtualScroll
      const scrollingUp = e.deltaY < 0

      // Hijack wheel in these cases:
      // 1. Not at the end (still in z-scroll range)
      // 2. At the end, scrolling up, AND window.scrollY is at 0 (box scroll finished, return to z-scroll)
      const shouldHijack = !atTheEnd || (scrollingUp && window.scrollY === 0)

      if (shouldHijack) {
        e.preventDefault()

        // Accumulate scroll delta bidirectionally with damping for smoother control
        const scrollDelta = e.deltaY * 1.2 // Consistent multiplier for smooth response
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

        // Mark as complete when at 100% - BIDIRECTIONAL with hysteresis
        // Use slight threshold to prevent jumping when near boundary
        const isComplete = progress >= 0.98
        setZScrollComplete(isComplete)
      }
      // When at the end and scrolling down, OR in box scroll, allow default behavior (traditional scroll)
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

  // Parallax transforms for box-in-box section - depth hierarchy
  // OBSESSIVE text (z-index: 15) - closest, fastest parallax (±20px)
  const obsessiveParallaxX = useTransform(smoothMouseX, [-1, 1], [-20, 20])
  const obsessiveParallaxY = useTransform(smoothMouseY, [-1, 1], [-20, 20])

  // Placeholder image (z-index: 12) - middle layer, medium parallax (±12px)
  const placeholderParallaxX = useTransform(smoothMouseX, [-1, 1], [-12, 12])
  const placeholderParallaxY = useTransform(smoothMouseY, [-1, 1], [-12, 12])

  // Box container (z-index: 5) - furthest back, slowest parallax (±5px)
  const boxParallaxX = useTransform(smoothMouseX, [-1, 1], [-5, 5])
  const boxParallaxY = useTransform(smoothMouseY, [-1, 1], [-5, 5])

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

  // Opening section opacity - fades out completely by 60% to ensure clean transition
  const openingSectionOpacity = useTransform(depthTransitionProgress, [0, 0.4, 0.6], [1, 0.3, 0])

  // Pointer events for quote cards - enable when visible (>70% to match new threshold)
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

  // Scroll-based box animation state (width, height, opacity, and text for box-in-box effect)
  const [scrollWidth, setScrollWidth] = useState('100%')
  const [scrollHeight, setScrollHeight] = useState('100vh')
  const [imageWidth, setImageWidth] = useState('94.6%') // Image width reduced by 14% (1.1 * 0.86 * 100%)
  const [imageHeight, setImageHeight] = useState('86vh') // Image height reduced by 14% (0.86 * 100vh)
  const [boxScrollProgress, setBoxScrollProgress] = useState(0)
  const [boxOpacity, setBoxOpacity] = useState(1)
  const [obsessiveY, setObsessiveY] = useState(100) // Y transform percentage for slide-up
  const [obsessiveOpacity, setObsessiveOpacity] = useState(0) // Opacity for text visibility
  const [imageOpacity, setImageOpacity] = useState(0) // Opacity for image visibility

  // Listen to scroll to animate width + height (BIDIRECTIONAL)
  // Box stays FIXED at viewport center, just shrinks to reveal borders
  useEffect(() => {
    let rafId: number | null = null
    let lastScrollY = -1

    const handleScroll = () => {
      if (rafId !== null) return // Already scheduled

      rafId = requestAnimationFrame(() => {
        const scrolled = window.scrollY

        // Only update if scroll position actually changed
        if (Math.abs(scrolled - lastScrollY) > 0.5) {
          lastScrollY = scrolled

          if (zScrollComplete) {
            // Box scroll is active - calculate progress from current scroll position
            const maxScroll = window.innerHeight
            const progress = Math.min(scrolled / maxScroll, 1)

            // Track box scroll progress for card fade-out
            setBoxScrollProgress(progress)

            // === PHASE 1 & 2: Text/Image fade in WHILE borders close in (55-90%) ===
            // With 300vh: 55% = 165vh, 90% = 270vh (animation range = 105vh)
            const animationStart = 0.55  // Start at 55% (165vh) - after cards fully fade
            const animationEnd = 0.90    // Complete at 90% (270vh) - leaves buffer for full scroll
            const animationRange = animationEnd - animationStart // 35% of total = 105vh
            const animationProgress = Math.max(0, Math.min(1, (progress - animationStart) / animationRange))

            // Text Y position: Moves up from off-screen to final position
            const yPosition = (1 - animationProgress) * 100 // Starts at 100 (off screen), moves to 0
            setObsessiveY(yPosition)

            // Text/Image Opacity: Force to 1.0 once animation is complete
            // Use a threshold to snap to full opacity
            let textOpacity = animationProgress
            if (animationProgress >= 0.95) {
              textOpacity = 1.0 // Force full opacity at 95% of animation
            }

            setObsessiveOpacity(textOpacity)
            setImageOpacity(textOpacity)

            // === CENTRALIZED SIZE CALCULATIONS ===
            const boxProgress = animationProgress // Use same progress as text/image

            // Box dimensions (starts at 100%, shrinks to 70%)
            const BOX_START_SIZE = 100
            const BOX_END_SIZE = 70
            const boxSizeReduction = BOX_START_SIZE - BOX_END_SIZE // 30

            const width = BOX_START_SIZE - (boxProgress * boxSizeReduction)
            const height = BOX_START_SIZE - (boxProgress * boxSizeReduction)

            setScrollWidth(`${width}%`)
            setScrollHeight(`${height}vh`)

            // Image dimensions (15% bigger than original calculation)
            const IMAGE_SCALE = 1.15 // 15% bigger
            const imgWidth = width * 1.1 * 0.86 * IMAGE_SCALE
            const imgHeight = height * 0.86 * IMAGE_SCALE

            setImageWidth(`${imgWidth}%`)
            setImageHeight(`${imgHeight}vh`)

            // Box opacity: Keep at 100% throughout (no dimming)
            setBoxOpacity(1)
          } else {
            // Reset to initial state when z-scroll is active
            setBoxScrollProgress(0)
            setScrollWidth('100%')
            setImageWidth('94.6%')
            setScrollHeight('100vh')
            setImageHeight('86vh')
            setBoxOpacity(1)
            setObsessiveY(100)
            setObsessiveOpacity(0)
            setImageOpacity(0)
          }
        }

        rafId = null
      })
    }

    // Initial call to set starting values
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
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
          pointerEvents: cardsInteractive && !zScrollComplete ? 'auto' : 'none',
          zIndex: scrollProgress > 0.6 ? 10 : 1, // Move above box when cards are active (smoother)
        }}
      >
        <div className="quote-cards-grid">
          {quoteCardsData.map((card, index) => {
            // === PHASE 1: FADE IN (scroll progress 70%-100%) ===
            // Consistent entrance speed
            const appearThreshold = 0.7  // Start at 70% for good reveal window
            const fadeInProgress = Math.max(0, Math.min(1, (scrollProgress - appearThreshold) / (1 - appearThreshold)))

            // Stagger each card's fade-in animation (consistent spacing)
            const staggerDelay = index * 0.1 // Consistent spacing for all cards
            const fadeInOpacity = Math.max(0, Math.min(1, (fadeInProgress - staggerDelay) * 3.0)) // Consistent speed

            // Y-axis fade-in: start from offset, move to 0 (consistent movement)
            const yOffset = card.animateY
            const fadeInY = yOffset * (1 - Math.max(0, Math.min(1, (fadeInProgress - staggerDelay) * 3.0))) // Match opacity speed

            // === PHASE 2: FADE OUT IN REVERSE (as borders close in) ===
            // Cards fade out synchronized with box shrinking (BIDIRECTIONAL, consistent speed)
            const totalCards = quoteCardsData.length
            const reverseIndex = totalCards - 1 - index
            const reverseStaggerDelay = reverseIndex * 0.08  // Stagger spacing for fade-out

            // Fade out happens in first 50% of box scroll (0-50%), leaving space for text animation
            const fadeOutStart = 0.0   // Start immediately when box scroll begins
            const fadeOutEnd = 0.5     // End at 50% of scroll
            const fadeOutRange = fadeOutEnd - fadeOutStart

            // Calculate fade progress (BIDIRECTIONAL - works when scrolling up or down)
            const fadeOutProgress = zScrollComplete
              ? Math.max(0, Math.min(1, (boxScrollProgress - fadeOutStart) / fadeOutRange))
              : 0

            // Opacity: 1 → 0 with reverse stagger (stronger multiplier to complete in shorter range)
            const fadeOutOpacity = 1 - Math.max(0, Math.min(1, (fadeOutProgress - reverseStaggerDelay) * 2.5))

            // Y-axis fade-out: move to opposite direction (consistent drift)
            const fadeOutY = -yOffset * Math.max(0, Math.min(1, (fadeOutProgress - reverseStaggerDelay) * 2.5))

            // === COMBINE PHASES (BIDIRECTIONAL) ===
            // Always use the most appropriate phase based on scroll state
            let finalOpacity = fadeInOpacity
            let finalY = fadeInY

            // When box scroll is active, blend fade-in and fade-out
            if (zScrollComplete) {
              // Box scroll active: multiply fade-in by fade-out
              finalOpacity = fadeInOpacity * fadeOutOpacity
              finalY = fadeInY + fadeOutY
            } else {
              // Z-scroll active: use only fade-in (fully bidirectional)
              finalOpacity = fadeInOpacity
              finalY = fadeInY
            }

            return (
              <motion.div
                key={card.name}
                className="quote-card-wrapper"
                style={{
                  opacity: finalOpacity,
                  y: finalY
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
        <>
          {/* Fixed overlay with box-in-box effect */}
          <div
            style={{
              position: 'fixed', // Fixed to viewport
              top: 0,
              left: 0,
              width: '100%',
              height: '100vh',
              background: '#2B0A05', // Darker background revealed behind (box-in-box outer)
              display: 'flex',
              alignItems: 'center', // Center vertically
              justifyContent: 'center', // Center horizontally
              zIndex: 5, // Below quote cards section (z-index 10) but above background
              pointerEvents: 'none', // Allow scrolling through
            }}
          >
            {/* Box-in-box inner container - stays centered, shrinks to reveal borders */}
            <motion.div
              style={{
                width: scrollWidth,
                height: scrollHeight,
                x: boxParallaxX, // Parallax mouse movement (slowest - furthest back)
                y: boxParallaxY,
                background: '#590D0F',
                opacity: boxOpacity, // Semi-transparent during animation to see through
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'width 0.15s ease-out, height 0.15s ease-out, opacity 0.15s ease-out', // Consistent transitions
              }}
            >
              {/* Inner content - will go here */}
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '2rem',
                fontWeight: 900,
                padding: '4rem'
              }}>
                {/* Placeholder for future content */}
              </div>
            </motion.div>
          </div>

          {/* Invisible scroll area to trigger animation */}
          <div
            ref={scrollContainerRef}
            style={{
              position: 'relative',
              minHeight: '300vh', // 300vh to match maxScroll
              background: 'transparent',
              zIndex: 1,
            }}
          />

          {/* Placeholder image - slides in from left between box and text */}
          <motion.img
            src="/placeholder.webp"
            alt=""
            style={{
              position: 'fixed',
              top: '55%',
              left: '50%',
              x: placeholderParallaxX, // Parallax mouse movement (medium speed - middle layer)
              y: placeholderParallaxY,
              translateX: '-50%', // Keep centered (separate from parallax)
              translateY: '-50%',
              opacity: imageOpacity,
              zIndex: 12,
              width: imageWidth, // Reduced by 14% from 1.1x box width
              height: imageHeight, // Reduced by 14% from box height
              objectFit: 'cover', // Cover the entire box area
              pointerEvents: 'none',
            }}
          />

          {/* OBSESSIVE text - fades up from bottom left corner */}
          <motion.div
            style={{
              position: 'fixed',
              bottom: '2%', // 6% from bottom (6% lower than before)
              left: '8%', // 8% from left (adjusted)
              x: obsessiveParallaxX, // Parallax mouse movement (fastest - closest)
              y: obsessiveParallaxY,
              translateY: `${obsessiveY}%`, // Moves up from off-screen (separate from parallax)
              opacity: obsessiveOpacity, // Fades in with position after cards are gone
              zIndex: 15, // Above everything
              pointerEvents: 'none',
              fontFamily: 'Outfit, -apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: 'clamp(4rem, 10vw, 8rem)',
              fontWeight: 700,
              color: '#D82E11',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
            }}
          >
            OBSESSIVE
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
