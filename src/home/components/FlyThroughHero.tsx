'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, MotionValue, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ParallaxMotion from '../../effects/ParallaxMotion.tsx';
import '../styles/FlyThroughHero.css';
import '../styles/FlyThroughHeroMobile.css';
import { QuoteCard } from '../sections/quotes/QuoteCard.tsx';
import { Button } from '../../components/ui';
import { NavBar } from '../../components/layout';
import GridDistortion from '../../effects/GridDistortion.tsx';
import { homeContent } from '../home-content';

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  // Background color
  bgColor: '#9E1B1E',
  blockColor: '#590D0F',
  
  // Scroll distance (multiplier of viewport height)
  scrollDistance: 3,
  
  // Text content - now pulled from homeContent
  heroText: [
    homeContent.hero.line1,
    homeContent.hero.line2,
    homeContent.hero.line3,
    homeContent.hero.line4,
  ],
};

// Element positions: x/y are percentages from center, z affects speed (0=fast, 1=slow)
// Additional layer: smaller, more transparent decorative blocks
const FAINT_BLOCKS = [
  { id: 'faint-block-1', type: 'block', x: -15, y: -28, z: 0.05, w: 24, h: 24, speedX: 6, speedY: 4 },
  { id: 'faint-block-2', type: 'block', x: 18, y: -18, z: 0.05, w: 18, h: 18, speedX: 7, speedY: 3 },
  { id: 'faint-block-3', type: 'block', x: -30, y: 10, z: 0.05, w: 16, h: 16, speedX: 5, speedY: 5 },
  { id: 'faint-block-4', type: 'block', x: 30, y: 12, z: 0.05, w: 20, h: 20, speedX: 8, speedY: 2 },
  { id: 'faint-block-5', type: 'block', x: 0, y: 32, z: 0.05, w: 22, h: 22, speedX: 4, speedY: 6 },
  { id: 'faint-block-6', type: 'block', x: -38, y: 28, z: 0.05, w: 14, h: 14, speedX: 3, speedY: 7 },
  { id: 'faint-block-7', type: 'block', x: 38, y: -28, z: 0.05, w: 12, h: 12, speedX: 9, speedY: 2 },
] as const;

// Images and main decorative blocks
const ELEMENTS = [
  // Images - all square (1:1 aspect ratio), with optional parallax variance
  { id: 'img-1', type: 'image', src: '/assets/images/events/LoadInImage-min.webp', x: -38, y: 8, z: 0.3, w: 220, h: 220, speedX: 40, speedY: 10 },
  { id: 'img-2', type: 'image', src: '/assets/images/membership/join-process.webp', x: -18, y: -30, z: 0.5, w: 180, h: 180, speedX: 10, speedY: 30 },
  { id: 'img-3', type: 'image', src: '/assets/images/events/FH_people1.webp', x: 18, y: -34, z: 0.4, w: 210, h: 210 },
  { id: 'img-4', type: 'image', src: '/assets/images/events/Wave x Maki Photo.webp', x: 35, y: 15, z: 0.6, w: 280, h: 280, speedX: 30, speedY: 5 },
  { id: 'img-5', type: 'image', src: '/assets/images/events/Wave x Maki Photo (2).webp', x: 3, y: 30, z: 0.35, w: 220, h: 220 },
  { id: 'img-6', type: 'image', src: '/assets/images/events/FH_zechen.webp', x: -22, y: 40, z: 0.55, w: 200, h: 200, speedX: 15, speedY: 15 },

  // Decorative blocks - all square, with parallax speed variance
  { id: 'block-1', type: 'block', x: -19, y: -40, z: 0.1, w: 80, h: 80, speedX: 12, speedY: 8 },
  { id: 'block-2', type: 'block', x: -40, y: -12, z: 0.1, w: 60, h: 60, speedX: 8, speedY: 12 },
  { id: 'block-3', type: 'block', x: 10, y: -21, z: 0.1, w: 80, h: 80, speedX: 10, speedY: 10 },
  { id: 'block-4', type: 'block', x: -6, y: 43, z: 0.1, w: 70, h: 70, speedX: 7, speedY: 13 },
  { id: 'block-5', type: 'block', x: 42, y: 30, z: 0.1, w: 150, h: 150, speedX: 15, speedY: 6 },
  { id: 'block-6', type: 'block', x: -42, y: 35, z: 0.1, w: 30, h: 30, speedX: 5, speedY: 15 },
] as const;

// =============================================================================
// FLOATING ELEMENT COMPONENT
// =============================================================================

