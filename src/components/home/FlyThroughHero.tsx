'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import ParallaxMotion from '../../effects/ParallaxMotion.tsx';
import './FlyThroughHero.css';
import { QuoteCard } from './sections/quotes/QuoteCard.tsx';
import { quoteCardsData } from './sections/quotes/quoteCardsData';

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  // Background color
  bgColor: '#9E1B1E',
  blockColor: '#590D0F',
  
  // Scroll distance (multiplier of viewport height)
  scrollDistance: 3,
  
  // Text content
  heroText: [
    'WE BRING EXCEPTIONAL YOUNG',
    'TALENT UNDER ONE ROOF,',
    'WHERE AMBITION CONCENTRATES',
    'AND POTENTIAL MULTIPLIES.',
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
  { id: 'img-1', type: 'image', src: '/images/LoadInImage-min.webp', x: -38, y: 8, z: 0.3, w: 220, h: 220, speedX: 40, speedY: 10 },
  { id: 'img-2', type: 'image', src: '/images/Legends Day Still 002.webp', x: -18, y: -30, z: 0.5, w: 180, h: 180, speedX: 10, speedY: 30 },
  { id: 'img-3', type: 'image', src: '/images/Legends Day Still 014.webp', x: 18, y: -34, z: 0.4, w: 210, h: 210 },
  { id: 'img-4', type: 'image', src: '/images/Wave x Maki Photo.webp', x: 35, y: 15, z: 0.6, w: 280, h: 280, speedX: 30, speedY: 5 },
  { id: 'img-5', type: 'image', src: '/images/Wave x Maki Photo (2).webp', x: 3, y: 30, z: 0.35, w: 220, h: 220 },
  { id: 'img-6', type: 'image', src: '/images/The Legends Day.webp', x: -22, y: 40, z: 0.55, w: 200, h: 200, speedX: 15, speedY: 15 },

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
}

function FloatingElement({ type, src, x, y, z, w, h, scrollYProgress, faint = false, speedX, speedY }: FloatingElementProps & { faint?: boolean }) {
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

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: `calc(50% + ${x}%)`,
        top: `calc(50% + ${y}%)`,
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
                fontSize: 'clamp(1.5rem, 4.5vw, 3.5rem)',
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
  // ------------------------------------------------------------------------
  // LOCALIZED PARALLAX Y MOVEMENT FOR OBSESSIVE IMAGE
  // ------------------------------------------------------------------------
  const obsessiveSectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: obsessiveScroll } = useScroll({
    target: obsessiveSectionRef,
    offset: ['start end', 'end start'],
  });
  const obsessedImg = useTransform(obsessiveScroll, [0, 1], [-150, 100]);
  const obsessedImgContent = useTransform(obsessiveScroll, [0, 1], [-100, 50]);

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
  const leftY = useTransform(quotesScroll, [0, 1], [100, -600]);
  const centerY = useTransform(quotesScroll, [0, 1], [0, -250]);
  const rightY = useTransform(quotesScroll, [0, 1], [1000, -1000]);

// Hero is always mounted, just fades in/out
return (
    <>
        {/* Scroll container for animation progress only */}
        <div
            ref={containerRef}
            style={{
            position: 'relative',
            backgroundColor: '#590D0F',
            height: `${CONFIG.scrollDistance * 100}vh`,
            }}
        />

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
            pointerEvents: 'auto',
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
                w={el.w}
                h={el.h}
                scrollYProgress={scrollYProgress}
                faint
                speedX={el.speedX}
                speedY={el.speedY}
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
                w={el.w}
                h={el.h}
                scrollYProgress={scrollYProgress}
                speedX={el.speedX}
                speedY={el.speedY}
                />
            ))}
            {ELEMENTS.filter(el => el.type === 'image').map((el) => (
                <FloatingElement
                key={el.id}
                id={el.id}
                type={el.type}
                src={'src' in el ? el.src : undefined}
                x={el.x}
                y={el.y}
                z={el.z}
                w={el.w}
                h={el.h}
                scrollYProgress={scrollYProgress}
                />
            ))}
            <HeroText scrollYProgress={scrollYProgress} />
            </div>
        </motion.div>

        {/* ------------------------------------------------------------------------ */}
        {/* QUOTES SECTION */}
        {/* ------------------------------------------------------------------------ */}
        <div
            className="quotes-section"
            ref={quotesSectionRef}
            style={{ position: 'relative', zIndex: 5, backgroundColor: '#590D0F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
            <div className="content-wrapper">
                <div className="quotes-grid">
                    <motion.div className="column column-left" style={{ y: leftY }}>
                        {quoteCardsData.filter((_, i) => i % 3 === 0).map((card, idx) => (
                            <QuoteCard key={card.name + idx} {...card} />
                        ))}
                    </motion.div>
                    <motion.div className="column column-center" style={{ y: centerY }}>
                        {quoteCardsData.filter((_, i) => i % 3 === 1).map((card, idx) => (
                            <QuoteCard key={card.name + idx} {...card} />
                        ))}
                    </motion.div>
                    <motion.div className="column column-right" style={{ y: rightY }}>
                        {quoteCardsData.filter((_, i) => i % 3 === 2).map((card, idx) => (
                            <QuoteCard key={card.name + idx} {...card} />
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>

        {/* ------------------------------------------------------------------------ */}
        {/* SCROLL SECTION */}
        {/* ------------------------------------------------------------------------ */}
        <div className="scroll-section">
          <div className="section-content-wrapper">
            {/*-----------------------------------------*/}
            <div className="part part-obsessive" ref={obsessiveSectionRef}>
              <div className="bg-shape"></div>
              <div className="part-img-wrapper">
                <motion.div className="part-img-squares" style={{ y: obsessedImgContent }}>
                    <ParallaxMotion speedX={24} speedY={24} delay={0} easing={[0.17, 0.67, 0.3, 0.99]}>
                        <div className="square-1"></div>
                    </ParallaxMotion>
                    <ParallaxMotion speedX={35} speedY={35} delay={0} easing={[0.17, 0.67, 0.3, 0.99]}>
                        <div className="square-2"></div>
                    </ParallaxMotion>
                </motion.div>
                <div className="part-img-text">
                    <ParallaxMotion speedX={10} speedY={10} delay={0} easing={[0.17, 0.67, 0.3, 0.99]}>
                        <motion.p style={{ y: obsessedImgContent }}>For those who outwork and outthink the rest.</motion.p>
                    </ParallaxMotion>
                </div>
                <div className='part-img'>
                  <ParallaxMotion speedX={8} speedY={8} delay={12} easing={[0.17, 0.67, 0.3, 0.99]}>
                    <motion.img 
                      src="/images/placeholder.webp" 
                      alt="Founders House Obsessive Part" 
                      style={{ y: obsessedImg, scale: 1.1 }}
                    />
                  </ParallaxMotion>
                </div>
              </div>
              <div className="part-img-title">
                <h3>OBSESSIVE</h3>
              </div>
            </div>
          </div>
        </div>

    </>
  );
}

export default FlyThroughHero;