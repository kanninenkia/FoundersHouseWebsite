/**
 * LearnMoreHeader - Reusable header component for LearnMore pages
 * Contains logo, menu icon, and back to map button
 * Handles all entry animation logic internally
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export const LearnMoreHeader = () => {
  const navigate = useNavigate()

  // Entry animation state
  const [hasEnteredFromTransition, setHasEnteredFromTransition] = useState(false)
  const [showBackground, setShowBackground] = useState(false)

  // Entry animation - check if coming from transition
  useEffect(() => {
    const fromTransition = sessionStorage.getItem('transitioningToLearnMore') === 'true'

    if (fromTransition) {
      setHasEnteredFromTransition(true)
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
