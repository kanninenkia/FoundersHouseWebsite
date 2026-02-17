import { Suspense } from 'react'
import { motion } from 'framer-motion'
import { useTransition } from './TransitionContext'
import { TRANSITION_TIMING, pageFadeEase } from './config'

interface PageContentProps {
  children: React.ReactNode
  skipFadeIn?: boolean
}

export default function PageContent({ children, skipFadeIn = false }: PageContentProps) {
  const { contentReady } = useTransition()
  const show = skipFadeIn || contentReady

  return (
    <motion.div
      style={{ minHeight: '100vh' }}
      initial={{ opacity: skipFadeIn ? 1 : 0 }}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{
        duration: TRANSITION_TIMING.pageFadeMs / 1000,
        ease: pageFadeEase,
      }}
    >
      <Suspense fallback={<div style={{ background: '#590D0F', width: '100vw', height: '100vh' }} />}>
        {children}
      </Suspense>
    </motion.div>
  )
}