interface FloatingElementProps {
  id: string;
  type: 'image' | 'block';
  src?: string;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  scrollYProgress: MotionValue<number>;
  speedX?: number;
  speedY?: number;
  positionSpread?: number;
}

function FloatingElement({ type, src, x, y, z, w, h, scrollYProgress, faint = false, speedX, speedY, positionSpread = 1, id }: FloatingElementProps & { faint?: boolean }) {
  // Speed: lower z = closer = faster flyby
  const speed = 1 + (1 - z) * 2;

  // Scale up as element "approaches" (default for blocks)
  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    [1, 1 + speed * 2]
  );

  // For images: scale from 1.1 to 1 as you scroll
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.2, 1]);

  // Exaggerated drift outward toward edges (tunnel effect)
  // Make faint (smaller) boxes move slower
  let driftMultiplierX = 60;
  let driftMultiplierY = 40;
  if (faint) {
    driftMultiplierX = 10;
    driftMultiplierY = 6;
  } else if (type === 'block') {
    driftMultiplierX = 18;
    driftMultiplierY = 16;
  }
  const xDrift = useTransform(
    scrollYProgress,
    [0, 1],
    [0, x * driftMultiplierX]
  );

  const yDrift = useTransform(
    scrollYProgress,
    [0, 1],
    [0, y * driftMultiplierY]
  );

  // Fade out as element passes (fade out sooner)
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.36, 0.54, 0.68],
    [1, 1, 0.6, 0]
  );

  // Blur in sync with opacity
  const blur = useTransform(
    scrollYProgress,
    [0, 0.36, 0.54, 0.68],
    [0, 0, 4, 10]
  );

  const spread = positionSpread ?? 1;
  
  // Mobile-specific adjustment for img-1
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const adjustedX = (id === 'img-1' && isMobile) ? x - 10 : x;
  
  return (
    <motion.div
      style={{
        position: 'absolute',
        left: `calc(50% + ${adjustedX * spread}%)`,
        top: `calc(50% + ${y * spread}%)`,
        x: xDrift,
        y: yDrift,
        scale,
        opacity: faint ? 0.3 : opacity,
        filter: useTransform(blur, (v) => `blur(${v}px)`),
        zIndex: Math.round(z * 10),
        translateX: '-50%',
        translateY: '-50%',
        willChange: 'transform, opacity, filter',
      }}
    >
      {type === 'image' ? (
        <ParallaxMotion speedX={speedX ?? 20} speedY={speedY ?? 20} delay={0} easing={[0.17, 0.67, 0.3, 0.99]}>
          <div
            style={{
              width: w,
              height: h,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <motion.img
              src={src}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'grayscale(100%)',
                scale: imageScale,
              }}
            />
          </div>
        </ParallaxMotion>
      ) : (
        <ParallaxMotion speedX={speedX ?? 5} speedY={speedY ?? 5} delay={0} easing={[0.17, 0.67, 0.3, 0.99]}>
          <div
            style={{
              width: w,
              height: h,
              backgroundColor: CONFIG.blockColor,
            }}
          />
        </ParallaxMotion>
      )}
    </motion.div>
  );
}

// =============================================================================
// HERO TEXT COMPONENT
// =============================================================================

