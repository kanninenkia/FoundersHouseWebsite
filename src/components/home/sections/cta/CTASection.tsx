/**
 * CTASection - Final call-to-action section with horses image
 * Phase 5 of the scroll animation
 */

import { motion } from 'framer-motion'

interface CTASectionProps {
  zScrollComplete: boolean
  ctaTextOpacity: number
  horsesOpacity: number
  ctaTextY: number
  horsesY: number
}

export const CTASection = ({
  zScrollComplete,
  ctaTextOpacity,
  horsesOpacity,
  ctaTextY,
  horsesY
}: CTASectionProps) => {
  if (!zScrollComplete) return null

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

      {/* Horses Image */}
      <motion.img
        src="/images/horses.webp"
        alt="Horses"
        style={{
          opacity: horsesOpacity,
          transform: `translateY(${horsesY}vh) scaleY(0.85)`,
          marginTop: '6vh',
          width: '100%',
          maxWidth: '1572px',
          height: 'auto',
          objectFit: 'contain',
        }}
      />
    </motion.section>
  )
}
