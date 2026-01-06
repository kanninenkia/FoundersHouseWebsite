/**
 * LearnMore - Immersive Editorial Scroll Experience
 * A vertical narrative that descends into conviction
 * Designed for Awwwards-level interactive storytelling
 */

import { useEffect, useRef, useState } from 'react'
import { motion, useTransform, useMotionValue, useSpring } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import './LearnMore.css'

interface Founder {
  name: string
  title: string
  image?: string
}

const FOUNDERS: Founder[] = [
  { name: 'ILKKA PAANANEN', title: 'Supercell' },
  { name: 'MIKI KUUSI', title: 'Wolt' },
  { name: 'PETTERI KOPONEN', title: 'Relex Solutions' },
  { name: 'MIKKO KODISOJA', title: 'Swappie' },
  { name: 'ELINA BERGROTH', title: 'Silo.AI' },
  { name: 'TUOMAS ARTMAN', title: 'Linear' },
]

export const LearnMore = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const portraitSectionRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [scrollY, setScrollY] = useState(0)
  
  // Mouse parallax motion values with refined spring physics
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  // Increased damping for editorial smoothness (restraint over spectacle)
  const springConfig = { damping: 35, stiffness: 80, mass: 0.5 }
  const smoothMouseX = useSpring(mouseX, springConfig)
  const smoothMouseY = useSpring(mouseY, springConfig)

  // Scroll-based portrait section progress
  const portraitScrollProgress = useMotionValue(0)
  
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

  // Smooth depth scroll with spring physics
  useEffect(() => {
    // Prevent default scrolling
    document.body.style.overflow = 'hidden'
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      
      // Update target scroll position (spring will smooth it out)
      virtualScrollTarget.set(Math.max(0, virtualScrollTarget.get() + e.deltaY * 0.5))
    }
    
    // Subscribe to smooth virtual scroll changes
    const unsubscribe = virtualScroll.on('change', (latest) => {
      // Calculate depth transition progress smoothly - starts immediately on first scroll
      const transitionStart = 0 // Start immediately, no delay
      const transitionEnd = window.innerHeight * 1.0 // Complete within 1 viewport height
      const depthProgress = Math.max(0, Math.min(1, (latest - transitionStart) / (transitionEnd - transitionStart)))
      depthTransitionProgress.set(depthProgress)
    })
    
    window.addEventListener('wheel', handleWheel, { passive: false })
    
    return () => {
      window.removeEventListener('wheel', handleWheel)
      document.body.style.overflow = ''
      unsubscribe()
    }
  }, [virtualScroll, virtualScrollTarget, depthTransitionProgress])

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

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setScrollY(currentScrollY)
      
      // Calculate depth transition progress (first section to quotes section)
      // Transition happens over approximately 1 viewport height
      const transitionStart = window.innerHeight * 0.5
      const transitionEnd = window.innerHeight * 1.5
      const depthProgress = Math.max(0, Math.min(1, (currentScrollY - transitionStart) / (transitionEnd - transitionStart)))
      depthTransitionProgress.set(depthProgress)
      
      // Calculate portrait section scroll progress
      if (portraitSectionRef.current) {
        const rect = portraitSectionRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const sectionTop = rect.top
        const sectionHeight = rect.height
        
        // Progress from 0 to 1 as section enters and moves through viewport
        const start = viewportHeight * 0.8
        const end = -sectionHeight * 0.3
        const progress = Math.max(0, Math.min(1, (start - sectionTop) / (start - end)))
        
        portraitScrollProgress.set(progress)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial calculation
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Parallax transforms - refined depth hierarchy
  // Text: most subtle (±3px) - anchored feeling
  const textParallaxX = useTransform(smoothMouseX, [-1, 1], [-3, 3])
  const textParallaxY = useTransform(smoothMouseY, [-1, 1], [-3, 3])
  
  // Images: medium depth (±8px) - floating feeling
  const imageParallaxX = useTransform(smoothMouseX, [-1, 1], [-8, 8])
  const imageParallaxY = useTransform(smoothMouseY, [-1, 1], [-8, 8])

  // Depth transition transforms - elements fly straight through the user's FOV
  // Different layers for text, images, and squares (they pass through at different depths)
  // Using spring physics for ultra-smooth depth transitions
  const textDepthZRaw = useTransform(depthTransitionProgress, [0, 1], [0, 1500])
  const textDepthZ = useSpring(textDepthZRaw, { stiffness: 120, damping: 30, mass: 0.5 })
  
  const imageDepthZRaw = useTransform(depthTransitionProgress, [0, 1], [0, 2500])
  const imageDepthZ = useSpring(imageDepthZRaw, { stiffness: 120, damping: 30, mass: 0.5 })
  
  const squareDepthZRaw = useTransform(depthTransitionProgress, [0, 1], [0, 3500])
  const squareDepthZ = useSpring(squareDepthZRaw, { stiffness: 120, damping: 30, mass: 0.5 })
  
  const depthOpacityRaw = useTransform(depthTransitionProgress, [0, 0.3, 1], [1, 0.5, 0])
  const depthOpacity = useSpring(depthOpacityRaw, { stiffness: 150, damping: 25 })
  
  const depthBlurRaw = useTransform(depthTransitionProgress, [0, 0.5, 1], [0, 10, 30])
  const depthBlur = useSpring(depthBlurRaw, { stiffness: 100, damping: 25 })
  
  // Pre-create blur filter transform to prevent stuttering
  const blurFilter = useTransform(depthBlur, (blur) => `blur(${blur}px)`)
  
  // Background color - solid for seamless transition
  const backgroundColor = useTransform(depthTransitionProgress, () => {
    // Keep solid color throughout - no gradient for seamless transition
    return '#C03434'
  })
  
  // Override background to transparent if we're waiting for transition to complete
  const finalBackgroundColor = showBackground ? backgroundColor : 'transparent'
  
  // Trigger quote card animations when depth transition completes
  const [showQuoteCards, setShowQuoteCards] = useState(false)
  
  useEffect(() => {
    const unsubscribe = depthTransitionProgress.on('change', (progress) => {
      if (progress >= 0.9 && !showQuoteCards) {
        setShowQuoteCards(true)
      }
    })
    
    return () => unsubscribe()
  }, [depthTransitionProgress, showQuoteCards])

  // Map section scroll transformations - subtle and cinematic
  const mapScrollProgress = Math.max(0, Math.min(1, (scrollY - 2500) / 1000))
  const mapTranslateX = mapScrollProgress * 200
  const mapRotate = mapScrollProgress * 2
  const mapScale = 1 + mapScrollProgress * 0.15

  // CTA velocity contrast
  const ctaScrollProgress = Math.max(0, Math.min(1, (scrollY - 3500) / 800))
  const ctaTranslateY = -ctaScrollProgress * 100


  return (
    <motion.div
      ref={containerRef}
      className="learn-more-container"
      style={{ 
        backgroundColor: finalBackgroundColor
      }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      transition={{ duration: 0 }}
      // Force GPU acceleration
      layout={false}
    >
      {/* Header */}
      <motion.header
        className="learn-more-header"
        initial={{ opacity: 0 }}
        animate={{ opacity: showBackground ? 1 : 0 }}
        transition={{
          duration: 1.0,
          delay: hasEnteredFromTransition ? 2.0 : 1.5,
          ease: [0.22, 1, 0.36, 1]
        }}
      >
        <img src="/logoWhite.png" alt="Founders House" className="header-logo" />
        <img src="/hamburgerWhite.svg" alt="Menu" className="header-menu" />
      </motion.header>

      {/* Back to Map Button */}
      <motion.button
        className="back-to-map-button"
        onClick={() => {
          sessionStorage.removeItem('hasSeenLoading')
          sessionStorage.removeItem('transitioningToLearnMore')
          navigate('/')
        }}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: showBackground ? 1 : 0, y: showBackground ? 0 : -12 }}
        transition={{
          delay: hasEnteredFromTransition ? 2.2 : 1.0,
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1]
        }}
        whileHover={{ 
          scale: 1.02,
          transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
        }}
        whileTap={{ 
          scale: 0.98,
          transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
        }}
      >
        ← Back to Map
      </motion.button>

      {/* 1. Opening Statement Section */}
      {/* Only render when we're ready to show content */}
      {(showBackground || !hasEnteredFromTransition) && (
      <section className="opening-section">
        <motion.div 
          className="opening-content"
          style={{ 
            x: textParallaxX, 
            y: textParallaxY,
            z: textDepthZ, // Text moves through at closest depth layer
            opacity: depthOpacity,
            filter: blurFilter
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
        <motion.div
          className="floating-image floating-image-1"
          style={{ 
            x: imageParallaxX, 
            y: imageParallaxY,
            z: imageDepthZ, // Images move through at middle depth layer
            opacity: depthOpacity,
            filter: blurFilter
          }}
          initial={{
            opacity: 0,
            z: hasEnteredFromTransition ? 2500 : 2000,
            filter: hasEnteredFromTransition ? 'blur(15px)' : "blur(10px)"
          }}
          animate={{
            // If from transition: fly through first, then settle smoothly
            z: hasEnteredFromTransition ? [2500, -100, 0] : 0,
            opacity: hasEnteredFromTransition ? [0, 1, 1] : 1,
            filter: hasEnteredFromTransition ? ['blur(15px)', 'blur(0.5px)', 'blur(0px)'] : "blur(0px)",
          }}
          transition={{
            duration: hasEnteredFromTransition ? 1.3 : 1.4,
            ease: [0.25, 1, 0.5, 1], // Smoother ease-out
            delay: hasEnteredFromTransition ? 0.8 : 0.3,
            times: hasEnteredFromTransition ? [0, 0.7, 1] : undefined,
          }}
        />

        <motion.div
          className="floating-image floating-image-2"
          style={{
            x: useTransform(smoothMouseX, [-1, 1], [8, -8]),
            y: useTransform(smoothMouseY, [-1, 1], [8, -8]),
            z: imageDepthZ, // Images move through at middle depth layer
            opacity: depthOpacity,
            filter: blurFilter
          }}
          initial={{ opacity: 0, z: 1800, filter: "blur(8px)" }}
          animate={{
            opacity: 1,
            z: 0,
            filter: "blur(0px)"
          }}
          transition={{
            duration: 1.3,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.5
          }}
        />

        <motion.div
          className="floating-image floating-image-3"
          style={{
            x: useTransform(smoothMouseX, [-1, 1], [-12, 12]),
            y: useTransform(smoothMouseY, [-1, 1], [-12, 12]),
            z: imageDepthZ, // Images move through at middle depth layer
            opacity: depthOpacity,
            filter: blurFilter
          }}
          initial={{ opacity: 0, z: 2200, filter: "blur(12px)" }}
          animate={{
            opacity: 1,
            z: 0,
            filter: "blur(0px)"
          }}
          transition={{
            duration: 1.5,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.4
          }}
        />

        <motion.div
          className="floating-image floating-image-4"
          style={{
            x: useTransform(smoothMouseX, [-1, 1], [10, -10]),
            y: useTransform(smoothMouseY, [-1, 1], [10, -10]),
            z: imageDepthZ, // Images move through at middle depth layer
            opacity: depthOpacity,
            filter: blurFilter
          }}
          initial={{ opacity: 0, z: 2500, filter: "blur(14px)" }}
          animate={{
            opacity: 1,
            z: 0,
            filter: "blur(0px)"
          }}
          transition={{
            duration: 1.6,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.6
          }}
        />

        <motion.div
          className="floating-image floating-image-5"
          style={{
            x: useTransform(smoothMouseX, [-1, 1], [-5, 5]),
            y: useTransform(smoothMouseY, [-1, 1], [-5, 5]),
            z: imageDepthZ, // Images move through at middle depth layer
            opacity: depthOpacity,
            filter: blurFilter
          }}
          initial={{ opacity: 0, z: 2800, filter: "blur(16px)" }}
          animate={{
            opacity: 1,
            z: 0,
            filter: "blur(0px)"
          }}
          transition={{
            duration: 1.7,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.8
          }}
        />

        <motion.div
          className="floating-image floating-image-6"
          style={{
            x: useTransform(smoothMouseX, [-1, 1], [-7, 7]),
            y: useTransform(smoothMouseY, [-1, 1], [-7, 7]),
            z: imageDepthZ, // Images move through at middle depth layer
            opacity: depthOpacity,
            filter: blurFilter
          }}
          initial={{ opacity: 0, z: 2100, filter: "blur(11px)" }}
          animate={{
            opacity: 1,
            z: 0,
            filter: "blur(0px)"
          }}
          transition={{
            duration: 1.45,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.55
          }}
        />

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
                filter: 'blur(15px)',
              }}
              animate={{
                z: -2000, // Fly all the way through, don't stick
                opacity: [0, targetOpacity, targetOpacity, 0],
                filter: ['blur(15px)', 'blur(0px)', 'blur(0px)', 'blur(12px)'],
              }}
              transition={{
                duration: 1.0,
                delay: 0.3 + (i * 0.05), // Start shortly after mount, continue from TransitionOverlay
                ease: 'linear',
              }}
            />
          )
        })}

        {/* Decorative squares - fly through then stick */}
        {[...Array(12)].map((_, i) => {
          // Get the target opacity from CSS class
          const targetOpacity = [1, 3, 4, 7, 9, 11].includes(i) ? 0.4 : 1

          // ALWAYS call hooks in the same order (Rules of Hooks)
          const parallaxX = useTransform(smoothMouseX, [-1, 1], [-15 - (i * 2), 15 + (i * 2)])
          const parallaxY = useTransform(smoothMouseY, [-1, 1], [-15 - (i * 2), 15 + (i * 2)])
          const depthOpacityTransform = useTransform(depthTransitionProgress, (progress) => {
            if (progress === 0) return targetOpacity
            return Math.max(0, targetOpacity - progress * 1.5)
          })

          // If coming from transition, start with flying-through phase
          if (hasEnteredFromTransition) {
            return (
              <motion.div
                key={`square-${i}`}
                className={`decorative-square square-${i}`}
                style={{
                  x: parallaxX,
                  y: parallaxY,
                }}
                initial={{
                  z: 2500,
                  opacity: 0,
                  filter: 'blur(15px)',
                }}
                animate={{
                  // Smooth deceleration - no bounce, pure ease out
                  z: [2500, -150, 0], // Reduced overshoot for smoother motion
                  opacity: [0, targetOpacity, targetOpacity],
                  filter: ['blur(15px)', 'blur(1px)', 'blur(0px)'],
                }}
                transition={{
                  duration: 1.4, // Slightly faster
                  delay: 0.9 + (i * 0.05), // Start after flythrough squares, tighter spacing
                  ease: [0.25, 1, 0.5, 1], // Smoother ease-out curve
                  times: [0, 0.7, 1], // More time in fly phase
                }}
              />
            )
          }

          // Default behavior for direct navigation
          const startZ = 3000 + (i * 150)
          const finalZ = 0
          const startBlur = 15 + (i * 0.8)

          return (
            <motion.div
              key={`square-${i}`}
              className={`decorative-square square-${i}`}
              style={{
                x: parallaxX,
                y: parallaxY,
                z: squareDepthZ,
                opacity: depthOpacityTransform,
                filter: blurFilter
              }}
              initial={{
                opacity: 0,
                z: startZ,
                filter: `blur(${startBlur}px)`
              }}
              animate={{
                opacity: targetOpacity,
                z: finalZ,
                filter: "blur(0px)"
              }}
              transition={{
                duration: 1.2 + (i * 0.08),
                ease: [0.16, 1, 0.3, 1],
                delay: 0.1 + (i * 0.04)
              }}
            />
          )
        })}
      </section>
      )}

      {/* 2. Portrait Grid Section - Brick by Brick */}
      <section ref={portraitSectionRef} className="portrait-section">
        <motion.div className="portrait-grid">
          {FOUNDERS.map((founder, index) => {
            // Determine column position (0 = left, 1 = middle, 2 = right)
            const column = index % 3
            
            // Create individual progress for each card based on overall scroll progress
            const cardDelay = index * 0.15
            const cardProgress = useTransform(
              portraitScrollProgress,
              [cardDelay, cardDelay + 0.4],
              [0, 1]
            )
            
            // Opacity tied to scroll
            const opacity = useTransform(cardProgress, [0, 1], [0, 1])
            
            // Set movement based on column
            let yTransform
            if (column === 0) {
              // Left column: slide down from top
              yTransform = useTransform(cardProgress, [0, 1], [-150, 0])
            } else if (column === 1) {
              // Middle column: fade in place
              yTransform = useTransform(cardProgress, [0, 1], [0, 0])
            } else {
              // Right column: slide up from bottom
              yTransform = useTransform(cardProgress, [0, 1], [150, 0])
            }
            
            return (
              <motion.div
                key={founder.name}
                className="portrait-card"
                style={{
                  opacity,
                  y: yTransform,
                  x: useTransform(smoothMouseX, [-1, 1], [-4, 4]),
                }}
              >
                <div className="portrait-image-placeholder" />
                <div className="portrait-info">
                  <h3 className="founder-name">{founder.name}</h3>
                  <p className="founder-title">{founder.title}</p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

      {/* 3. Value Sections - OBSESSIVE */}
      <section className="value-section obsessive-section">
        <motion.div 
          className="value-content"
          style={{ x: imageParallaxX, y: imageParallaxY }}
        >
          {/* Left column - subtle fade down */}
          <motion.div 
            className="value-left"
            initial={{ opacity: 0, y: -18 }}
            animate={showQuoteCards ? { opacity: 1, y: 0 } : { opacity: 0, y: -18 }}
            transition={{ 
              duration: 1.2, 
              ease: [0.22, 1, 0.36, 1],
              delay: 0.1 
            }}
          >
            <div className="value-image-large">
              <div className="red-frame-overlay" />
            </div>
          </motion.div>
          
          {/* Right column - clean fade in (middle timing) */}
          <motion.div 
            className="value-right"
            initial={{ opacity: 0, y: 0 }}
            animate={showQuoteCards ? { opacity: 1, y: 0 } : { opacity: 0, y: 0 }}
            transition={{ 
              duration: 1.2, 
              ease: [0.22, 1, 0.36, 1],
              delay: 0.2 
            }}
          >
            <motion.h2 
              className="value-headline"
              style={{ x: textParallaxX, y: textParallaxY }}
            >
              OBSESSIVE
            </motion.h2>
            <motion.p 
              className="value-copy"
              style={{ x: textParallaxX, y: textParallaxY }}
            >
              For those who believe<br />
              that 80% is failure.<br />
              We don't do good work—<br />
              we do work that defines eras.
            </motion.p>
          </motion.div>
        </motion.div>
        <div className="vertical-word">OBSESSIVE</div>
      </section>

      {/* 4. Value Sections - AMBITIOUS */}
      <section className="value-section ambitious-section">
        <motion.div 
          className="value-content"
          style={{ x: imageParallaxX, y: imageParallaxY }}
        >
          {/* Left column - clean fade in (middle timing) */}
          <motion.div 
            className="value-left"
            initial={{ opacity: 0, y: 0 }}
            animate={showQuoteCards ? { opacity: 1, y: 0 } : { opacity: 0, y: 0 }}
            transition={{ 
              duration: 1.2, 
              ease: [0.22, 1, 0.36, 1],
              delay: 0.3 
            }}
          >
            <motion.h2 
              className="value-headline"
              style={{ x: textParallaxX, y: textParallaxY }}
            >
              AMBITIOUS
            </motion.h2>
            <motion.p 
              className="value-copy"
              style={{ x: textParallaxX, y: textParallaxY }}
            >
              We're not here to participate—<br />
              we're here to rewrite the rules.<br />
              Ambition isn't a trait,<br />
              it's a requirement.
            </motion.p>
          </motion.div>
          
          {/* Right column - subtle fade up */}
          <motion.div 
            className="value-right"
            initial={{ opacity: 0, y: 18 }}
            animate={showQuoteCards ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            transition={{ 
              duration: 1.2, 
              ease: [0.22, 1, 0.36, 1],
              delay: 0.2 
            }}
          >
            <div className="value-image-large">
              <div className="red-frame-overlay" />
            </div>
          </motion.div>
        </motion.div>
        <div className="vertical-word">AMBITIOUS</div>
      </section>

      {/* 5. Value Sections - NEXT-GEN */}
      <section className="value-section nextgen-section">
        <motion.div 
          className="value-content"
          style={{ x: imageParallaxX, y: imageParallaxY }}
        >
          {/* Left column - subtle fade down */}
          <motion.div 
            className="value-left"
            initial={{ opacity: 0, y: -18 }}
            animate={showQuoteCards ? { opacity: 1, y: 0 } : { opacity: 0, y: -18 }}
            transition={{ 
              duration: 1.2, 
              ease: [0.22, 1, 0.36, 1],
              delay: 0.5 
            }}
          >
            <div className="value-image-large">
              <div className="red-frame-overlay" />
            </div>
          </motion.div>
          
          {/* Right column - clean fade in */}
          <motion.div 
            className="value-right"
            initial={{ opacity: 0, y: 0 }}
            animate={showQuoteCards ? { opacity: 1, y: 0 } : { opacity: 0, y: 0 }}
            transition={{ 
              duration: 1.2, 
              ease: [0.22, 1, 0.36, 1],
              delay: 0.6 
            }}
          >
            <motion.h2 
              className="value-headline"
              style={{ x: textParallaxX, y: textParallaxY }}
            >
              NEXT-GEN
            </motion.h2>
            <motion.p 
              className="value-copy"
              style={{ x: textParallaxX, y: textParallaxY }}
            >
              The future isn't waiting<br />
              for permission.<br />
              It's being built in this building,<br />
              by people who refuse to wait.
            </motion.p>
          </motion.div>
        </motion.div>
        <div className="vertical-word">NEXT-GEN</div>
      </section>

      {/* 6. Map Showstopper Section */}
      <section className="map-section">
        <motion.div 
          className="map-container"
          style={{
            x: mapTranslateX,
            rotate: mapRotate,
            scale: mapScale
          }}
        >
          <div className="map-placeholder">
            {/* Map image would go here */}
            <div className="map-pin" />
          </div>
        </motion.div>
        <motion.div 
          className="map-content"
          style={{ x: textParallaxX, y: textParallaxY }}
        >
          <h2 className="map-headline">LOCATION IS CONVICTION</h2>
          <p className="map-copy">
            Helsinki. The epicenter of Nordic innovation.<br />
            Where billion-dollar companies are built quietly,<br />
            without the noise.
          </p>
        </motion.div>
      </section>

      {/* 7. Value Sections - BUILDERS */}
      <section className="value-section builders-section">
        <motion.div 
          className="value-content"
          style={{ x: imageParallaxX, y: imageParallaxY }}
        >
          {/* Left column - clean fade in */}
          <motion.div 
            className="value-left"
            initial={{ opacity: 0, y: 0 }}
            animate={showQuoteCards ? { opacity: 1, y: 0 } : { opacity: 0, y: 0 }}
            transition={{ 
              duration: 1.2, 
              ease: [0.22, 1, 0.36, 1],
              delay: 0.7 
            }}
          >
            <motion.h2 
              className="value-headline"
              style={{ x: textParallaxX, y: textParallaxY }}
            >
              BUILDERS
            </motion.h2>
            <motion.p 
              className="value-copy"
              style={{ x: textParallaxX, y: textParallaxY }}
            >
              We're those who building,<br />
              not just those who are talking about building.<br />
              Action over aspiration.<br />
              Always.
            </motion.p>
          </motion.div>
          
          {/* Right column - subtle fade up */}
          <motion.div 
            className="value-right"
            initial={{ opacity: 0, y: 18 }}
            animate={showQuoteCards ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            transition={{ 
              duration: 1.2, 
              ease: [0.22, 1, 0.36, 1],
              delay: 0.8 
            }}
          >
            <div className="value-image-large">
              <div className="red-frame-overlay" />
            </div>
          </motion.div>
        </motion.div>
        <div className="vertical-word">BUILDERS</div>
      </section>

      {/* 8. CTA Section - Velocity Contrast */}
      <section 
        className="cta-section"
        style={{
          transform: `translateY(${ctaTranslateY}px)`
        }}
      >
        <motion.div 
          className="cta-content"
          style={{ x: textParallaxX, y: textParallaxY }}
        >
          <motion.h2 
            className="cta-headline"
            whileHover={{ 
              scale: 1.01,
              transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
            }}
          >
            READY TO BUILD?
          </motion.h2>
          <motion.button 
            className="cta-button"
            whileHover={{ 
              scale: 1.03,
              transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
            }}
            whileTap={{ 
              scale: 0.98,
              transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
            }}
          >
            APPLY NOW
          </motion.button>
        </motion.div>
      </section>

      {/* 9. Final Statement - Exclusivity Lock-In */}
      <section className="final-section">
        <motion.div 
          className="final-content"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1.5 }}
        >
          <h2 className="final-statement">
            ONLY A HANDFUL MOVE FAST ENOUGH TO BE HERE,
            <br />
            AND THEY BUILD ALONGSIDE THE PEOPLE
            <br />
            WHO WILL DEFINE WHAT COMES NEXT.
          </h2>
          <p className="final-cta">
            JOIN US. BUILD WITH US. DEFINE TOMORROW.
          </p>
        </motion.div>
      </section>
    </motion.div>
  )
}
