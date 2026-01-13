/**
 * QuotesSection - Manages the grid of quote cards with fade animations
 */

import { motion } from 'framer-motion'
import { QuoteCard } from './QuoteCard'
import { quoteCardsData } from './quoteCardsData'

interface QuotesSectionProps {
  scrollProgress: number
  zScrollComplete: boolean
  boxScrollProgress: number
  cardsInteractive: boolean
  ANIMATION_CONFIG: any
  EASING: any
}

export const QuotesSection = ({
  scrollProgress,
  zScrollComplete,
  boxScrollProgress,
  cardsInteractive,
  ANIMATION_CONFIG,
  EASING
}: QuotesSectionProps) => {
  return (
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
  )
}