function HeroText({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  // Move slower: less y movement
  const scale = useTransform(scrollYProgress, [0, 0.4, 0.8], [1, 1.15, 1.5]);
  // Fade and blur out later
  const opacity = useTransform(scrollYProgress, [0, 0.7, 0.92], [1, 1, 0]);
  const blur = useTransform(scrollYProgress, [0, 0.7, 0.92], [0, 0, 40]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -32]);

  return (
    
    <motion.div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
        pointerEvents: 'none',
        scale,
        opacity,
        y,
        filter: useTransform(blur, (v) => `blur(${v}px)`),
        willChange: 'transform, opacity, filter',
      }}
    >
      <h1
          style={{
          color: '#FFF8F2',
          textAlign: 'left',
          fontWeight: 700,
          lineHeight: 1.1,
          maxWidth: '1800px',
          padding: '0 2rem',
          fontSize: 'clamp(1.8rem, 10vw, 3.5rem)',
          letterSpacing: '-0.02em',
          textTransform: 'uppercase',
          }}
      >
          {CONFIG.heroText.map((line, i) => (
          <ParallaxMotion speedX={5} speedY={5} delay={0} easing={[0.17, 0.67, 0.3, 0.99]}>
          <span key={i} style={{ display: 'block' }}>
              {line}
          </span>
          </ParallaxMotion>
          ))}
      </h1>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function FlyThroughHero() { 
  const navigate = useNavigate();
  const [showNavBar, setShowNavBar] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNavBar(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  // RESPONSIVE SCALING FOR FLOATING ELEMENTS
  // ------------------------------------------------------------------------
  const [elementScale, setElementScale] = useState(1);
  const [positionSpread, setPositionSpread] = useState(1);
  const [isMobileView, setIsMobileView] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        // Mobile - smaller size, more spread
        setElementScale(0.7);
        setPositionSpread(1.2);
        setIsMobileView(true);
      } else if (width < 1024) {
        // Tablet - disable parallax
        setElementScale(0.7);
        setPositionSpread(1.1);
        setIsMobileView(true);
      } else {
        // Desktop with mouse
        setElementScale(1);
        setPositionSpread(1);
        setIsMobileView(false);
      }
    };
    
    handleResize(); // Set initial scale
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // ------------------------------------------------------------------------
  // SCROLL SECTION ANIMATION REFS & HOOKS (must be top-level for hooks)
  // ------------------------------------------------------------------------
  const scrollSectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(scrollSectionRef, { amount: 0.05 });
    //---------- LOCALIZED PARALLAX Y MOVEMENT FOR OBSESSIVE IMAGE ----------//
    const obsessiveSectionRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress: obsessiveScroll } = useScroll({
    target: obsessiveSectionRef,
    offset: ['start end', 'end start'],
    });
    const obsessedImg = useTransform(obsessiveScroll, [0, 1], [-150, 100]);
    const obsessedImgContent = useTransform(obsessiveScroll, [0, 1], [-100, 50]);
    const obsessedText = useTransform(obsessiveScroll, [0, 1], [250, -250]);
    
    //---------- LOCALIZED PARALLAX Y MOVEMENT FOR AMBITIOUS IMAGE ----------//
    const ambitiousSectionRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress: ambitiousScroll } = useScroll({
      target: ambitiousSectionRef,
      offset: ['start end', 'end start'],
    });
    const ambitiousImg = useTransform(ambitiousScroll, [0, 1], [-150, 100]);
    const ambitiousImgContent = useTransform(ambitiousScroll, [0, 1], [-100, 50]);
    const ambitiousText = useTransform(ambitiousScroll, [0, 1], [250, -250]);
    const ambitiousMap = useTransform(ambitiousScroll, [0, 1], [-200, 400]);
    // Scroll-based rotation for content-img-container
    const ambitiousRotateXRaw = useTransform(ambitiousScroll, [0, 0.7, 1], [0, 60, 60]);
    const ambitiousRotateYRaw = useTransform(ambitiousScroll, [0, 0.9, 1], [0, -10, -10]);
    const ambitiousRotateZRaw = useTransform(ambitiousScroll, [0, 0.5, 1], [0, 0, 50]);
    const ambitiousRotateX = useSpring(ambitiousRotateXRaw, { stiffness: 90, damping: 20 });
    const ambitiousRotateY = useSpring(ambitiousRotateYRaw, { stiffness: 35, damping: 20 });
    const ambitiousRotateZ = useSpring(ambitiousRotateZRaw, { stiffness: 35, damping: 20 });

    //---------- LOCALIZED PARALLAX Y MOVEMENT FOR NEXTGEN IMAGE ----------//
    const nextgenSectionRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress: nextgenScroll } = useScroll({
    target: nextgenSectionRef,
    offset: ['start end', 'end start'],
    });
    const nextgenImg = useTransform(nextgenScroll, [0, 1], [-150, 100]);
    const nextgenImgContent = useTransform(nextgenScroll, [0, 1], [-100, 50]);
    const nextgenText = useTransform(nextgenScroll, [0, 1], [250, -250]);

    //---------- LOCALIZED PARALLAX Y MOVEMENT FOR BUILDERS IMAGE ----------//
    const buildersSectionRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress: buildersScroll } = useScroll({
    target: buildersSectionRef,
    offset: ['start end', 'end start'],
    });
    const buildersImg = useTransform(buildersScroll, [0, 1], [-150, 100]);
    const buildersImgContent = useTransform(buildersScroll, [0, 1], [-100, 50]);
    const buildersText = useTransform(buildersScroll, [0, 1], [250, -250]);

    const containerRef = useRef<HTMLDivElement>(null);

    // Set up scroll tracking for fade-out
    const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
    });

    // Fade out hero when scrollYProgress >= 1 (more gradual)
    const fadeOut = useTransform(scrollYProgress, [0.7, 1], [1, 0]);
    // zIndex stays 10 until fully faded, then 0
    const heroZ = useTransform(scrollYProgress, [0, 0.999, 1], [10, 10, 0]);

    // Quotes section scroll effect
    // The parent .quotes-section is 100vh tall, so use window scroll
    const quotesSectionRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress: quotesScroll } = useScroll({
      target: quotesSectionRef,
      offset: ['start end', 'end start'],
    });
    // Middle slowest, left faster, right fastest (more exaggerated parallax)
    // Remove parallax for all columns on mobile
    const leftY = useTransform(quotesScroll, [0, 1], isMobileView ? [0, 0] : [100, -600]);
    const centerY = useTransform(quotesScroll, [0, 1], isMobileView ? [0, 0] : [0, -250]);
    const rightY = useTransform(quotesScroll, [0, 1], isMobileView ? [0, 0] : [1000, -1000]);
    // Scale and 3D tilt for quotes section as it scrolls out of view
    const quotesScaleRaw = useTransform(quotesScroll, [0.72, 1], [1, 0.8]);
    const quotesTiltRaw = useTransform(quotesScroll, [0.72, 1], [0, 25]);
    const springConfig = { stiffness: 100, damping: 20, mass: 0.1 };
    const quotesScale = useSpring(quotesScaleRaw, springConfig);
    const quotesTilt = useSpring(quotesTiltRaw, springConfig);

    
