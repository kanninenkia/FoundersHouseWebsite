import { useEffect, useRef, useState } from 'react'
import { motion, useTransform, useMotionValue, useSpring, MotionValue } from 'framer-motion'
import Lenis from '@studio-freight/lenis'
import { QuoteCard } from './QuoteCard'
import { LearnMoreHeader } from './LearnMoreHeader'
import { FloatingImage, FLOATING_IMAGES_CONFIG } from './FloatingImage'
import { quoteCardsData } from './quoteCardsData'
import { BoxInBoxSection } from './BoxInBoxSection'
import Footer from '../Footer'
import './LearnMore.css'

const EASING = {
  // Standard ease for most animations - smooth and natural
  standard: (t: number) => {
    // cubic-bezier(0.4, 0, 0.2, 1)
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2
  },
  
  // Smooth ease out for fades and reveals
  out: (t: number) => {
    // cubic-bezier(0.22, 1, 0.36, 1)
    return 1 - Math.pow(1 - t, 3)
  },
  
  // Gentle ease in-out for continuous movements
  inOut: (t: number) => {
    // cubic-bezier(0.65, 0, 0.35, 1)
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2
  },
  
  // For framer-motion components
  bezier: {
    standard: [0.4, 0, 0.2, 1] as const,
    out: [0.22, 1, 0.36, 1] as const,
    inOut: [0.65, 0, 0.35, 1] as const,
  }
}

const ANIMATION_CONFIG = {
  spring: { damping: 35, stiffness: 80, mass: 0.5 },
  virtualScrollSpring: { stiffness: 120, damping: 30, mass: 0.5, restDelta: 0.01, restSpeed: 0.01 },

  maxVirtualScroll: 1.5,
  boxScrollHeight: 3,

  timing: {
    cardsFadeOut: { start: 0, end: 0.35 },  // Reduced window for faster, complete fade out
    textImageFadeIn: { start: 0.55, end: 0.90 },
    cardsFadeIn: { threshold: 0.7 },
  },

  // Narrative-driven scroll phases - each phase gets equal attention
  scrollPhases: {
    // Phase 1: Box-in-box reveal with OBSESSIVE text (1.5x viewport)
    phase1Duration: 1.5,
    
    // Phase 2: Transform to rectangle + translate + AMBITIOUS text (2.0x viewport)
    // Sub-phase 2a: Transform elements (first half)
    // Sub-phase 2b: Translate + reveal place2 (second half)
    phase2Duration: 2.0,
    
    // Pause: Let AMBITIOUS breathe before next transformation (0.2x viewport)
    pauseDuration: 0.2,
    
    // Phase 3: Rotate map + transform to NEXT-GEN + reveal place3 (2.0x viewport)
    // Sub-phase 3a: Rotate & zoom map in place (first half)
    // Sub-phase 3b: Move map + text transformation (second half)
    phase3Duration: 2.0,
    
    // Phase 4: Sticky BUILDERS + reveal place4 (2.0x viewport)
    // Fade out map & place3, rotate text to horizontal, stick it high, reveal place4
    phase4Duration: 2.0,

    // Phase 5: Final CTA (2.0x viewport)
    // Fade out everything, background to dark red, fade in CTA text and horses image
    phase5Duration: 2.0,
  },

  box: { startSize: 100, endSize: 75 },
  imageScale: 1.15,

  parallax: {
    obsessiveText: { x: [-20, 20], y: [-20, 20] },
    image: { x: [-12, 12], y: [-12, 12] },
    box: { x: [-5, 5], y: [-5, 5] },
    text: { x: [-3, 3], y: [-3, 3] },
  },

  quoteCards: {
    fadeInSpeed: 1.8,  // Reduced from 3.0 for smoother fade-in
    fadeOutSpeed: 2.5,  // Faster fade out to ensure complete disappearance
    staggerIn: 0.12,    // Slightly increased for better pacing
    staggerOut: 0.08,   // Reduced for tighter fade out sequence
  },

  decorativeSquares: {
    parallaxBase: 15,
    opacityIndices: [1, 3, 4, 7, 9, 11],
    opacityDim: 0.4,
    opacityFull: 1.0,
  },

  positioning: {
    obsessiveBottom: '2%',
    obsessiveLeft: '8%',
    imageTop: '55%',
  },
}

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
        duration: 1.2 + (index * 0.08),
        ease: EASING.bezier.out,
        delay: 0.1 + (index * 0.04)
      }}
    />
  )
}

