/**
 * CTASection - Final call-to-action section with horses image
 * Phase 5 of the scroll animation
 */

import { motion, MotionValue } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import './CTASection.css'

interface CTASectionProps {
  zScrollComplete: boolean
  ctaTextOpacity: number
  horsesOpacity: number
  ctaTextY: number
  horsesY: number
  ctaTextParallaxX: MotionValue<number>
  ctaTextParallaxY: MotionValue<number>
  horsesImageParallaxX: MotionValue<number>
  horsesImageParallaxY: MotionValue<number>
}

export const CTASection = ({
  zScrollComplete,
  ctaTextOpacity,
  horsesOpacity,
  ctaTextY,
  horsesY,
  ctaTextParallaxX,
  ctaTextParallaxY,
  horsesImageParallaxX,
  horsesImageParallaxY
}: CTASectionProps) => {
  const navigate = useNavigate()

  if (!zScrollComplete) return null

  const handleImageClick = () => {
    navigate('/join')
  }

  return (
    <motion.section
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: '7vh',
        paddingBottom: '0',
        zIndex: 20,
        pointerEvents: 'auto',
      }}
    >
      {/* CTA Text */}
      <motion.div
        style={{
          opacity: ctaTextOpacity,
          transform: `translateY(${ctaTextY}vh)`,
          x: ctaTextParallaxX,
          y: ctaTextParallaxY,
          width: '95%',
          maxWidth: '1572px',
          textAlign: 'justify',
        }}
      >
        <h2
          style={{
            fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
            fontSize: 'clamp(1.7rem, 4.25vw, 3.4rem)',
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

      {/* Horses Image with hover effect */}
      <motion.div
        className="horses-image-container"
        onClick={handleImageClick}
        style={{
          opacity: horsesOpacity,
          transform: `translateY(${horsesY}vh) scaleY(0.9)`,
          x: horsesImageParallaxX,
          y: horsesImageParallaxY,
          marginTop: '5vh',
          width: '100%',
          maxWidth: '1572px',
          position: 'relative',
          cursor: 'pointer',
        }}
      >
        <motion.img
          src="/images/horses-colour.webp"
          alt="Horses"
          className="horses-image"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
          }}
        />
        {/* Animated squares: top-left */}
        <div className="horses-square square-tl-1" />
        <div className="horses-square square-tl-2" />
        <div className="horses-square square-tl-3" />
        {/* Animated squares: bottom-right */}
        <div className="horses-square square-br-1" />
        <div className="horses-square square-br-2" />
        <div className="horses-square square-br-3" />
        {/* Bottom left text */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
            fontSize: 'clamp(1.36rem, 3.4vw, 2.72rem)',
            fontWeight: 500,
            color: '#FFF8F2',
            textTransform: 'uppercase',
            lineHeight: 1,
            zIndex: 3,
          }}
        >
          JOIN US, BUILD WITH US, DEFINE TOMORROW.
        </div>
      </motion.div>
    </motion.section>
  )
}
