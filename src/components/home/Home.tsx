import { useEffect, useRef, useState } from 'react'
import { motion, useTransform, useSpring } from 'framer-motion'
import Lenis from 'lenis'
import { HomeHeader, OpeningSection } from './sections/header'
import { QuotesSection } from './sections/quotes'
import { ScrollPhasesContainer } from './sections/scroll-phases'
import { CTASection } from './sections/cta'
import Footer from '../Footer'
import { ANIMATION_CONFIG, EASING } from './config/animationConfig'
import { useMouseParallax } from './hooks/useMouseParallax'
import { useVirtualScroll } from './hooks/useVirtualScroll'
import { useBoxScrollPhases } from './hooks/useBoxScrollPhases'
import './Home.css'

export const Home = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const lenisRef = useRef<Lenis | null>(null)

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
    return () => lenis.destroy()
  }, [])

  // Track settled state for depth transition
  const [hasSettled, setHasSettled] = useState(!hasEnteredFromTransition)

  useEffect(() => {
    if (hasEnteredFromTransition && !hasSettled) {
      const timer = setTimeout(() => setHasSettled(true), 2500)
      return () => clearTimeout(timer)
    }
  }, [hasEnteredFromTransition, hasSettled])

  // Use mouse parallax hook
  const parallaxValues = useMouseParallax()

  // Use virtual scroll hook
  const virtualScrollValues = useVirtualScroll({ hasEnteredFromTransition, hasSettled })

  // Depth Z transforms for opening section with integer rounding for browser compatibility
  const textDepthZ = useTransform(
    virtualScrollValues.depthTransitionProgress,
    (v) => Math.round(v * 1500 / 0.4)
  )
  const imageDepthZ = useTransform(
    virtualScrollValues.depthTransitionProgress,
    (v) => Math.round(v * 2500 / 0.4)
  )
  const squareDepthZ = useTransform(
    virtualScrollValues.depthTransitionProgress,
    (v) => Math.round(v * 3500 / 0.4)
  )

  // Use box scroll phases hook
  const scrollPhases = useBoxScrollPhases(virtualScrollValues.zScrollComplete, ANIMATION_CONFIG)

  return (
    <motion.div
      ref={containerRef}
      className="learn-more-container"
      style={{ backgroundColor: scrollPhases.phase5BackgroundColor || virtualScrollValues.backgroundColor }}
      initial={{ opacity: 1, backgroundColor: '#9E1B1E' }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      transition={{ duration: 0 }}
      layout={false}
    >
      <HomeHeader />

      <OpeningSection
        showBackground={showBackground}
        hasEnteredFromTransition={hasEnteredFromTransition}
        openingSectionOpacity={virtualScrollValues.openingSectionOpacity}
        textParallaxX={parallaxValues.textParallaxX}
        textParallaxY={parallaxValues.textParallaxY}
        textDepthZ={textDepthZ}
        finalDepthOpacity={virtualScrollValues.finalDepthOpacity}
        smoothMouseX={parallaxValues.smoothMouseX}
        smoothMouseY={parallaxValues.smoothMouseY}
        imageDepthZ={imageDepthZ}
        squareDepthZ={squareDepthZ}
        depthTransitionProgress={virtualScrollValues.depthTransitionProgress}
        ANIMATION_CONFIG={ANIMATION_CONFIG}
        EASING={EASING}
      />

      <QuotesSection
        scrollProgress={virtualScrollValues.scrollProgress}
        zScrollComplete={virtualScrollValues.zScrollComplete}
        boxScrollProgress={scrollPhases.boxScrollProgress}
        cardsInteractive={virtualScrollValues.cardsInteractive}
        ANIMATION_CONFIG={ANIMATION_CONFIG}
        EASING={EASING}
      />

      <ScrollPhasesContainer
        zScrollComplete={virtualScrollValues.zScrollComplete}
        scrollContainerRef={scrollContainerRef}
        scrollWidth={scrollPhases.scrollWidth}
        scrollHeight={scrollPhases.scrollHeight}
        boxParallaxX={parallaxValues.boxParallaxX}
        boxParallaxY={parallaxValues.boxParallaxY}
        boxOpacity={scrollPhases.boxOpacity}
        boxPositionX={scrollPhases.boxPositionX}
        boxPositionY={scrollPhases.boxPositionY}
        boxRotation={scrollPhases.boxRotation}
        imageOpacity={scrollPhases.imageOpacity}
        imageWidth={scrollPhases.imageWidth}
        imageHeight={scrollPhases.imageHeight}
        imageTop={ANIMATION_CONFIG.positioning.imageTop}
        placeholderParallaxX={parallaxValues.placeholderParallaxX}
        placeholderParallaxY={parallaxValues.placeholderParallaxY}
        showDecorations={scrollPhases.showDecorations}
        elementsOpacity={scrollPhases.elementsOpacity}
        decorativeBoxParallaxX={parallaxValues.decorativeBoxParallaxX}
        decorativeBoxParallaxY={parallaxValues.decorativeBoxParallaxY}
        decorativeTextParallaxX={parallaxValues.decorativeTextParallaxX}
        decorativeTextParallaxY={parallaxValues.decorativeTextParallaxY}
        obsessiveParallaxX={parallaxValues.obsessiveParallaxX}
        obsessiveParallaxY={parallaxValues.obsessiveParallaxY}
        obsessiveY={scrollPhases.obsessiveY}
        obsessiveOpacity={scrollPhases.obsessiveOpacity}
        obsessiveBottom={ANIMATION_CONFIG.positioning.obsessiveBottom}
        obsessiveLeft={ANIMATION_CONFIG.positioning.obsessiveLeft}
        textContent={scrollPhases.textContent}
        textPositionX={scrollPhases.textPositionX}
        textPositionY={scrollPhases.textPositionY}
        textRotation={scrollPhases.textRotation}
        mapOpacity={scrollPhases.mapOpacity}
        mapRotation={scrollPhases.mapRotation}
        mapPositionX={scrollPhases.mapPositionX}
        mapScale={scrollPhases.mapScale}
        mapParallaxX={parallaxValues.mapParallaxX}
        mapParallaxY={parallaxValues.mapParallaxY}
        newImageOpacity={scrollPhases.newImageOpacity}
        newImageScale={scrollPhases.newImageScale}
        newImagePositionX={scrollPhases.newImagePositionX}
        newImagePositionY={scrollPhases.newImagePositionY}
        newImageParallaxX={parallaxValues.newImageParallaxX}
        newImageParallaxY={parallaxValues.newImageParallaxY}
        decorativeOpacity={scrollPhases.decorativeOpacity}
        thirdImageOpacity={scrollPhases.thirdImageOpacity}
        thirdImageParallaxX={parallaxValues.thirdImageParallaxX}
        thirdImageParallaxY={parallaxValues.thirdImageParallaxY}
        thirdImageTextParallaxX={parallaxValues.thirdImageTextParallaxX}
        thirdImageTextParallaxY={parallaxValues.thirdImageTextParallaxY}
        fourthImageOpacity={scrollPhases.fourthImageOpacity}
        fourthImageParallaxX={parallaxValues.fourthImageParallaxX}
        fourthImageParallaxY={parallaxValues.fourthImageParallaxY}
        fourthImageBoxParallaxX={parallaxValues.fourthImageBoxParallaxX}
        fourthImageBoxParallaxY={parallaxValues.fourthImageBoxParallaxY}
        buildersTextParallaxX={parallaxValues.buildersTextParallaxX}
        buildersTextParallaxY={parallaxValues.buildersTextParallaxY}
        fourthDecorativeBoxParallaxX={parallaxValues.fourthDecorativeBoxParallaxX}
        fourthDecorativeBoxParallaxY={parallaxValues.fourthDecorativeBoxParallaxY}
        fourthDecorativeTextParallaxX={parallaxValues.fourthDecorativeTextParallaxX}
        fourthDecorativeTextParallaxY={parallaxValues.fourthDecorativeTextParallaxY}
        phase4Opacity={scrollPhases.phase4Opacity}
      />

      {/* Animated Border from Top - Phase 5 transition */}
      {virtualScrollValues.zScrollComplete && scrollPhases.borderHeight > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: `${scrollPhases.borderHeight}vh`,
            background: '#590D0F',
            zIndex: 19,
            pointerEvents: 'none',
          }}
        />
      )}

      <CTASection
        zScrollComplete={virtualScrollValues.zScrollComplete}
        ctaTextOpacity={scrollPhases.ctaTextOpacity}
        horsesOpacity={scrollPhases.horsesOpacity}
        ctaTextY={scrollPhases.ctaTextY}
        horsesY={scrollPhases.horsesY}
        ctaTextParallaxX={parallaxValues.ctaTextParallaxX}
        ctaTextParallaxY={parallaxValues.ctaTextParallaxY}
        horsesImageParallaxX={parallaxValues.horsesImageParallaxX}
        horsesImageParallaxY={parallaxValues.horsesImageParallaxY}
      />

      {/* Footer - Fixed position, independent of CTA scroll */}
      {virtualScrollValues.zScrollComplete && scrollPhases.footerOpacity > 0 && (
        <motion.div
          className="home-footer-wrapper"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100vw',
            opacity: scrollPhases.footerOpacity,
            zIndex: 25,
            pointerEvents: scrollPhases.footerOpacity > 0 ? 'auto' : 'none',
          }}
        >
          <Footer />
        </motion.div>
      )}
    </motion.div>
  )
}
