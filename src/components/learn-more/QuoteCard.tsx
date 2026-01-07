/**
 * QuoteCard Component
 * Card with image background, name at bottom, quote above name
 * Simple fade-in animation with delay
 */

import { motion } from 'framer-motion'
import './QuoteCard.css'

interface QuoteCardProps {
  name: string
  quote: string
  imageUrl?: string
  nameColor?: 'white' | 'dark-red' | 'light-red'
  delay?: number
}

export const QuoteCard = ({
  name,
  quote,
  imageUrl = '/LoadInImage-min.webp',
  nameColor = 'white',
  delay = 0
}: QuoteCardProps) => {
  // Split name into first and last
  const nameParts = name.split(' ')
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(' ')
  
  // Determine color based on nameColor prop
  const getNameColor = () => {
    switch(nameColor) {
      case 'dark-red':
        return '#590D0F'
      case 'light-red':
        return '#9E1B1E'
      default:
        return '#FFFFFF'
    }
  }
  
  return (
    <motion.div
      className="quote-card"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.22, 1, 0.36, 1]
      }}
    >
      {/* Image background */}
      <div
        className="quote-card-image"
        style={{ backgroundImage: `url(${imageUrl})` }}
      >
        {/* Dark overlay for text readability */}
        <div className="quote-card-overlay" />
      </div>

      {/* Content overlay */}
      <div className="quote-card-content">
        {/* Quote text - positioned above name */}
        <p className="quote-card-text">
          "{quote}"
        </p>

        {/* Name - bottom 18% of card, split into two lines */}
        <h3 className="quote-card-name" style={{ color: getNameColor() }}>
          <span className="name-first">{firstName}</span>
          <span className="name-last">{lastName}</span>
        </h3>
      </div>
    </motion.div>
  )
}
