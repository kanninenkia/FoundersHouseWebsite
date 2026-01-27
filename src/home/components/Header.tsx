/**
 * HomeHeader - Reusable header component for Home page
 * Contains logo, menu icon, and back to map button
 * Handles all entry animation logic internally
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { AnimatedHamburger } from '../../components/ui'
import { FullScreenMenu } from '../../components/layout'

export const HomeHeader = () => {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const fromTransition = sessionStorage.getItem('transitioningToLearnMore') === 'true'
  const [hasEnteredFromTransition] = useState(fromTransition)
  const [showBackground] = useState(true)

  useEffect(() => {
    if (fromTransition) {
      setTimeout(() => {
        sessionStorage.removeItem('transitioningToLearnMore')
      }, 100)
    }
  }, [])

  return (
    <>
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
        <img src="/assets/logos/logoWhite.png" alt="Founders House" className="header-logo" />
        <motion.button
          className="back-to-map-button"
          onClick={() => {
            sessionStorage.setItem('skipIntro', 'true')
            sessionStorage.setItem('hasVisitedMap', 'true')
            sessionStorage.removeItem('transitioningToLearnMore')
            navigate('/')
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: showBackground ? 1 : 0 }}
          transition={{
            delay: hasEnteredFromTransition ? 2.2 : 1.0,
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1]
          }}
          whileHover={{
            scale: 1.05,
            transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
          }}
          whileTap={{
            scale: 0.95,
            transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
          }}
        >
          ← Map
        </motion.button>
        <div onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <AnimatedHamburger isOpen={isMenuOpen} onClick={() => setIsMenuOpen(!isMenuOpen)} />
        </div>
      </motion.header>

      <FullScreenMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  )
}