return (
    <>
        <NavBar logoColor="dark" hamburgerColor="#FFF8F2" streakColor="rgba(216, 46, 17, 1)" opacity={showNavBar ? 1 : 0} />
        
        {/* Fixed hero viewport, fades out at end, fades back in if user scrolls up */}
        <motion.div
            style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
            backgroundColor: CONFIG.bgColor,
            zIndex: heroZ,
            opacity: fadeOut,
            pointerEvents: 'none',
            }}
        >
            {/* 3D perspective container */}
            <div
            style={{
                position: 'relative',
                height: '100%',
                width: '100%',
                perspective: '1000px',
                perspectiveOrigin: '50% 50%',
            }}
            >
            {/* Render faint blocks (farthest back) */}
            {FAINT_BLOCKS.map((el) => (
                <FloatingElement
                key={el.id}
                id={el.id}
                type={el.type}
                x={el.x}
                y={el.y}
                z={el.z}
                w={el.w * elementScale}
                h={el.h * elementScale}
                scrollYProgress={scrollYProgress}
                faint
                speedX={el.speedX}
                speedY={el.speedY}
                positionSpread={positionSpread}
                />
            ))}
            {/* Render blocks (background), then images (foreground) */}
            {ELEMENTS.filter(el => el.type === 'block').map((el) => (
                <FloatingElement
                key={el.id}
                id={el.id}
                type={el.type}
                x={el.x}
                y={el.y}
                z={el.z}
                w={el.w * elementScale}
                h={el.h * elementScale}
                scrollYProgress={scrollYProgress}
                speedX={el.speedX}
                speedY={el.speedY}
                positionSpread={positionSpread}
                />
            ))}
            {ELEMENTS.filter(el => el.type === 'image')
              .filter(el => {
                // Hide img-2 and img-5 on mobile
                if ((el.id === 'img-2' || el.id === 'img-5') && window.innerWidth < 768) return false;
                return true;
              })
              .map((el) => (
                <FloatingElement
                key={el.id}
                id={el.id}
                type={el.type}
                src={'src' in el ? el.src : undefined}
                x={el.x}
                y={el.y}
                z={el.z}
                w={el.w * elementScale}
                h={el.h * elementScale}
                scrollYProgress={scrollYProgress}
                positionSpread={positionSpread}
                />
            ))}
            <HeroText scrollYProgress={scrollYProgress} />
            </div>
        </motion.div>

        {/* Scroll container for animation progress only */}
        <div
            ref={containerRef}
            style={{
            position: 'relative',
            backgroundColor: '#590D0F',
            height: `${CONFIG.scrollDistance * 100}vh`,
            touchAction: 'pan-y',
            }}
        />

        {/* ------------------------------------------------------------------------ */}
        {/* QUOTES SECTION */}
        {/* ------------------------------------------------------------------------ */}
        <motion.div
          className="quotes-section"
          ref={quotesSectionRef}
          style={{
            position: 'relative',
            zIndex: 5,
            backgroundColor: '#590D0F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            perspective: 1000,
          }}
        >
          <motion.div
            style={{
              scale: quotesScale,
              rotateX: quotesTilt,
              transformOrigin: 'center bottom',
              width: '100%',
            }}
          >
            <div className="content-wrapper">
              <div className="quotes-grid">
                <motion.div className="column column-left" style={{ y: leftY }}>
                  {homeContent.quotes.filter((_, i) => i % 3 === 0).map((card, idx) => (
                    <QuoteCard key={card.name + idx} {...card} />
                  ))}
                </motion.div>
                <motion.div className="column column-center" style={{ y: centerY }}>
                  {homeContent.quotes.filter((_, i) => i % 3 === 1).map((card, idx) => (
                    <QuoteCard key={card.name + idx} {...card} />
                  ))}
                </motion.div>
                <motion.div className="column column-right" style={{ y: rightY }}>
                  {homeContent.quotes.filter((_, i) => i % 3 === 2).map((card, idx) => (
                    <QuoteCard key={card.name + idx} {...card} />
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ------------------------------------------------------------------------ */}
        {/* SCROLL SECTION */}
        {/* ------------------------------------------------------------------------ */}
        {/* Add scroll-based entry animation to scroll-section */}
        {(() => {
          const { scrollYProgress: scrollSectionScroll } = useScroll({
            target: scrollSectionRef,
            offset: ['start end', 'end start'],
          });
          
          // Slow down scroll-section as it exits - positive Y holds it back from scrolling up
          const slowDownY = useTransform(
            scrollSectionScroll, 
            [0, 0.87, 1], 
            [0, 0, 400]
          );
          
          // Add blur as it slows down
          const slowDownBlur = useTransform(
            scrollSectionScroll,
            [0, 0.86, 1],
            [0, 0, 8]
          );
          
          // Add rotateX as it slows down
          const slowDownRotateX = useTransform(
            scrollSectionScroll,
            [0, 0.86, 1],
            [0, 0, -10]
          );
          
          const scrollSectionScaleRaw = useTransform(scrollSectionScroll, [0, 0.15], [0.8, 1]);
          const scrollSectionTiltRaw = useTransform(scrollSectionScroll, [0, 0.15], [-40, 0]);
          const scrollSectionSkewRaw = useTransform(scrollSectionScroll, [0, 0.15], [10, 0]);
          const scrollSectionScale = useSpring(scrollSectionScaleRaw, springConfig);
          const scrollSectionTilt = useSpring(scrollSectionTiltRaw, springConfig);
          const scrollSectionSkew = useSpring(scrollSectionSkewRaw, springConfig);
          return (
            <motion.div 
              className="scroll-section" 
              ref={scrollSectionRef} 
              style={{ 
                y: slowDownY, 
                rotateX: slowDownRotateX,
                filter: useTransform(slowDownBlur, (v) => `blur(${v}px)`),
                position: 'relative', 
                zIndex: 1 
              }}
            >
              <motion.div
                className="section-content-wrapper"
                style={{
                  scale: scrollSectionScale,
                  rotateX: scrollSectionTilt,
                  skewY: scrollSectionSkew,
                  transformOrigin: 'center bottom',
                  perspective: 1200,
                  zIndex: 2,
                }}>

                {/*------------------- OBSESSIVE ------------------*/}
                <div className="part part-obsessive" ref={obsessiveSectionRef}>
                  <motion.div 
                    className="bg-shape" 
                    style={{ y: obsessedImg }}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: inView ? 1 : 1.2 }}
                    transition={{ type: 'spring', stiffness: 150, damping: 24 }}
                  />
                  <div className="part-img-wrapper">
                    <motion.div className="part-img-squares" style={{ y: obsessedImgContent }}>
                        <ParallaxMotion speedX={24} speedY={24} delay={0} easing={[0.17, 0.67, 0.3, 0.99]}>
                            <div className="square-1"></div>
                        </ParallaxMotion>
                        <ParallaxMotion speedX={35} speedY={35} delay={0} easing={[0.17, 0.67, 0.3, 0.99]}>
                            <div className="square-2"></div>
                        </ParallaxMotion>
                    </motion.div>
                    <motion.div className="part-img-text" style={{ y: obsessedImgContent }}>
                        <ParallaxMotion speedX={isMobileView ? 0 : 10} speedY={isMobileView ? 0 : 10} delay={0} easing={[0.17, 0.67, 0.3, 0.99]}>
                            <div style={{ position: 'relative', display: 'inline-block', overflow: 'hidden' }}>
                              <p style={{ position: 'relative', zIndex: 0 }}>
                                For those who outwork and outthink the rest.
                              </p>
                              <motion.div
                                initial={{ translateY: "0%" }}
                                whileInView={{ translateY: "100%" }}
                                transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                viewport={{ once: true, amount: 0.5 }}
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  width: "100%",
                                  height: "100%",
                                  backgroundColor: "#D82E11",
                                  zIndex: 1
                                }}
                              />
                            </div>
                        </ParallaxMotion>
                    </motion.div>
                    <div className='part-img'>
                      <ParallaxMotion speedX={8} speedY={8} delay={12} easing={[0.17, 0.67, 0.3, 0.99]}>
                        <motion.img
                          src="/assets/images/values/obsessive_2.webp" 
                          alt="Founders House Obsessive Part" 
                          style={{ y: obsessedImg, scale: 1.1 }}
                        />
                        
                        {/*
                        <motion.div style={{ y: obsessedImg, scale: 1.1 }}>   
                          <GridDistortion
                            imageSrc="/assets/images/values/obsessive_2.webp" 
                            grid={20}
                            mouse={0.25}
                            strength={0.01}
                            relaxation={0.95}
                            className="team-distortion-img"
                          />
                        </motion.div>
                        */}
                      </ParallaxMotion>
                    </div>
                  </div>
                  <motion.div className="part-img-title" style={{ y: obsessedText }}>
                    <ParallaxMotion speedX={24} speedY={24} delay={12} easing={[0.17, 0.67, 0.3, 0.99]}>
                        <h3>{homeContent.values.obsessive.title}</h3>
                    </ParallaxMotion>
                  </motion.div>
                </div>


                {/*------------------- AMBITIOUS ------------------*/}
                <div className="part part-ambitious" ref={ambitiousSectionRef}>
                  <motion.div 
                    className="bg-shape" 
                    style={{  }}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: inView ? 1 : 1.2 }}
                    transition={{ type: 'spring', stiffness: 150, damping: 44 }}
                  />

                  <div className="part-img-wrapper">
                    <motion.div className="part-img-squares" style={{ y: ambitiousImgContent }}>
                        <ParallaxMotion speedX={24} speedY={24} delay={0} easing={[0.17, 0.67, 0.3, 0.99]}>
                            <div className="square-1"></div>
                        </ParallaxMotion>
                        <ParallaxMotion speedX={35} speedY={35} delay={0} easing={[0.17, 0.67, 0.3, 0.99]}>
                            <div className="square-2"></div>
                        </ParallaxMotion>
                    </motion.div>
                    <motion.div className="part-img-text" style={{ y: ambitiousImgContent }}>
                        <ParallaxMotion speedX={isMobileView ? 0 : 10} speedY={isMobileView ? 0 : 10} delay={0} easing={[0.17, 0.67, 0.3, 0.99]}>
                            <div style={{ position: 'relative', display: 'inline-block', overflow: 'hidden' }}>
                              <p style={{ position: 'relative', zIndex: 0 }}>
                                {homeContent.values.ambitious.description}
                              </p>
                              <motion.div
                                initial={{ translateY: "0%" }}
                                whileInView={{ translateY: "100%" }}
                                transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                viewport={{ once: true, amount: 0.5 }}
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  width: "100%",
                                  height: "100%",
                                  backgroundColor: "#D82E11",
                                  zIndex: 1
                                }}
                              />
                            </div>
                        </ParallaxMotion>
                    </motion.div>
                    <div className='part-img'>
                      <ParallaxMotion speedX={8} speedY={8} delay={12} easing={[0.17, 0.67, 0.3, 0.99]}>
                        <motion.img
                          src="/assets/images/values/ambitious_2.webp" 
                          alt="Founders House Ambitious Part" 
                          style={{ y: ambitiousImg, scale: 1.1 }}
                        />
                      </ParallaxMotion>
                    </div>
                  </div>

                  <motion.div className="part-img-title" style={{ y: ambitiousText }}>
                    <ParallaxMotion speedX={24} speedY={24} delay={12} easing={[0.17, 0.67, 0.3, 0.99]}>
                        <h3>{homeContent.values.ambitious.title}</h3>
                    </ParallaxMotion>
                  </motion.div>
                  
                  <div className="ambitious-map">
                    <motion.div className="content-img-container"
                      style={{ y: ambitiousMap, rotateX: ambitiousRotateX, rotateY: ambitiousRotateY, rotateZ: ambitiousRotateZ }}
                    >
                      <div className="img-container-fade">
                          <div className="img-gradient-left" />
                          <div className="img-gradient-right" />
                          <div className="img-gradient-top" />
                          <div className="img-gradient-bottom" />
                      </div>
                      {/*<motion.div className="ambitious-map-inner" style={{ rotateX: ambitiousRotateX }}>*/}
                        <div style={{ mixBlendMode: "multiply" }}>
                          <ParallaxMotion background="#2B0906" speedX={16} speedY={16} easing={[0.17, 0.67, 0.3, 0.99]}>
                            <motion.img
                              className="section-5-map-img"
                              src="/assets/models/birdseyemaps.webp"
                              alt="2D Map"
                              style={{ mixBlendMode: "multiply", width: "100%", height: "auto" }}
                              animate={{  }}
                              transition={{ duration: 0.6, ease: [0.17, 0.67, 0.3, 0.99] }}
                            />
                          </ParallaxMotion>
                        </div>
                        <ParallaxMotion speedX={16} speedY={16} easing={[0.17, 0.67, 0.3, 0.99]}>
                          <motion.img
                            className="section-5-map-img"
                            src="/assets/models/radar.webp"
                            alt="2D Map Pin"
                            style={{ width: "100%", height: "auto", top: "0%" }}
                            animate={{  }}
                            transition={{ duration: 0.6, ease: [0.17, 0.67, 0.3, 0.99] }}
                          />
                        </ParallaxMotion>
                      {/*</motion.div>*/}
                    </motion.div>
                  </div>
                </div>


                {/*------------------- NEXTGEN ------------------*/}
                <div className="part part-nextgen" ref={nextgenSectionRef}>
                  <motion.div 
                    className="bg-shape"
                    style={{  }}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: inView ? 1 : 1.2 }}
                    transition={{ type: 'spring', stiffness: 150, damping: 44 }}
                  />

                  <div className="part-img-wrapper">
                    <motion.div className="part-img-squares" style={{ y: nextgenImgContent }}>
                        <ParallaxMotion speedX={24} speedY={24} delay={0} easing={[0.17, 0.67, 0.3, 0.99]}>
                            <div className="square-1"></div>
                        </ParallaxMotion>
                        <ParallaxMotion speedX={35} speedY={35} delay={0} easing={[0.17, 0.67, 0.3, 0.99]}>
                            <div className="square-2"></div>
                        </ParallaxMotion>
                    </motion.div>
                    <motion.div className="part-img-text" style={{ y: nextgenImgContent }}>
                        <ParallaxMotion speedX={isMobileView ? 0 : 10} speedY={isMobileView ? 0 : 10} delay={0} easing={[0.17, 0.67, 0.3, 0.99]}>
                            <div style={{ position: 'relative', display: 'inline-block', overflow: 'hidden' }}>
                              <p style={{ position: 'relative', zIndex: 0 }}>
                                {homeContent.values.nextgen.description}
                              </p>
                              <motion.div
                                initial={{ translateY: "0%" }}
                                whileInView={{ translateY: "100%" }}
                                transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                viewport={{ once: true, amount: 0.5 }}
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  width: "100%",
                                  height: "100%",
                                  backgroundColor: "#D82E11",
                                  zIndex: 1
                                }}
                              />
                            </div>
                        </ParallaxMotion>
                    </motion.div>
                    <div className='part-img'>
                      <ParallaxMotion speedX={8} speedY={8} delay={12} easing={[0.17, 0.67, 0.3, 0.99]}>
                        <motion.img
                          src="/assets/images/values/nextgen.webp" 
                          alt="Founders House NextGen Part" 
                          style={{ y: nextgenImg, scale: 1.1 }}
                        />
                      </ParallaxMotion>
                    </div>
                  </div>

                  <motion.div className="part-img-title" style={{ y: nextgenText }}>
                    <ParallaxMotion speedX={24} speedY={24} delay={12} easing={[0.17, 0.67, 0.3, 0.99]}>
                        <h3>{homeContent.values.nextgen.title}</h3>
                    </ParallaxMotion>
                  </motion.div>
                </div>


                {/*------------------- BUILDERS ------------------*/}
                <div className="part part-builders" ref={buildersSectionRef}>
                  <motion.div 
                    className="bg-shape" 
                    style={{ y: buildersImg }}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: inView ? 1 : 1.2 }}
                    transition={{ type: 'spring', stiffness: 150, damping: 44 }}
                  />
                  <div className="part-img-wrapper">
                    <motion.div className="part-img-squares" style={{ y: buildersImgContent }}>
                        <ParallaxMotion speedX={24} speedY={24} delay={0} easing={[0.17, 0.67, 0.3, 0.99]}>
                            <div className="square-1"></div>
                        </ParallaxMotion>
                        <ParallaxMotion speedX={35} speedY={35} delay={0} easing={[0.17, 0.67, 0.3, 0.99]}>
                            <div className="square-2"></div>
                        </ParallaxMotion>
                    </motion.div>
                    <motion.div className="part-img-text" style={{ y: buildersImgContent }}>
                        <ParallaxMotion speedX={isMobileView ? 0 : 10} speedY={isMobileView ? 0 : 10} delay={0} easing={[0.17, 0.67, 0.3, 0.99]}>
                            <div style={{ position: 'relative', display: 'inline-block', overflow: 'hidden' }}>
                              <p style={{ position: 'relative', zIndex: 0 }}>
                                {homeContent.values.builders.description}
                              </p>
                              <motion.div
                                initial={{ translateY: "0%" }}
                                whileInView={{ translateY: "100%" }}
                                transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                viewport={{ once: true, amount: 0.5 }}
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  width: "100%",
                                  height: "100%",
                                  backgroundColor: "#D82E11",
                                  zIndex: 1
                                }}
                              />
                            </div>
                        </ParallaxMotion>
                    </motion.div>
                    <div className='part-img'>
                      <ParallaxMotion speedX={8} speedY={8} delay={12} easing={[0.17, 0.67, 0.3, 0.99]}>
                        <motion.img
                          src="/assets/images/values/builders.webp" 
                          alt="Founders House Builders Part" 
                          style={{ y: buildersImg, scale: 1.1 }}
                        />
                      </ParallaxMotion>
                    </div>
                  </div>
                  <motion.div className="part-img-title" style={{ y: buildersText }}>
                    <ParallaxMotion speedX={24} speedY={24} delay={12} easing={[0.17, 0.67, 0.3, 0.99]}>
                        <h3>{homeContent.values.builders.title}</h3>
                    </ParallaxMotion>
                  </motion.div>
                </div>
              </motion.div>


              
            </motion.div>
          );
        })()}

        {/* ------------------------------------------------------------------------ */}
        {/* JOIN SECTION */}
        {/* ------------------------------------------------------------------------ */}
        <motion.div
          className="join-section"
        >
          <div className="join-title">
            <ParallaxMotion speedX={15} speedY={15} delay={5} easing={[0.17, 0.67, 0.3, 0.99]}>
              <p>{homeContent.join.description}</p>
            </ParallaxMotion>
          </div>
          
          <div className="join-img">
            <ParallaxMotion speedX={10} speedY={10} delay={5} easing={[0.17, 0.67, 0.3, 0.99]}>
              <div className="join-img-container">
                <ParallaxMotion speedX={24} speedY={24} delay={10} easing={[0.17, 0.67, 0.3, 0.99]}>
                  <motion.img
                    className="join-img-img"
                    src="/assets/images/membership/horses.webp" 
                    alt="Founders House Join Us"
                  />
                </ParallaxMotion>
                <div className="join-img-content">
                  <div style={{ position: 'relative', display: 'inline-block', overflow: 'hidden' }}>
                    <h4 style={{ position: 'relative', zIndex: 0 }}>{homeContent.join.heading}</h4>
                    <motion.div
                      initial={{ translateY: "0%" }}
                      whileInView={{ translateY: "101%" }}
                      transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      viewport={{ once: true, amount: 0.5 }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#D82E11",
                        zIndex: 1
                      }}
                    />
                  </div>
                  <Button className="cta-button" onClick={() => navigate('/join')} style={{ width: 'fit-content' }}>{homeContent.join.buttonText}</Button>
                </div>
                {/* Animated squares */}
                <div className="join-img-square join-square-tl-1" />
                <div className="join-img-square join-square-tl-2" />
                <div className="join-img-square join-square-tl-3" />
                <div className="join-img-square join-square-tr-1" />
                <div className="join-img-square join-square-tr-2" />
                <div className="join-img-square join-square-tr-3" />
                <div className="join-img-square join-square-bl-1" />
                <div className="join-img-square join-square-bl-2" />
                <div className="join-img-square join-square-bl-3" />
                <div className="join-img-square join-square-br-1" />
                <div className="join-img-square join-square-br-2" />
                <div className="join-img-square join-square-top-1" />
                <div className="join-img-square join-square-top-1-a" />
                <div className="join-img-square join-square-top-1-b" />
                <div className="join-img-square join-square-top-2" />
                <div className="join-img-square join-square-top-2-a" />
                <div className="join-img-square join-square-top-2-b" />
                <div className="join-img-square join-square-bottom-1" />
                <div className="join-img-square join-square-bottom-2" />
              </div>
            </ParallaxMotion>
          </div>
          
          <div className="join-img-shape-container">
            <ParallaxMotion speedX={5} speedY={5} delay={10} easing={[0.17, 0.67, 0.3, 0.99]}>
              <div className="join-img-shape"></div>
            </ParallaxMotion>
          </div>
        </motion.div>
    </>
  );
}

export default FlyThroughHero;