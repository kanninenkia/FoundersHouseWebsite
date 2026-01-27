/**
 * QuotesSection - Manages the grid of quote cards with fade animations
 */

import { motion } from 'framer-motion'
import { QuoteCard } from './QuoteCard'
import { quoteCardsData } from './quoteCardsData'

interface QuotesSectionProps {
  scrollProgress: number
  zScrollComplete: boolean
  cardsInteractive: boolean
  isOpeningOutOfView: boolean;
  ANIMATION_CONFIG: any
  EASING: any
}

export const QuotesSection = ({
  scrollProgress,
  zScrollComplete,
  cardsInteractive,
  isOpeningOutOfView,
  ANIMATION_CONFIG,
  EASING
}: QuotesSectionProps) => {
  const { quoteCards } = ANIMATION_CONFIG;
  const fadeInStart = 0.5; // Cards remain stationary until scrollProgress > 0.5
  const fadeInEnd = 1;
  return (
    <motion.section
      className="quote-cards-section"
      style={{
        pointerEvents: cardsInteractive && isOpeningOutOfView && !zScrollComplete ? 'auto' : 'none',
        zIndex: scrollProgress > 0.6 ? 10 : 1,
        position: 'relative',
        minHeight: '160vh',
        height: 'auto',
        top: 'unset',
        left: 'unset',
        backgroundColor: 'transparent',
        overflowY: isOpeningOutOfView ? 'auto' : 'hidden',
      }}
    >
      <div
        className="quote-cards-grid"
        style={{
          // Remove animated margin, use static or none
          marginTop: "20vh",
          transition: 'margin-top 0.6s cubic-bezier(0.22,1,0.36,1)'
        }}
      >
        {quoteCardsData.map((card, index) => {
          const yOffset = card.animateY;
          const fadeInProgress = Math.max(0, Math.min(1, (scrollProgress - fadeInStart) / (fadeInEnd - fadeInStart)));
          const staggerDelay = index * quoteCards.staggerIn;
          const rawFadeInProgress = Math.max(0, Math.min(1, (fadeInProgress - staggerDelay) * quoteCards.fadeInSpeed));
          const easedFadeIn = EASING.out(rawFadeInProgress);
          // Gate both opacity and Y movement until threshold
          const fadeInOpacity = scrollProgress < fadeInStart ? 0 : easedFadeIn;
          const fadeInY = scrollProgress < fadeInStart ? yOffset : yOffset * (1 - easedFadeIn);
          return (
            <motion.div
              key={card.name}
              className="quote-card-wrapper"
              style={{
                opacity: fadeInOpacity,
                y: fadeInY
              }}
            >
              <QuoteCard
                name={card.name}
                quote={card.quote}
                imageUrl={card.imageUrl}
                nameColor={card.nameColor}
              />
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
