/**
 * LearnMoreHeader - Reusable header component for LearnMore pages
 * Contains logo, menu icon, and back to map button
 */

import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

interface LearnMoreHeaderProps {
  showBackground: boolean
  hasEnteredFromTransition: boolean
}

export const LearnMoreHeader = ({ 
  showBackground, 
  hasEnteredFromTransition 
}: LearnMoreHeaderProps) => {
  const navigate = useNavigate()

  return (
    <>
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
          // Set flag to skip intro when returning to map
          sessionStorage.setItem('skipIntro', 'true')
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
    </>
  )
}