export const LearnMore = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const lenisRef = useRef<Lenis | null>(null)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothMouseX = useSpring(mouseX, ANIMATION_CONFIG.spring)
  const smoothMouseY = useSpring(mouseY, ANIMATION_CONFIG.spring)

  const depthTransitionProgress = useMotionValue(0)
  const virtualScrollTarget = useMotionValue(0)
  const virtualScroll = useSpring(virtualScrollTarget, ANIMATION_CONFIG.virtualScrollSpring)

  useEffect(() => {
    virtualScrollTarget.set(0)
    virtualScroll.set(0)
    depthTransitionProgress.set(0)
    accumulatedScroll.current = 0
  }, [])

  const hasEnteredFromTransition = sessionStorage.getItem('transitioningToLearnMore') === 'true'
  const showBackground = true

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
    return () => lenis.destroy()
  }, [])

  const accumulatedScroll = useRef(0)
  const maxVirtualScroll = window.innerHeight * ANIMATION_CONFIG.maxVirtualScroll
  const [zScrollComplete, setZScrollComplete] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const isScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const atTheEnd = accumulatedScroll.current >= maxVirtualScroll
      const scrollingUp = e.deltaY < 0
      const atTop = window.scrollY <= 5 // Small threshold to account for rounding
      const shouldHijack = !atTheEnd || (scrollingUp && atTop)

      if (shouldHijack) {
        e.preventDefault()

        const scrollDelta = e.deltaY * 1.2
        accumulatedScroll.current = Math.max(0, Math.min(maxVirtualScroll, accumulatedScroll.current + scrollDelta))

        const progress = Math.max(0, Math.min(1, accumulatedScroll.current / maxVirtualScroll))
        setScrollProgress(progress)
        virtualScrollTarget.set(accumulatedScroll.current)

        isScrollingRef.current = true
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
        scrollTimeoutRef.current = window.setTimeout(() => {
          isScrollingRef.current = false
        }, 150)

        setZScrollComplete(progress >= 0.98)
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      window.removeEventListener('wheel', handleWheel)
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    }
  }, [virtualScrollTarget, maxVirtualScroll])

  useEffect(() => {
    depthTransitionProgress.set(scrollProgress)
    const unsubscribe = virtualScroll.on('change', (latest) => {
      const depthProgress = Math.max(0, Math.min(1, latest / maxVirtualScroll))
      depthTransitionProgress.set(depthProgress)
    })
    return unsubscribe
  }, [virtualScroll, depthTransitionProgress, maxVirtualScroll, scrollProgress])

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

  const textParallaxX = useTransform(smoothMouseX, [-1, 1], ANIMATION_CONFIG.parallax.text.x)
  const textParallaxY = useTransform(smoothMouseY, [-1, 1], ANIMATION_CONFIG.parallax.text.y)

  const floatingImagesConfig = FLOATING_IMAGES_CONFIG.map((config: typeof FLOATING_IMAGES_CONFIG[0], i: number) =>
    i === 0 && hasEnteredFromTransition ? { ...config, delay: 0.8 } : config
  )

  const textDepthZ = useSpring(useTransform(depthTransitionProgress, [0, 0.4], [0, 1500]), ANIMATION_CONFIG.virtualScrollSpring)
  const imageDepthZ = useSpring(useTransform(depthTransitionProgress, [0, 0.4], [0, 2500]), ANIMATION_CONFIG.virtualScrollSpring)
  const squareDepthZ = useSpring(useTransform(depthTransitionProgress, [0, 0.4], [0, 3500]), ANIMATION_CONFIG.virtualScrollSpring)

  const obsessiveParallaxX = useTransform(smoothMouseX, [-1, 1], ANIMATION_CONFIG.parallax.obsessiveText.x)
  const obsessiveParallaxY = useTransform(smoothMouseY, [-1, 1], ANIMATION_CONFIG.parallax.obsessiveText.y)
  const placeholderParallaxX = useTransform(smoothMouseX, [-1, 1], ANIMATION_CONFIG.parallax.image.x)
  const placeholderParallaxY = useTransform(smoothMouseY, [-1, 1], ANIMATION_CONFIG.parallax.image.y)
  const boxParallaxX = useTransform(smoothMouseX, [-1, 1], ANIMATION_CONFIG.parallax.box.x)
  const boxParallaxY = useTransform(smoothMouseY, [-1, 1], ANIMATION_CONFIG.parallax.box.y)
  // Decorative elements between image and obsessive text: [-16, 16] (halfway between -12 and -20)
  const decorativeBoxParallaxX = useTransform(smoothMouseX, [-1, 1], [-16, 16])
  const decorativeBoxParallaxY = useTransform(smoothMouseY, [-1, 1], [-16, 16])
  const decorativeTextParallaxX = useTransform(smoothMouseX, [-1, 1], [-16, 16])
  const decorativeTextParallaxY = useTransform(smoothMouseY, [-1, 1], [-16, 16])
  // Map parallax - subtle movement
  const mapParallaxX = useTransform(smoothMouseX, [-1, 1], [-8, 8])
  const mapParallaxY = useTransform(smoothMouseY, [-1, 1], [-8, 8])
  // New image parallax - similar to placeholder image
  const newImageParallaxX = useTransform(smoothMouseX, [-1, 1], ANIMATION_CONFIG.parallax.image.x)
  const newImageParallaxY = useTransform(smoothMouseY, [-1, 1], ANIMATION_CONFIG.parallax.image.y)
  // Third image parallax - similar to other images
  const thirdImageParallaxX = useTransform(smoothMouseX, [-1, 1], ANIMATION_CONFIG.parallax.image.x)
  const thirdImageParallaxY = useTransform(smoothMouseY, [-1, 1], ANIMATION_CONFIG.parallax.image.y)
  const thirdImageTextParallaxX = useTransform(smoothMouseX, [-1, 1], [-16, 16])
  const thirdImageTextParallaxY = useTransform(smoothMouseY, [-1, 1], [-16, 16])
  // Fourth image parallax - matching AMBITIOUS phase pattern
  const fourthImageBoxParallaxX = useTransform(smoothMouseX, [-1, 1], [-5, 5]) // Box speed (same as AMBITIOUS box)
  const fourthImageBoxParallaxY = useTransform(smoothMouseY, [-1, 1], [-5, 5])
  const fourthImageParallaxX = useTransform(smoothMouseX, [-1, 1], [-12, 12]) // Image speed (same as place2)
  const fourthImageParallaxY = useTransform(smoothMouseY, [-1, 1], [-12, 12])
  const buildersTextParallaxX = useTransform(smoothMouseX, [-1, 1], [-20, 20]) // Text speed (same as AMBITIOUS text)
  const buildersTextParallaxY = useTransform(smoothMouseY, [-1, 1], [-20, 20])
  const fourthDecorativeBoxParallaxX = useTransform(smoothMouseX, [-1, 1], [-16, 16]) // Decorative box speed
  const fourthDecorativeBoxParallaxY = useTransform(smoothMouseY, [-1, 1], [-16, 16])
  const fourthDecorativeTextParallaxX = useTransform(smoothMouseX, [-1, 1], [-16, 16]) // Decorative text speed
  const fourthDecorativeTextParallaxY = useTransform(smoothMouseY, [-1, 1], [-16, 16])

  const [hasSettled, setHasSettled] = useState(!hasEnteredFromTransition)

  useEffect(() => {
    if (hasEnteredFromTransition && !hasSettled) {
      const timer = setTimeout(() => setHasSettled(true), 2500)
      return () => clearTimeout(timer)
    }
  }, [hasEnteredFromTransition, hasSettled])

  const depthOpacityRaw = useTransform(depthTransitionProgress, [0, 0.2, 0.4], [1, 0.5, 0])
  const depthOpacity = useSpring(depthOpacityRaw, { stiffness: 150, damping: 25 })
  const finalDepthOpacity = hasSettled ? 1 : depthOpacity

  const openingSectionOpacity = useTransform(depthTransitionProgress, [0, 0.4, 0.6], [1, 0.3, 0])
  const cardsInteractive = scrollProgress > ANIMATION_CONFIG.timing.cardsFadeIn.threshold

  // Background color for depth transition (header to quotes section) - DO NOT TOUCH
  const backgroundColor = useTransform(depthTransitionProgress, (progress) => {
    // Interpolate from #9E1B1E (158, 27, 30) to #590D0F (89, 13, 15)
    const r = Math.round(158 - (158 - 89) * progress)
    const g = Math.round(27 - (27 - 13) * progress)
    const b = Math.round(30 - (30 - 15) * progress)
    return `rgb(${r}, ${g}, ${b})`
  })

  // Separate background color state for Phase 5 transition
  const [phase5BackgroundColor, setPhase5BackgroundColor] = useState('')

  const [scrollWidth, setScrollWidth] = useState('100%')
  const [scrollHeight, setScrollHeight] = useState('100vh')
  const [imageWidth, setImageWidth] = useState('94.6%')
  const [imageHeight, setImageHeight] = useState('86vh')
  const [boxScrollProgress, setBoxScrollProgress] = useState(0)
  const [boxOpacity, setBoxOpacity] = useState(1)
  const [obsessiveY, setObsessiveY] = useState(100)
  const [obsessiveOpacity, setObsessiveOpacity] = useState(0)
  const [imageOpacity, setImageOpacity] = useState(0)
  const [showDecorations, setShowDecorations] = useState(false)
  
  // New state for second scroll phase
  const [elementsOpacity, setElementsOpacity] = useState(1)
  const [boxPositionX, setBoxPositionX] = useState(0)
  const [boxPositionY, setBoxPositionY] = useState(0)
  const [boxRotation, setBoxRotation] = useState(0)
  const [mapOpacity, setMapOpacity] = useState(0)
  const [textRotation, setTextRotation] = useState(0)
  const [textContent, setTextContent] = useState('OBSESSIVE')
  const [textPositionX, setTextPositionX] = useState(0)
  const [textPositionY, setTextPositionY] = useState(0)
  const [newImageOpacity, setNewImageOpacity] = useState(0)
  const [newImagePositionX, setNewImagePositionX] = useState(0)
  const [newImagePositionY, setNewImagePositionY] = useState(0)
  const [newImageScale, setNewImageScale] = useState(0.7)
  const [decorativeOpacity, setDecorativeOpacity] = useState(0)
  const [mapRotation, setMapRotation] = useState(0)
  const [mapPositionX, setMapPositionX] = useState(0)
  const [mapScale, setMapScale] = useState(1.95)
  const [thirdImageOpacity, setThirdImageOpacity] = useState(0)
  
  // Phase 4 state
  const [fourthImageOpacity, setFourthImageOpacity] = useState(0)

  // Phase 5 state
  const [ctaTextOpacity, setCtaTextOpacity] = useState(0)
  const [horsesOpacity, setHorsesOpacity] = useState(0)
  const [phase4Opacity, setPhase4Opacity] = useState(1)
  const [footerOpacity, setFooterOpacity] = useState(0)
  const [bgColorProgress, setBgColorProgress] = useState(0)
  const [borderHeight, setBorderHeight] = useState(0) // Border animation: 0 → 100vh → 30vh

  useEffect(() => {
    let rafId: number | null = null
    let lastScrollY = -1

    const handleScroll = () => {
      if (rafId !== null) return

      rafId = requestAnimationFrame(() => {
        const scrolled = window.scrollY

        if (Math.abs(scrolled - lastScrollY) > 0.5) {
          lastScrollY = scrolled

          if (zScrollComplete) {
            // Use single viewport height for maxScroll to work with normalized timing values
            const maxScroll = window.innerHeight
            const progress = Math.min(scrolled / maxScroll, 1)
            setBoxScrollProgress(progress)

            // =====================================================================
            // NARRATIVE SCROLL STRUCTURE - Three Act Story
            // =====================================================================
            // Total duration: phase1 (1.5) + phase2 (2.0) + pause (0.2) + phase3 (2.0) = 5.7vh
            // Phase calculations use maxScroll * duration to spread animations across viewport heights
            // =====================================================================
            // All phases use consistent easing (EASING.standard/out/inOut) for
            // a smooth, professional feel that builds narrative momentum
            // =====================================================================

            const { start, end } = ANIMATION_CONFIG.timing.textImageFadeIn
            const linearProgress = Math.max(0, Math.min(1, (progress - start) / (end - start)))
            
            // ========== PHASE 1: OBSESSIVE (Box-in-Box Reveal) ==========
            // Reveal placeholder image & OBSESSIVE text with dramatic entrance
            const easedProgress = EASING.standard(linearProgress)

            setObsessiveY((1 - easedProgress) * 100)
            setObsessiveOpacity(easedProgress >= 0.95 ? 1.0 : easedProgress)
            setImageOpacity(easedProgress >= 0.95 ? 1.0 : easedProgress)

            // Trigger decorations when both reach full opacity
            if (easedProgress >= 0.95 && !showDecorations) {
              setShowDecorations(true)
            }

            const boxSizeReduction = ANIMATION_CONFIG.box.startSize - ANIMATION_CONFIG.box.endSize
            const boxSize = ANIMATION_CONFIG.box.startSize - (easedProgress * boxSizeReduction)

            setScrollWidth(`${boxSize}%`)
            setScrollHeight(`${boxSize}vh`)
            setImageWidth(`${boxSize * 1.1 * 0.86 * ANIMATION_CONFIG.imageScale}%`)
            setImageHeight(`${boxSize * 0.86 * ANIMATION_CONFIG.imageScale}vh`)
            setBoxOpacity(1)
            
            // ========== PHASE 2: AMBITIOUS TRANSFORMATION ==========
            // Transform box to rectangle + translate + reveal place2 image
            const phase2Start = maxScroll * ANIMATION_CONFIG.scrollPhases.phase1Duration
            if (scrolled > phase2Start) {
              const phase2Scroll = scrolled - phase2Start
              const phase2Max = maxScroll * ANIMATION_CONFIG.scrollPhases.phase2Duration
              const totalProgress = Math.min(phase2Scroll / phase2Max, 1)
              
              // Split into two sequential sub-phases with smooth transitions
              // Sub-phase 2a (0-0.5): Transform the box (fade out elements, reshape)
              // Sub-phase 2b (0.5-1): Translate to position + reveal place2
              const transformProgress = EASING.standard(Math.min(totalProgress * 2, 1))
              const translateProgress = EASING.standard(Math.max(0, (totalProgress - 0.5) * 2))
              
              // Sub-phase 2a: Fade out image, boxes, and decorative text smoothly
              setElementsOpacity(1 - transformProgress)
              
              // Sub-phase 2a: Reshape box into tall rectangle
              // Width: 75% -> 30% (bring in the sides dramatically)
              // Height: 75vh -> 50vh (moderate reduction to maintain presence)
              const targetWidth = 75 - (transformProgress * 45)
              const targetHeight = 75 - (transformProgress * 25)
              setScrollWidth(`${targetWidth}%`)
              setScrollHeight(`${targetHeight}vh`)
              
              // Update image size proportionally
              setImageWidth(`${targetWidth * 1.1 * 0.86 * ANIMATION_CONFIG.imageScale}%`)
              setImageHeight(`${targetHeight * 0.86 * ANIMATION_CONFIG.imageScale}vh`)
              
              // Sub-phase 2b: Translate box to final position (smooth, deliberate movement)
              // X: 91% to the right from center (dramatic rightward shift)
              // Y: 31% down from center (subtle descent for balance)
              setBoxPositionX(translateProgress * 91)
              setBoxPositionY(translateProgress * 31)
              
              // Sub-phase 2b: Move place2 image to reveal position (synchronized with box)
              // From center (50%, 50%) to (73%, 49%) - left of center, creating balance
              setNewImagePositionX(translateProgress * 18) // 18% right (was 23%, moved left by 5%)
              setNewImagePositionY(translateProgress * 0) // At center (was 4%, moved up by 4% more)
              
              // Scale image from 70% to 120% (0.7 to 1.2) during translation
              const scaleStart = 0.7 * 1.15 * 0.95 // Start at 76.5% (increased by 15%, then reduced by 5%)
              const scaleEnd = 1.2 * 1.15 * 0.95 // End at 131% (increased by 15%, then reduced by 5%)
              setNewImageScale(scaleStart + (translateProgress * (scaleEnd - scaleStart)))
              
              // No rotation during this phase
              setBoxRotation(0)
              
              // Sub-phase 2b: Text transformation OBSESSIVE → AMBITIOUS (synchronized with rotation)
              // Rotate from horizontal to vertical while changing text
              setTextRotation(translateProgress * -90) // Rotate -90° (counterclockwise to vertical)
              setTextPositionX(translateProgress * 39) // Move 39% rightward (balanced positioning)
              setTextPositionY(translateProgress * 2) // Move 2% down (subtle vertical adjustment)
              
              // Letter-by-letter transformation during rotation (building narrative tension)
              const fromText = 'OBSESSIVE'
              const toText = 'AMBITIOUS'
              const maxLength = Math.max(fromText.length, toText.length)
              
              // Apply easing to text transformation for smooth, deliberate reveal
              const easedLetterProgress = EASING.out(translateProgress)
              const letterIndex = Math.floor(easedLetterProgress * maxLength)
              
              // Build the text progressively (each letter transition feels intentional)
              let displayText = ''
              for (let i = 0; i < maxLength; i++) {
                if (i < letterIndex) {
                  // Reveal new letter (AMBITIOUS character)
                  displayText += toText[i] || ''
                } else {
                  // Show remaining old letter (OBSESSIVE character)
                  displayText += fromText[i] || ''
                }
              }
              
              setTextContent(displayText)
              
              // Fade in map on the left (during translation phase)
              setMapOpacity(translateProgress)
              
              // Fade in new image during translation with smooth easing
              // Start fading in from the beginning of translation for smooth appearance
              const easedOpacity = EASING.standard(translateProgress)
              setNewImageOpacity(easedOpacity)
              
              // Fade in decorative elements (rectangle and text) after place2 is halfway through
              const decorativeT = Math.max(0, (translateProgress - 0.5) / 0.5) // Start at 50%, end at 100%
              setDecorativeOpacity(EASING.out(decorativeT))
              
              // ========== PHASE 3: NEXT-GEN TRANSFORMATION ==========
              // Rotate map + transform text to NEXT-GEN + reveal place3
              const phase3Start = phase2Start + phase2Max + (maxScroll * ANIMATION_CONFIG.scrollPhases.pauseDuration)
              
              if (scrolled > phase3Start) {
                const phase3Scroll = scrolled - phase3Start
                const phase3Max = maxScroll * ANIMATION_CONFIG.scrollPhases.phase3Duration
                const linearThirdProgress = Math.min(phase3Scroll / phase3Max, 1)
                const thirdProgress = EASING.inOut(linearThirdProgress)
                
                // Split into two balanced sub-phases:
                // Sub-phase 3a (0-0.5): Rotate & zoom map in place, fade out place2 elements
                // Sub-phase 3b (0.5-1): Move map right, transform text AMBITIOUS->NEXT-GEN, reveal place3
                const rotateZoomProgress = EASING.out(Math.min(thirdProgress * 2, 1))
                const moveProgress = EASING.out(Math.max(0, (thirdProgress - 0.5) * 2))
                
                // Sub-phase 3a: Fade out place2 scene smoothly (making room for next act)
                const fadeOutProgress = EASING.inOut(thirdProgress)
                setNewImageOpacity(easedOpacity * (1 - fadeOutProgress))
                setBoxOpacity(1 - fadeOutProgress)
                setDecorativeOpacity(EASING.out(decorativeT) * (1 - fadeOutProgress))
                
                // Sub-phase 3a: Rotate and zoom map (dramatic reveal of detail)
                setMapRotation(rotateZoomProgress * 126.82) // 126.82° rotation
                setMapScale(1.95 + (rotateZoomProgress * 0.5)) // Zoom from 1.95 to 2.45
                
                // Sub-phase 3b: Move map to right side (creating space for place3)
                setMapPositionX(moveProgress * 50) // Move 50% rightward
                
                // Sub-phase 3b: Transform AMBITIOUS text (shift left & up during transformation)
                setTextPositionX(39 - (moveProgress * 5)) // From 39% to 34% (5% left shift)
                setTextPositionY(-moveProgress * 3) // Move 3% higher (elevating the message)
                
                // Sub-phase 3b: Reveal third image (place3) as text transforms
                setThirdImageOpacity(moveProgress)
                
                // Sub-phase 3b: Text transformation AMBITIOUS → NEXT-GEN
                // Smooth letter-by-letter reveal synchronized with map movement
                const toText = 'NEXT-GEN'
                
                if (moveProgress < 0.5) {
                  // First half of movement: AMBITIOUS remains (building anticipation)
                  setTextContent('AMBITIOUS')
                } else if (moveProgress < 1) {
                  // Second half: Progressive transformation to NEXT-GEN (climactic reveal)
                  const transitionProgress = (moveProgress - 0.5) * 2 // 0 to 1 in second half
                  const targetLength = Math.ceil(transitionProgress * toText.length)
                  const displayText = toText.substring(0, Math.max(1, targetLength))
                  setTextContent(displayText)
                } else {
                  // Fully transitioned
                  setTextContent('NEXT-GEN')
                }
                
                // ========== PHASE 4: STICKY BUILDERS + PLACE4 ==========
                // Fade out map & place3, rotate text to horizontal & transform to BUILDERS, stick it high, reveal place4
                const phase4Start = phase3Start + phase3Max

                if (scrolled > phase4Start) {
                  const phase4Scroll = scrolled - phase4Start
                  const phase4Max = maxScroll * ANIMATION_CONFIG.scrollPhases.phase4Duration
                  const linearFourthProgress = Math.min(phase4Scroll / phase4Max, 1)
                  const fourthProgress = EASING.out(linearFourthProgress)

                  // Fade out map and place3 image
                  setMapOpacity(1 - fourthProgress)
                  setThirdImageOpacity(1 - fourthProgress)

                  // Rotate text from -90° (vertical) to 0° (horizontal)
                  setTextRotation(-90 + (fourthProgress * 90))

                  // Move text to high sticky position (40% higher than original)
                  // From current position (34%, -3%) to top-left (3%, -85%)
                  setTextPositionX(34 - (fourthProgress * 31)) // 34% to 3%
                  setTextPositionY(-3 - (fourthProgress * 67)) // -3% to -85% (much higher)

                  // Text transformation NEXT-GEN → BUILDERS during rotation
                  // Complete the transformation earlier (at 70% of phase) so it finishes before positioning
                  const fromText = 'NEXT-GEN'
                  const toText = 'BUILDERS'
                  const maxLength = Math.max(fromText.length, toText.length)

                  // Apply easing to text transformation, complete at 70% of phase progress
                  const textTransformProgress = Math.min(fourthProgress / 0.7, 1)
                  const easedLetterProgress = EASING.out(textTransformProgress)
                  const letterIndex = Math.floor(easedLetterProgress * maxLength)

                  // Build the text progressively
                  let displayText = ''
                  for (let i = 0; i < maxLength; i++) {
                    if (i < letterIndex) {
                      // Reveal new letter (BUILDERS character)
                      displayText += toText[i] || ''
                    } else {
                      // Show remaining old letter (NEXT-GEN character)
                      displayText += fromText[i] || ''
                    }
                  }

                  setTextContent(displayText)

                  // Fade in place4 image below the text
                  setFourthImageOpacity(fourthProgress)

                  // ========== PHASE 5: FINAL CTA ==========
                  // Fade out everything, transition background to dark red, fade in CTA
                  const phase5Start = phase4Start + phase4Max

                  if (scrolled > phase5Start) {
                    const phase5Scroll = scrolled - phase5Start
                    const phase5Max = maxScroll * ANIMATION_CONFIG.scrollPhases.phase5Duration
                    const linearFifthProgress = Math.min(phase5Scroll / phase5Max, 1)
                    const fifthProgress = EASING.out(linearFifthProgress)

                    // Phase 4 fade out: Uses first half like other phases
                    // Consistent with how Phase 4 fades out map/place3
                    const fadeOutProgress = Math.min(fifthProgress * 2, 1) // 0 to 1 over first 50%
                    setPhase4Opacity(1 - EASING.out(fadeOutProgress))

                    // Animate border: Grows throughout most of the phase
                    // Starts at 25%, continuous growth matching other phase reveals
                    const borderProgress = Math.max(0, (fifthProgress - 0.25) / 0.75) // 0 to 1 from 25% onwards
                    setBorderHeight(EASING.inOut(borderProgress) * 75) // 0vh to 75vh

                    // Transition background color from #2B0A05 (43, 10, 5) to #590D0F (89, 13, 15)
                    setBgColorProgress(fifthProgress)
                    const r = Math.round(43 + (89 - 43) * fifthProgress)
                    const g = Math.round(10 + (13 - 10) * fifthProgress)
                    const b = Math.round(5 + (15 - 5) * fifthProgress)
                    setPhase5BackgroundColor(`rgb(${r}, ${g}, ${b})`)

                    // Fade in CTA text: Starts right as border begins (at 25%)
                    // Scrolls in alongside the border animation
                    const ctaProgress = Math.max(0, (fifthProgress - 0.25) / 0.55) // 0 to 1 from 25% to 80%
                    setCtaTextOpacity(EASING.out(ctaProgress))

                    // Fade in horses image: Starts shortly after text (at 35%)
                    // Completes as border finishes
                    const horsesProgress = Math.max(0, (fifthProgress - 0.35) / 0.50) // 0 to 1 from 35% to 85%
                    setHorsesOpacity(EASING.out(horsesProgress))

                    // Fade in footer: Starts right after border completes
                    // Border animation ends at fifthProgress = 1.0 (when borderProgress = 1)
                    // Start footer fade immediately after (map 1.0+ to 0-1)
                    // Since we're in a 2.0x duration phase, map from 100% onwards
                    const footerProgress = borderProgress // Use border progress directly - fades as border grows
                    setFooterOpacity(EASING.out(footerProgress))
                  } else {
                    // Reset phase 5 if not reached
                    setPhase4Opacity(1)
                    setBgColorProgress(0)
                    setPhase5BackgroundColor('')
                    setBorderHeight(0)
                    setCtaTextOpacity(0)
                    setHorsesOpacity(0)
                    setFooterOpacity(0)
                  }
                } else {
                  // Reset phase 4 if not reached
                  setFourthImageOpacity(0)
                  setPhase4Opacity(1)
                  setBgColorProgress(0)
                  setPhase5BackgroundColor('')
                  setBorderHeight(0)
                  setCtaTextOpacity(0)
                  setHorsesOpacity(0)
                }
              } else {
                // Reset third phase if not reached
                setMapRotation(0)
                setMapPositionX(0)
                setMapScale(1.95)
                setFourthImageOpacity(0)
              }
            } else {
              setElementsOpacity(1)
              setBoxPositionX(0)
              setBoxPositionY(0)
              setBoxRotation(0)
              setMapOpacity(0)
              setTextRotation(0)
              setTextContent('OBSESSIVE')
              setTextPositionX(0)
              setTextPositionY(0)
              setNewImageOpacity(0)
              setNewImagePositionX(0)
              setNewImagePositionY(0)
              setNewImageScale(0.7)
              setDecorativeOpacity(0)
              setMapRotation(0)
              setMapPositionX(0)
              setMapScale(1.95)
            }
          } else {
            setBoxScrollProgress(0)
            setScrollWidth('100%')
            setImageWidth('94.6%')
            setScrollHeight('100vh')
            setImageHeight('86vh')
            setBoxOpacity(1)
            setObsessiveY(100)
            setObsessiveOpacity(0)
            setImageOpacity(0)
            setShowDecorations(false)
            setElementsOpacity(1)
            setBoxPositionX(0)
            setBoxPositionY(0)
            setBoxRotation(0)
            setMapOpacity(0)
            setTextRotation(0)
            setTextContent('OBSESSIVE')
            setTextPositionX(0)
            setTextPositionY(0)
            setNewImageOpacity(0)
            setNewImagePositionX(0)
            setNewImagePositionY(0)
            setNewImageScale(0.7)
            setDecorativeOpacity(0)
            setMapRotation(0)
            setMapPositionX(0)
            setMapScale(1.95)
            setFourthImageOpacity(0)
          }
        }

        rafId = null
      })
    }

    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [zScrollComplete, showDecorations])


  return (
    <motion.div
      ref={containerRef}
      className="learn-more-container"
      style={{ backgroundColor: phase5BackgroundColor || backgroundColor }}
      initial={{ opacity: 1, backgroundColor: '#9E1B1E' }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      transition={{ duration: 0 }}
      layout={false}
    >
      <LearnMoreHeader />

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

      <motion.section
        className="quote-cards-section"
        style={{
          pointerEvents: cardsInteractive && !zScrollComplete ? 'auto' : 'none',
          zIndex: scrollProgress > 0.6 ? 10 : 1,
        }}
      >
        <div className="quote-cards-grid">
          {quoteCardsData.map((card, index) => {
            const { quoteCards, timing } = ANIMATION_CONFIG
            const yOffset = card.animateY

            // Fade in with smooth easing
            const fadeInProgress = Math.max(0, Math.min(1, (scrollProgress - timing.cardsFadeIn.threshold) / (1 - timing.cardsFadeIn.threshold)))
            const staggerDelay = index * quoteCards.staggerIn
            const rawFadeInProgress = Math.max(0, Math.min(1, (fadeInProgress - staggerDelay) * quoteCards.fadeInSpeed))
            const easedFadeIn = EASING.out(rawFadeInProgress)
            const fadeInOpacity = easedFadeIn
            const fadeInY = yOffset * (1 - easedFadeIn)

            // Fade out with smooth easing
            const reverseIndex = quoteCardsData.length - 1 - index
            const reverseStaggerDelay = reverseIndex * quoteCards.staggerOut
            const fadeOutProgress = zScrollComplete
              ? Math.max(0, Math.min(1, (boxScrollProgress - timing.cardsFadeOut.start) / (timing.cardsFadeOut.end - timing.cardsFadeOut.start)))
              : 0
            const rawFadeOutProgress = Math.max(0, Math.min(1, (fadeOutProgress - reverseStaggerDelay) * quoteCards.fadeOutSpeed))
            const easedFadeOut = EASING.out(rawFadeOutProgress)
            const fadeOutOpacity = 1 - easedFadeOut
            const fadeOutY = -yOffset * easedFadeOut

            const finalOpacity = zScrollComplete ? fadeInOpacity * fadeOutOpacity : fadeInOpacity
            const finalY = zScrollComplete ? fadeInY + fadeOutY : fadeInY

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

      <BoxInBoxSection
        zScrollComplete={zScrollComplete}
        scrollContainerRef={scrollContainerRef}
        scrollWidth={scrollWidth}
        scrollHeight={scrollHeight}
        boxParallaxX={boxParallaxX}
        boxParallaxY={boxParallaxY}
        boxOpacity={boxOpacity}
        imageOpacity={imageOpacity}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        placeholderParallaxX={placeholderParallaxX}
        placeholderParallaxY={placeholderParallaxY}
        decorativeBoxParallaxX={decorativeBoxParallaxX}
        decorativeBoxParallaxY={decorativeBoxParallaxY}
        decorativeTextParallaxX={decorativeTextParallaxX}
        decorativeTextParallaxY={decorativeTextParallaxY}
        showDecorations={showDecorations}
        obsessiveParallaxX={obsessiveParallaxX}
        obsessiveParallaxY={obsessiveParallaxY}
        obsessiveY={obsessiveY}
        obsessiveOpacity={obsessiveOpacity}
        imageTop={ANIMATION_CONFIG.positioning.imageTop}
        obsessiveBottom={ANIMATION_CONFIG.positioning.obsessiveBottom}
        obsessiveLeft={ANIMATION_CONFIG.positioning.obsessiveLeft}
        elementsOpacity={elementsOpacity}
        boxPositionX={boxPositionX}
        boxPositionY={boxPositionY}
        boxRotation={boxRotation}
        mapOpacity={mapOpacity}
        mapParallaxX={mapParallaxX}
        mapParallaxY={mapParallaxY}
        textRotation={textRotation}
        textContent={textContent}
        textPositionX={textPositionX}
        textPositionY={textPositionY}
        newImageOpacity={newImageOpacity}
        newImageParallaxX={newImageParallaxX}
        newImageParallaxY={newImageParallaxY}
        newImagePositionX={newImagePositionX}
        newImagePositionY={newImagePositionY}
        newImageScale={newImageScale}
        decorativeOpacity={decorativeOpacity}
        mapRotation={mapRotation}
        mapPositionX={mapPositionX}
        mapScale={mapScale}
        thirdImageOpacity={thirdImageOpacity}
        thirdImageParallaxX={thirdImageParallaxX}
        thirdImageParallaxY={thirdImageParallaxY}
        thirdImageTextParallaxX={thirdImageTextParallaxX}
        thirdImageTextParallaxY={thirdImageTextParallaxY}
        fourthImageOpacity={fourthImageOpacity}
        fourthImageParallaxX={fourthImageParallaxX}
        fourthImageParallaxY={fourthImageParallaxY}
        fourthImageBoxParallaxX={fourthImageBoxParallaxX}
        fourthImageBoxParallaxY={fourthImageBoxParallaxY}
        buildersTextParallaxX={buildersTextParallaxX}
        buildersTextParallaxY={buildersTextParallaxY}
        fourthDecorativeBoxParallaxX={fourthDecorativeBoxParallaxX}
        fourthDecorativeBoxParallaxY={fourthDecorativeBoxParallaxY}
        fourthDecorativeTextParallaxX={fourthDecorativeTextParallaxX}
        fourthDecorativeTextParallaxY={fourthDecorativeTextParallaxY}
        phase4Opacity={phase4Opacity}
      />

      {/* Animated Border from Top - Phase 5 transition */}
      {zScrollComplete && borderHeight > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: `${borderHeight}vh`,
            background: '#590D0F',
            zIndex: 19,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Phase 5: Final CTA Section */}
      {zScrollComplete && (
        <motion.section
          style={{
            position: 'relative',
            width: '100%',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: '7vh', // Moved down by 2vh (was 5vh)
            paddingBottom: '0',
            zIndex: 20,
            pointerEvents: 'auto',
          }}
        >
          {/* CTA Text */}
          <motion.div
            style={{
              opacity: ctaTextOpacity,
              width: '95%',
              maxWidth: '1572px',
              textAlign: 'justify',
            }}
          >
            <h2
              style={{
                fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
                fontSize: 'clamp(1.7rem, 4.25vw, 3.4rem)', // Reduced height by 15%
                fontWeight: 600,
                color: '#FFF8F2',
                textTransform: 'uppercase',
                lineHeight: 1.2,
                letterSpacing: '0.02em',
                margin: 0,
                textAlign: 'justify',
                textAlignLast: 'justify',
              }}
            >
              Only a handful move fast enough to be here, and they build alongside the people who will define what comes next.
            </h2>
          </motion.div>

          {/* Horses Image */}
          <motion.img
            src="/images/horses.webp"
            alt="Horses"
            style={{
              opacity: horsesOpacity,
              marginTop: '6vh', // Moved down by 2vh (was 4vh)
              width: '100%',
              maxWidth: '1572px',
              height: 'auto',
              objectFit: 'contain',
              transform: 'scaleY(0.85)', // Reduce height by 15%
            }}
          />

          {/* Footer */}
          <motion.div
            style={{
              opacity: footerOpacity,
              width: '100vw',
              marginTop: '6vh',
              maxHeight: '25vh',
              position: 'relative',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <Footer />
          </motion.div>
        </motion.section>
      )}
    </motion.div>
  )
}
